#Requires -Version 5.1
<#
.SYNOPSIS
  One-shot migrate: provision infra + deploy all services to insure360-83a36.

.EXAMPLE
  cd C:\projects\gcul
  .\deploy\migrate-to-insure360.ps1

.EXAMPLE
  .\deploy\migrate-to-insure360.ps1 -SkipCloudRun
#>
param(
  [string] $ProjectId = "insure360-83a36",
  [string] $Region = "us-central1",
  [switch] $SkipCloudRun,
  [switch] $SkipFirebase,
  [switch] $SkipInfra
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$env:GCP_PROJECT = $ProjectId
$env:GCP_REGION = $Region
$env:GCUL_FIREBASE_PROJECT = $ProjectId
$env:GCUL_USE_CLOUD_SQL = "true"
$env:GCUL_USE_PUBSUB = "true"

Write-Host "=== GCUL migrate to $ProjectId ===" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipInfra) {
  Write-Host "[1/5] GCP project setup (APIs, Artifact Registry) ..."
  & (Join-Path $PSScriptRoot "setup-gcp-project.ps1") -ProjectId $ProjectId -Region $Region

  Write-Host ""
  Write-Host "[2/5] Cloud SQL (instance gcul-pg + per-service databases) ..."
  & (Join-Path $PSScriptRoot "setup-cloud-sql.ps1") -ProjectId $ProjectId -Region $Region

  Write-Host ""
  Write-Host "[3/5] Pub/Sub topics + subscriptions ..."
  & (Join-Path $PSScriptRoot "setup-pubsub.ps1") -ProjectId $ProjectId -CreateSubscriptions

  Write-Host ""
  Write-Host "[4/5] Firestore API + cache IAM ..."
  & (Join-Path $PSScriptRoot "setup-firestore.ps1") -ProjectId $ProjectId -CloudRunProject $ProjectId
} else {
  Write-Host "Skipping infra (-SkipInfra)" -ForegroundColor Yellow
}

if (-not $SkipCloudRun) {
  Write-Host ""
  Write-Host "[5a] Cloud Run (all microservices; may take 30-60 min) ..."
  & (Join-Path $PSScriptRoot "deploy-cloud-run.ps1") -ProjectId $ProjectId -Region $Region
} else {
  Write-Host "Skipping Cloud Run (-SkipCloudRun)" -ForegroundColor Yellow
}

if (-not $SkipFirebase) {
  Write-Host ""
  Write-Host "[5b] Firebase Hosting + API rewrites + Firestore rules ..."
  & (Join-Path $PSScriptRoot "deploy-firebase.ps1") -ProjectId $ProjectId -CloudRunProject $ProjectId

  Write-Host ""
  Write-Host "Syncing local cloud API targets ..."
  & (Join-Path $PSScriptRoot "sync-cloud-api-targets.ps1") -ProjectId $ProjectId
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  Customer: https://insure360-83a36.web.app"
Write-Host "  Admin:    https://insure360-83a36-admin.firebaseapp.com"
Write-Host "  Console:  https://console.cloud.google.com/run?project=$ProjectId"
Write-Host "  Access:   docs/HOSTING-ACCESS.md"
