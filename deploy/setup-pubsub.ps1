#Requires -Version 5.1
<#
.SYNOPSIS
  Create Pub/Sub topics (and optional pull subscriptions) for GCUL microservices.

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\setup-pubsub.ps1

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\setup-pubsub.ps1 -CreateSubscriptions
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { throw "Set GCP_PROJECT" }),
  [switch] $CreateSubscriptions
)

$ErrorActionPreference = "Stop"
$CfgPath = Join-Path $PSScriptRoot "pubsub.json"
$Cfg = Get-Content $CfgPath -Raw | ConvertFrom-Json
$prefix = $Cfg.topicPrefix

gcloud config set project $ProjectId
gcloud services enable pubsub.googleapis.com --project $ProjectId

$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$runSa = "$projectNumber-compute@developer.gserviceaccount.com"
$Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" })

function Grant-PubSubToServiceAccount([string] $Email) {
  if ([string]::IsNullOrWhiteSpace($Email)) { return }
  Write-Host "Granting pubsub.publisher + pubsub.subscriber to $Email"
  gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$Email" `
    --role="roles/pubsub.publisher" `
    --quiet | Out-Null
  gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$Email" `
    --role="roles/pubsub.subscriber" `
    --quiet | Out-Null
}

$grantEmails = [System.Collections.Generic.HashSet[string]]::new()
[void] $grantEmails.Add($runSa)

$manifestPath = Join-Path $PSScriptRoot "services.json"
if (Test-Path $manifestPath) {
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  foreach ($svc in $manifest.services) {
    $id = $svc.id
    $sa = ""
    try {
      $sa = gcloud run services describe $id --region $Region --project $ProjectId `
        --format="value(spec.template.spec.serviceAccountName)" 2>$null
    } catch { }
    if ($sa -and -not [string]::IsNullOrWhiteSpace($sa)) {
      [void] $grantEmails.Add($sa)
    }
  }
}

foreach ($email in $grantEmails) {
  Grant-PubSubToServiceAccount $email
}

$createdTopics = @()
foreach ($t in $Cfg.topics) {
  $topicId = "$prefix.$($t.suffix)"
  $exists = $false
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $null = gcloud pubsub topics describe $topicId --project $ProjectId 2>&1
  if ($LASTEXITCODE -eq 0) { $exists = $true }
  $ErrorActionPreference = $prevEap
  if (-not $exists) {
    Write-Host "Creating topic $topicId ..."
    gcloud pubsub topics create $topicId --project $ProjectId --quiet
  } else {
    Write-Host "Topic exists: $topicId"
  }
  $createdTopics += $topicId

  if ($CreateSubscriptions) {
    foreach ($subSvc in $t.subscribers) {
      $subId = "$topicId--$subSvc".Replace(".", "-")
      $subExists = $false
      $prevEap = $ErrorActionPreference
      $ErrorActionPreference = "SilentlyContinue"
      $null = gcloud pubsub subscriptions describe $subId --project $ProjectId 2>&1
      if ($LASTEXITCODE -eq 0) { $subExists = $true }
      $ErrorActionPreference = $prevEap
      if (-not $subExists) {
        Write-Host "  subscription $subId (pull, ack 60s) ..."
        gcloud pubsub subscriptions create $subId `
          --topic=$topicId `
          --ack-deadline=60 `
          --message-retention-duration=7d `
          --project $ProjectId `
          --quiet
      }
    }
  }
}

$out = @{
  projectId    = $ProjectId
  topicPrefix  = $prefix
  topics       = $createdTopics
  runServiceAccount = $runSa
}
$outPath = Join-Path $PSScriptRoot "pubsub-topics.json"
$out | ConvertTo-Json | Set-Content -Encoding utf8 $outPath
Write-Host "Wrote $outPath"
Write-Host "Next: set `$env:GCUL_USE_PUBSUB='true' and redeploy Cloud Run (sets GCUL_PUBSUB_ENABLED on each service)."
Write-Host "  deploy\setup-pubsub.cmd   or   deploy\deploy-cloud-run.cmd  (with GCUL_USE_PUBSUB=true)"
