#Requires -Version 5.1
<#
.SYNOPSIS
  Build and deploy all GCUL microservices to Cloud Run.

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\deploy-cloud-run.ps1

.EXAMPLE
  $env:GCUL_USE_CLOUD_SQL = "true"
  .\deploy\deploy-cloud-run.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { throw "Set GCP_PROJECT" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }),
  [switch] $SkipBuild,
  [string[]] $ServiceIds = @()
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ManifestPath = Join-Path $PSScriptRoot "services.json"
$Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$Repo = $Manifest.artifactRepo
$CloudBuildConfig = Join-Path $PSScriptRoot "cloudbuild-service.yaml"

$minInst = if ($Manifest.cloudRun.minInstances -ne $null) { $Manifest.cloudRun.minInstances } else { 0 }
$maxInst = if ($Manifest.cloudRun.maxInstances -ne $null) { $Manifest.cloudRun.maxInstances } else { 5 }
$concurrency = if ($Manifest.cloudRun.concurrency -ne $null) { $Manifest.cloudRun.concurrency } else { 80 }

$useCloudSql = $env:GCUL_USE_CLOUD_SQL -eq "true"
if (-not $useCloudSql) {
  $connPathAuto = Join-Path $PSScriptRoot "cloud-sql-connection.json"
  if (Test-Path $connPathAuto) {
    $useCloudSql = $true
    Write-Host "GCUL_USE_CLOUD_SQL not set; using Cloud SQL (found cloud-sql-connection.json). Set GCUL_USE_CLOUD_SQL=false to deploy with ephemeral H2." -ForegroundColor Yellow
  }
}
$usePubSub = $env:GCUL_USE_PUBSUB -eq "true"
$cloudSqlConn = $null
$sqlCfg = $null
$dbSecret = $null
if ($useCloudSql) {
  $connPath = Join-Path $PSScriptRoot "cloud-sql-connection.json"
  if (-not (Test-Path $connPath)) {
    throw "Run .\deploy\setup-cloud-sql.ps1 first (missing cloud-sql-connection.json)"
  }
  $conn = Get-Content $connPath -Raw | ConvertFrom-Json
  $cloudSqlConn = $conn.connectionName
  $sqlCfg = Get-Content (Join-Path $PSScriptRoot "cloud-sql.json") -Raw | ConvertFrom-Json
  $dbSecret = $sqlCfg.secretName
  Write-Host "Cloud SQL enabled: $cloudSqlConn" -ForegroundColor Green
}
if ($usePubSub) {
  $pubsubPath = Join-Path $PSScriptRoot "pubsub-topics.json"
  if (-not (Test-Path $pubsubPath)) {
    throw "Run .\deploy\setup-pubsub.ps1 first (missing pubsub-topics.json)"
  }
  Write-Host "Pub/Sub enabled for project $ProjectId" -ForegroundColor Green
}

gcloud config set project $ProjectId

$deployedUrls = @{}

if ($ServiceIds.Count -eq 1 -and $ServiceIds[0] -match ',') {
  $ServiceIds = $ServiceIds[0].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

$serviceList = @($Manifest.services)
if ($ServiceIds.Count -gt 0) {
  $want = @{}
  foreach ($s in $ServiceIds) { $want[$s] = $true }
  $serviceList = @($Manifest.services | Where-Object { $want.ContainsKey($_.id) })
  if ($serviceList.Count -eq 0) {
    throw "No matching services in services.json for: $($ServiceIds -join ', ')"
  }
  Write-Host "Deploying subset: $($serviceList.id -join ', ')" -ForegroundColor Cyan
}

foreach ($svc in $serviceList) {
  $id = $svc.id
  $image = "$Region-docker.pkg.dev/$ProjectId/$Repo/${id}:latest"
  Write-Host "`n=== $id ===" -ForegroundColor Cyan

  if (-not $SkipBuild) {
    # Windows: avoid concurrent gcloud submit temp-file locks; small pause between services
    if ($deployedUrls.Count -gt 0) { Start-Sleep -Seconds 3 }
    gcloud builds submit $Root `
      --config $CloudBuildConfig `
      --substitutions="_IMAGE=$image,_DOCKERFILE=$($svc.dockerfile),_SERVICE_DIR=$($svc.dir)" `
      --project $ProjectId `
      --quiet
    if ($LASTEXITCODE -ne 0) {
      throw "Cloud Build failed for $id (exit $LASTEXITCODE)"
    }
  }

  $envPairs = @("SPRING_PROFILES_ACTIVE=cloud")
  if ($svc.env) {
    $svc.env.PSObject.Properties | ForEach-Object {
      $envPairs += "$($_.Name)=$($_.Value)"
    }
  }

  $dbName = $null
  if ($useCloudSql -and $sqlCfg.serviceDatabases.PSObject.Properties.Name -contains $id) {
    $dbName = $sqlCfg.serviceDatabases.$id
    $envPairs += @(
      "GCUL_CLOUD_SQL_ENABLED=true",
      "GCUL_CLOUD_SQL_INSTANCE=$cloudSqlConn",
      "GCUL_DB_NAME=$dbName",
      "GCUL_DB_USER=$($sqlCfg.dbUser)"
    )
  }
  if ($usePubSub) {
    $envPairs += @(
      "GCUL_PUBSUB_ENABLED=true",
      "GCUL_PUBSUB_PROJECT=$ProjectId",
      "GCUL_PUBSUB_TOPIC_PREFIX=gcul"
    )
  }
  if ($id -eq "gcul-kyc") {
    $adminEmail = if ($env:GCUL_ADMIN_EMAIL) { $env:GCUL_ADMIN_EMAIL } else { "admin@reboot2026.local" }
    $adminPass = if ($env:GCUL_ADMIN_PASSWORD) { $env:GCUL_ADMIN_PASSWORD } else { "Reboot2026!Admin" }
    $envPairs += @(
      "GCUL_ADMIN_SEED=true",
      "GCUL_ADMIN_EMAIL=$adminEmail",
      "GCUL_ADMIN_PASSWORD=$adminPass"
    )
  }
  if ($id -in @('gcul-policy', 'gcul-kyc', 'gcul-payment')) {
    $firebaseProject = if ($env:GCUL_FIREBASE_PROJECT) { $env:GCUL_FIREBASE_PROJECT } else {
      (Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json).projectId
    }
    $envPairs += @(
      "GCUL_FIRESTORE_ENABLED=true",
      "GCUL_FIRESTORE_PROJECT=$firebaseProject"
    )
  }
  if ($id -eq "gcul-wallet" -and $deployedUrls.ContainsKey("gcul-kyc")) {
    $envPairs += "GCUL_KYC_SERVICE_URL=$($deployedUrls['gcul-kyc'])"
  }

  $deployArgs = @(
    "run", "deploy", $id,
    "--image", $image,
    "--region", $Region,
    "--platform", "managed",
    "--allow-unauthenticated",
    "--port", "$($svc.port)",
    "--memory", $(if ($svc.memory) { $svc.memory } else { "512Mi" }),
    "--min-instances", "$minInst",
    "--max-instances", "$maxInst",
    "--concurrency", "$concurrency",
    "--project", $ProjectId,
    "--quiet"
  )
  if ($svc.cpu) { $deployArgs += @("--cpu", $svc.cpu) }
  if ($svc.timeout) { $deployArgs += @("--timeout", $svc.timeout) }
  if ($dbName) {
    $deployArgs += @("--add-cloudsql-instances", $cloudSqlConn)
    $deployArgs += @("--set-secrets", "GCUL_DB_PASSWORD=${dbSecret}:latest")
  }
  if ($envPairs.Count -gt 0) {
    $deployArgs += @("--set-env-vars", ($envPairs -join ","))
  }

  gcloud @deployArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Cloud Run deploy failed for $id (exit $LASTEXITCODE) - continuing with remaining services"
  }
  $url = gcloud run services describe $id --region $Region --project $ProjectId --format="value(status.url)"
  $deployedUrls[$id] = $url
  Write-Host "URL: $url"
}

# Wire orchestrator to other Cloud Run services (full deploy only)
$orchId = "gcul-blockchain-orchestrator"
if ($ServiceIds.Count -eq 0 -and $deployedUrls.ContainsKey($orchId)) {
  Write-Host "`nLinking blockchain orchestrator to peer services ..." -ForegroundColor Cyan
  $orchEnv = @(
    "SPRING_PROFILES_ACTIVE=cloud",
    "GCUL_SIDECAR_URL=$($deployedUrls['gcul-sidecar'])",
    "GCUL_CLAIMS_SERVICE_URL=$($deployedUrls['gcul-claims'])",
    "GCUL_NOTIFICATION_SERVICE_URL=$($deployedUrls['gcul-notification'])",
    "GCUL_PAYMENT_SERVICE_URL=$($deployedUrls['gcul-payment'])",
    "GCUL_BLOCKCHAIN_SERVICE_URL=$($deployedUrls[$orchId])"
  )
  if ($usePubSub) {
    $orchEnv += @(
      "GCUL_PUBSUB_ENABLED=true",
      "GCUL_PUBSUB_PROJECT=$ProjectId",
      "GCUL_PUBSUB_TOPIC_PREFIX=gcul"
    )
  }
  if ($useCloudSql -and $sqlCfg.serviceDatabases.PSObject.Properties.Name -contains $orchId) {
    $orchEnv += @(
      "GCUL_CLOUD_SQL_ENABLED=true",
      "GCUL_CLOUD_SQL_INSTANCE=$cloudSqlConn",
      "GCUL_DB_NAME=$($sqlCfg.serviceDatabases.$orchId)",
      "GCUL_DB_USER=$($sqlCfg.dbUser)"
    )
  }
  $orchArgs = @(
    "run", "services", "update", $orchId,
    "--region", $Region,
    "--project", $ProjectId,
    "--set-env-vars", ($orchEnv -join ","),
    "--quiet"
  )
  if ($useCloudSql) {
    $orchArgs += @("--add-cloudsql-instances", $cloudSqlConn)
    $orchArgs += @("--update-secrets", "GCUL_DB_PASSWORD=${dbSecret}:latest")
  }
  gcloud @orchArgs
}

$outFile = Join-Path $PSScriptRoot "cloud-run-urls.json"
if ($ServiceIds.Count -gt 0 -and (Test-Path $outFile)) {
  $existing = Get-Content $outFile -Raw | ConvertFrom-Json
  $existing.PSObject.Properties | ForEach-Object { $deployedUrls[$_.Name] = $_.Value }
}
$deployedUrls | ConvertTo-Json | Set-Content -Encoding utf8 $outFile
Write-Host "`nWrote service URLs to $outFile"
Write-Host "Cost notes: deploy/COST.md"
Write-Host "Deploy Firebase hosting next: .\deploy\deploy-firebase.ps1"
