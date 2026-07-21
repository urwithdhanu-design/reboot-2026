#Requires -Version 5.1
<#
.SYNOPSIS
  Provision one low-cost Cloud SQL (PostgreSQL) instance with one database per Java microservice.

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\setup-cloud-sql.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { throw "Set GCP_PROJECT" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }),
  [string] $RootPassword = $env:GCUL_DB_ROOT_PASSWORD
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Cfg = Get-Content (Join-Path $PSScriptRoot "cloud-sql.json") -Raw | ConvertFrom-Json
$Instance = $Cfg.instanceName

gcloud config set project $ProjectId
gcloud services enable sqladmin.googleapis.com secretmanager.googleapis.com --project $ProjectId

$prevEa = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

$exists = $false
gcloud sql instances describe $Instance --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { $exists = $true }

if (-not $exists) {
  if (-not $RootPassword) {
    $RootPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    Write-Host "Generated postgres root password (save it): $RootPassword"
  }
  Write-Host "Creating Cloud SQL instance '$Instance' (tier $($Cfg.tier), zonal, HDD) ..."
  gcloud sql instances create $Instance `
    --database-version=$($Cfg.databaseVersion) `
    --tier=$($Cfg.tier) `
    --region=$Region `
    --storage-size=$($Cfg.storageGb) `
    --storage-type=$($Cfg.storageType) `
    --availability-type=$($Cfg.availabilityType) `
    --root-password=$RootPassword `
    --project $ProjectId
  if ($LASTEXITCODE -ne 0) { throw "Cloud SQL instance create failed (exit $LASTEXITCODE)" }
}

$conn = gcloud sql instances describe $Instance --project $ProjectId --format="value(connectionName)"
Write-Host "Connection name: $conn"

foreach ($prop in $Cfg.serviceDatabases.PSObject.Properties) {
  $dbName = $prop.Value
  $dbExists = $false
  gcloud sql databases describe $dbName --instance=$Instance --project $ProjectId 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $dbExists = $true }
  if (-not $dbExists) {
    Write-Host "Creating database $dbName ..."
    gcloud sql databases create $dbName --instance=$Instance --project $ProjectId
  }
}

$appUser = $Cfg.dbUser
$users = @(gcloud sql users list --instance=$Instance --project $ProjectId --format="value(name)" 2>$null)
if ($users -notcontains $appUser) {
  $appPass = if ($env:GCUL_DB_PASSWORD) { $env:GCUL_DB_PASSWORD } else { -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ }) }
  Write-Host "Creating user $appUser ..."
  gcloud sql users create $appUser --instance=$Instance --password=$appPass --project $ProjectId
  $secret = $Cfg.secretName
  $secretExists = $false
  gcloud secrets describe $secret --project $ProjectId 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $secretExists = $true }
  if (-not $secretExists) {
    gcloud secrets create $secret --replication-policy="automatic" --project $ProjectId
    if ($LASTEXITCODE -ne 0) { throw "Failed to create secret $secret" }
  }
  $appPass | gcloud secrets versions add $secret --data-file=- --project $ProjectId
  Write-Host "App DB password stored in Secret Manager: $secret"
  $projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
  $runSa = "$projectNumber-compute@developer.gserviceaccount.com"
  gcloud secrets add-iam-policy-binding $secret `
    --member="serviceAccount:$runSa" `
    --role="roles/secretmanager.secretAccessor" `
    --project $ProjectId `
    --quiet | Out-Null
} else {
  Write-Host "User $appUser already exists - syncing password from Secret Manager if present ..."
  $secret = $Cfg.secretName
  $secretExists = $false
  gcloud secrets describe $secret --project $ProjectId 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $secretExists = $true }
  if ($secretExists) {
    $appPass = (gcloud secrets versions access latest --secret=$secret --project $ProjectId 2>$null).Trim()
    if ($appPass) {
      gcloud sql users set-password $appUser --instance=$Instance --password=$appPass --project $ProjectId --quiet
      if ($LASTEXITCODE -eq 0) {
        Write-Host "Updated Cloud SQL user $appUser password to match secret $secret"
      } else {
        Write-Host "WARN: Could not update $appUser password (check permissions)" -ForegroundColor Yellow
      }
    }
  } else {
    Write-Host "Secret $secret not found - password unchanged."
  }
}

$runSa = gcloud iam service-accounts list --project $ProjectId --filter="displayName:Compute Engine default" --format="value(email)" 2>$null
if (-not $runSa) {
  $projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
  $runSa = "$projectNumber-compute@developer.gserviceaccount.com"
}
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$runSa" `
  --role="roles/cloudsql.client" `
  --quiet | Out-Null

$out = @{
  connectionName = $conn
  instanceName   = $Instance
  region         = $Region
  dbUser         = $appUser
  secretName     = $Cfg.secretName
  serviceDatabases = $Cfg.serviceDatabases
}
$outPath = Join-Path $PSScriptRoot "cloud-sql-connection.json"
$out | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $outPath
$ErrorActionPreference = $prevEa
Write-Host "Wrote $outPath"
Write-Host "Next: `$env:GCUL_USE_CLOUD_SQL = 'true'; .\deploy\deploy-cloud-run.ps1"
