#Requires -Version 5.1
<#
.SYNOPSIS
  Deploy customer + admin SPAs to Firebase Hosting (static files only).

.DESCRIPTION
  Use when Cloud Run services are not yet in the Firebase project.
  UI loads at the Hosting URLs; /api/* will not work until Cloud Run is
  deployed to the same project and you run deploy-firebase.ps1 (full).

.EXAMPLE
  .\deploy\deploy-firebase-hosting.ps1
  .\deploy\deploy-firebase-hosting.ps1 -SkipBuild
#>
param(
  [string] $ProjectId = $(if ($env:GCUL_FIREBASE_PROJECT) { $env:GCUL_FIREBASE_PROJECT } else {
    (Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json).projectId
  }),
  [switch] $SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$FbCfg = Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json
$CustomerSite = $FbCfg.customerHostingSite
$AdminSite = $FbCfg.adminHostingSite

if (-not $SkipBuild) {
  Write-Host "Building customer app (apps/web) ..."
  Push-Location (Join-Path $Root "apps/web")
  if (Test-Path "node_modules") { npm run build } else { npm ci; npm run build }
  Pop-Location

  Write-Host "Building admin app (apps/admin) ..."
  Push-Location (Join-Path $Root "apps/admin")
  if (Test-Path "node_modules") { npm run build } else { npm ci; npm run build }
  Pop-Location
}

if (-not (Test-Path (Join-Path $Root "apps/web/dist/index.html"))) {
  throw "Missing apps/web/dist - run npm run build in apps/web"
}
if (-not (Test-Path (Join-Path $Root "apps/admin/dist/index.html"))) {
  throw "Missing apps/admin/dist - run npm run build in apps/admin"
}

$firebaseJson = @{
  hosting = @(
    @{
      target = "customer"
      public = "apps/web/dist"
      ignore = @("firebase.json", "**/.*", "**/node_modules/**")
      rewrites = @(
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

Write-Host "Deploying Firebase Hosting (static SPA) to $ProjectId ..."
Push-Location $Root
firebase deploy --only hosting --project $ProjectId
Pop-Location

$customerUrl = if ($FbCfg.customerUrl) { $FbCfg.customerUrl } else { "https://${CustomerSite}.web.app" }
$adminUrl = if ($FbCfg.adminUrl) { $FbCfg.adminUrl } else { "https://${AdminSite}.web.app" }

Write-Host ""
Write-Host "Done. Hosting deployed."
Write-Host "  Customer: $customerUrl"
Write-Host "  Admin:    $adminUrl"
Write-Host ""
Write-Host "Note: /api/* calls need Cloud Run in the same Firebase project."
Write-Host "      Run deploy-cloud-run.ps1 with GCP_PROJECT=$ProjectId, then deploy-firebase.ps1 for full API rewrites."
