#Requires -Version 5.1
<#
.SYNOPSIS
  Refresh deploy/cloud-api.targets.json from live Cloud Run URLs.
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" })
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  $map = @{
  "gcul-kyc" = "kyc"
  "gcul-wallet" = "wallet"
  "gcul-policy" = "policy"
  "gcul-payment" = "payment"
  "gcul-notification" = "notification"
  "gcul-claims" = "claims"
  "gcul-parametric" = "parametric"
  "gcul-premium-deposit" = "premiumDeposit"
  "gcul-blockchain-orchestrator" = "blockchain"
  "gcul-chatbot" = "chatbot"
}

$json = Get-Content (Join-Path $PSScriptRoot "cloud-api.targets.json") -Raw | ConvertFrom-Json
$services = @{}
foreach ($entry in $map.GetEnumerator()) {
  $url = gcloud run services describe $entry.Key --region $Region --project $ProjectId --format="value(status.url)" 2>$null
  if ($url) { $services[$entry.Value] = $url }
}
$json.project = $ProjectId
$json.region = $Region
$json.firebaseHosting = "https://${ProjectId}.web.app"
$json.firebaseAdminHosting = "https://gcul-admin.web.app"
$json.services = $services
$out = Join-Path $PSScriptRoot "cloud-api.targets.json"
$json | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 $out
Write-Host "Updated $out"
