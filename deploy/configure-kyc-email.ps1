#Requires -Version 5.1
<#
.SYNOPSIS
  Configure Gmail SMTP on gcul-kyc (same env vars as Kindred email-api).

  Reads EMAIL_USER / EMAIL_PASS / EMAIL_FROM_NAME from:
    - $env:EMAIL_USER / $env:EMAIL_PASS / $env:EMAIL_FROM_NAME, or
    - C:\projects\kindred-circle-crm\email-api\.env (reference project; not modified)

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\configure-kyc-email.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }),
  [string] $KindredEnvPath = "C:\projects\kindred-circle-crm\email-api\.env",
  [string] $FromName = $(if ($env:EMAIL_FROM_NAME) { $env:EMAIL_FROM_NAME } else { "Reboot 2026 Insurance" })
)

$ErrorActionPreference = "Stop"
$prevEa = $ErrorActionPreference

function Read-DotEnv([string] $path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $eq = $line.IndexOf("=")
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
    if ($k -eq "EMAIL_PASS") { $v = $v -replace "\s", "" }
    $map[$k] = $v
  }
  return $map
}

$fromFile = Read-DotEnv $KindredEnvPath
$emailUser = if ($env:EMAIL_USER) { $env:EMAIL_USER } else { $fromFile["EMAIL_USER"] }
$emailPass = if ($env:EMAIL_PASS) { ($env:EMAIL_PASS -replace "\s", "") } else { $fromFile["EMAIL_PASS"] }
# Branding is GCUL-specific — never inherit Kindred EMAIL_FROM_NAME (e.g. SalesDesk Pro).
$fromName = $FromName
if (-not $fromName) { $fromName = "Reboot 2026 Insurance" }

if (-not $emailUser -or -not $emailPass) {
  throw "Set EMAIL_USER and EMAIL_PASS (or provide Kindred .env at $KindredEnvPath)"
}

$secretPass = "gcul-email-pass"
$ErrorActionPreference = "SilentlyContinue"
gcloud secrets describe $secretPass --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud secrets create $secretPass --replication-policy=automatic --project $ProjectId
}
$ErrorActionPreference = $prevEa

$emailPass | gcloud secrets versions add $secretPass --data-file=- --project $ProjectId

$pn = gcloud projects describe $ProjectId --format="value(projectNumber)"
$runSa = "$pn-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding $secretPass `
  --member="serviceAccount:$runSa" `
  --role="roles/secretmanager.secretAccessor" `
  --project $ProjectId `
  --quiet | Out-Null

$webBase = "https://${ProjectId}.web.app"
$envVars = "EMAIL_USER=$emailUser,EMAIL_FROM_NAME=$fromName,EMAIL_ENABLED=true,WEB_BASE_URL=$webBase,SPRING_PROFILES_ACTIVE=cloud"

Write-Host "Updating gcul-kyc with Gmail SMTP (Kindred-style EMAIL_USER / EMAIL_PASS secret) ..."
gcloud run services update gcul-kyc `
  --region $Region `
  --project $ProjectId `
  --update-env-vars $envVars `
  --update-secrets "EMAIL_PASS=${secretPass}:latest" `
  --quiet

Write-Host "Updating gcul-notification with same Gmail SMTP (ops DL / Pub/Sub alerts) ..."
gcloud run services update gcul-notification `
  --region $Region `
  --project $ProjectId `
  --update-env-vars $envVars `
  --update-secrets "EMAIL_PASS=${secretPass}:latest" `
  --quiet

Write-Host "Updating gcul-policy with same Gmail SMTP (quote / payment emails) ..."
gcloud run services update gcul-policy `
  --region $Region `
  --project $ProjectId `
  --update-env-vars $envVars `
  --update-secrets "EMAIL_PASS=${secretPass}:latest" `
  --quiet

Write-Host "Done. Emails send as '$fromName' from $emailUser"
