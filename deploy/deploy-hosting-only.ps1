#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ProjectId = "insure360-83a36"
$Region = "us-central1"
$FbCfg = Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json
$CustomerSite = $FbCfg.customerHostingSite
$AdminSite = $FbCfg.adminHostingSite
$ApiRewrites = Get-Content (Join-Path $PSScriptRoot "api-rewrites.json") -Raw | ConvertFrom-Json

$apiRunRewrites = @()
foreach ($e in $ApiRewrites) {
  $apiRunRewrites += @{
    source = $e.source
    run    = @{ serviceId = $e.serviceId; region = $Region }
  }
}

$firebaseJson = @{
  hosting = @(
    @{
      target   = "customer"
      public   = "apps/web/dist"
      ignore   = @("firebase.json", "**/.*", "**/node_modules/**")
      rewrites = @($apiRunRewrites + @(@{ source = "**"; destination = "/index.html" }))
    },
    @{
      target   = "admin"
      public   = "apps/admin/dist"
      ignore   = @("firebase.json", "**/.*", "**/node_modules/**")
      rewrites = @($apiRunRewrites + @(@{ source = "**"; destination = "/index.html" }))
    }
  )
}

$firebaseJson | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $Root "firebase.json")
Push-Location $Root
firebase target:apply hosting customer $CustomerSite --project $ProjectId
firebase target:apply hosting admin $AdminSite --project $ProjectId
firebase deploy --only hosting --project $ProjectId
Pop-Location
