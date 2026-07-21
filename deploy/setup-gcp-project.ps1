#Requires -Version 5.1
<#
.SYNOPSIS
  Create or configure a GCP project for GCUL (APIs, Artifact Registry, Firebase link).

.PARAMETER ProjectId
  GCP / Firebase project id (default: insure360-83a36).

.PARAMETER BillingAccount
  Billing account ID (required when creating a brand-new project).

.EXAMPLE
  $env:GCP_PROJECT = "my-gcul-prod"
  .\deploy\setup-gcp-project.ps1 -BillingAccount "XXXXXX-YYYYYY-ZZZZZZ"
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "insure360-83a36" }),
  [string] $BillingAccount = $env:GCP_BILLING_ACCOUNT,
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" })
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "GCUL GCP setup — project: $ProjectId region: $Region"

$exists = $true
try {
  gcloud projects describe $ProjectId --format="value(projectId)" 2>$null | Out-Null
} catch {
  $exists = $false
}

if (-not $exists) {
  if (-not $BillingAccount) {
    throw "Project '$ProjectId' does not exist. Set -BillingAccount or GCP_BILLING_ACCOUNT to create it."
  }
  Write-Host "Creating project $ProjectId ..."
  gcloud projects create $ProjectId --name="GCUL Insurance"
  gcloud billing projects link $ProjectId --billing-account=$BillingAccount
}

gcloud config set project $ProjectId

$apis = @(
  "run.googleapis.com",
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
  "sqladmin.googleapis.com",
  "secretmanager.googleapis.com",
  "pubsub.googleapis.com",
  "firebase.googleapis.com"
)
foreach ($api in $apis) {
  Write-Host "Enabling $api ..."
  gcloud services enable $api --project $ProjectId
}

$repo = "gcul"
$repoExists = $true
try { gcloud artifacts repositories describe $repo --location=$Region --project=$ProjectId | Out-Null } catch { $repoExists = $false }
if (-not $repoExists) {
  Write-Host "Creating Artifact Registry repo '$repo' in $Region ..."
  gcloud artifacts repositories create $repo `
    --repository-format=docker `
    --location=$Region `
    --description="GCUL Cloud Run images" `
    --project=$ProjectId
}

Write-Host "Linking Firebase (if not already) ..."
try {
  firebase projects:addfirebase $ProjectId
} catch {
  Write-Host "Firebase may already be enabled on this project (continuing)."
}

$adminSite = "gcul-admin"
$sites = firebase hosting:sites:list --project $ProjectId --json 2>$null | ConvertFrom-Json
$siteIds = @($sites.result.sites | ForEach-Object { $_.siteId })
if ($siteIds -notcontains $adminSite) {
  Write-Host "Creating Firebase Hosting site '$adminSite' for admin app ..."
  firebase hosting:sites:create $adminSite --project $ProjectId
}

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  `$env:GCP_PROJECT = '$ProjectId'"
Write-Host "  .\deploy\deploy-cloud-run.ps1"
Write-Host "  .\deploy\deploy-firebase.ps1"
