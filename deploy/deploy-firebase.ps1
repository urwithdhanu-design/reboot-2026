#Requires -Version 5.1
<#
.SYNOPSIS
  Build customer + admin SPAs and deploy to Firebase Hosting with Cloud Run API rewrites.

.EXAMPLE
  $env:GCP_PROJECT = "insure360-83a36"
  .\deploy\deploy-firebase.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" })
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
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
$customerSite = $ProjectId
firebase target:apply hosting customer $customerSite --project $ProjectId
firebase target:apply hosting admin gcul-admin --project $ProjectId

Write-Host "Deploying Firebase Hosting (customer + admin) + Firestore rules ..."
Push-Location $Root
firebase deploy --only hosting,firestore:rules --project $ProjectId
Pop-Location

$customerUrl = "https://${ProjectId}.web.app"
Write-Host "Setting KYC WEB_BASE_URL to $customerUrl ..."
gcloud run services update gcul-kyc `
  --region $Region `
  --project $ProjectId `
  --update-env-vars "WEB_BASE_URL=$customerUrl" `
  --quiet

Write-Host "Done. Customer and admin sites use same-origin /api/* rewrites to Cloud Run."
Write-Host "  Customer: $customerUrl"
Write-Host "  Admin:    https://gcul-admin.web.app"
