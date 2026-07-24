#Requires -Version 5.1
<#
.SYNOPSIS
  Build customer + admin SPAs and deploy to Firebase Hosting with Cloud Run API rewrites.

.EXAMPLE
  $env:GCP_PROJECT = "insure360-83a36"
  .\deploy\deploy-firebase.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCUL_FIREBASE_PROJECT) { $env:GCUL_FIREBASE_PROJECT } else {
    (Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json).projectId
  }),
  [string] $CloudRunProject = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }),
  [switch] $HostingOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$FbCfg = Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json
$CustomerSite = $FbCfg.customerHostingSite
$AdminSite = $FbCfg.adminHostingSite
$RewritesPath = Join-Path $PSScriptRoot "api-rewrites.json"
$ApiRewrites = Get-Content $RewritesPath -Raw | ConvertFrom-Json

function New-FirebaseApiRewrites {
  param($Entries, [string] $Region)
  $list = @()
  foreach ($e in $Entries) {
    $list += @{
      source  = $e.source
      run     = @{
        serviceId = $e.serviceId
        region    = $Region
      }
    }
  }
  return $list
}

$apiRunRewrites = New-FirebaseApiRewrites -Entries $ApiRewrites -Region $Region

Write-Host "Building customer app (apps/web) ..."
  Push-Location (Join-Path $Root "apps/web")
  if (Test-Path "node_modules") { npm run build } else { npm ci; npm run build }
  Pop-Location

  Write-Host "Building admin app (apps/admin) ..."
  Push-Location (Join-Path $Root "apps/admin")
  if (Test-Path "node_modules") { npm run build } else { npm ci; npm run build }
Pop-Location

$firebaseJson = @{
  firestore = @{
    rules = "deploy/firestore.rules"
  }
  hosting = @(
    @{
      target = "customer"
      public = "apps/web/dist"
      ignore = @("firebase.json", "**/.*", "**/node_modules/**")
      rewrites = @(
        $apiRunRewrites
        @{
          source = "**"
          destination = "/index.html"
        }
      )
    },
    @{
      target = "admin"
      public = "apps/admin/dist"
      ignore = @("firebase.json", "**/.*", "**/node_modules/**")
      rewrites = @(
        $apiRunRewrites
        @{
          source = "**"
          destination = "/index.html"
        }
      )
    }
  )
}

$firebasePath = Join-Path $Root "firebase.json"
$firebaseJson | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $firebasePath

Write-Host "Applying Firebase hosting targets ..."
firebase target:apply hosting customer $CustomerSite --project $ProjectId
firebase target:apply hosting admin $AdminSite --project $ProjectId

$deployOnly = if ($HostingOnly) { "hosting" } else { "hosting,firestore:rules" }
Write-Host "Deploying Firebase ($deployOnly) ..."
Push-Location $Root
firebase deploy --only $deployOnly --project $ProjectId
Pop-Location

$customerUrl = $FbCfg.customerUrl
if (-not $customerUrl) { $customerUrl = "https://${CustomerSite}.web.app" }
$adminUrl = $FbCfg.adminUrl
if (-not $adminUrl) { $adminUrl = "https://${AdminSite}.web.app" }
Write-Host "Setting KYC WEB_BASE_URL to $customerUrl (Cloud Run project: $CloudRunProject) ..."
gcloud run services update gcul-kyc `
  --region $Region `
  --project $CloudRunProject `
  --update-env-vars "WEB_BASE_URL=$customerUrl" `
  --quiet

Write-Host "Done. Customer and admin sites deployed to Firebase Hosting."
Write-Host "  Customer: $customerUrl"
Write-Host "  Admin:    $adminUrl"
