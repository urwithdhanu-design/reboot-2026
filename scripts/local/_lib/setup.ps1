#Requires -Version 5.1
param(
  [switch] $MessagingOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
Ensure-LocalDevDirs

Write-Host "GCUL local setup ($RepoRoot)"
Write-Host ""

# 1. gcul-messaging into local Maven repo
$mvnw = Join-Path $RepoRoot "apps\services\kyc-service\mvnw.cmd"
$messagingPom = Join-Path $RepoRoot "apps\libs\gcul-messaging\pom.xml"
if (-not (Test-Path $mvnw)) {
  throw "Missing $mvnw - clone the full repo first."
}
Write-Host "[1/3] Installing gcul-messaging into local Maven ..."
& $mvnw -q -f $messagingPom install -DskipTests
if ($LASTEXITCODE -ne 0) { throw "gcul-messaging install failed (exit $LASTEXITCODE)" }

if ($MessagingOnly) {
  Write-Host "Done (messaging only)."
  exit 0
}

# 2. npm install for UIs
foreach ($app in $UiApps) {
  $appDir = Join-Path $RepoRoot $app.dir
  Write-Host "[2/3] npm install in $($app.dir) ..."
  Push-Location $appDir
  try {
    npm install --no-fund --no-audit
    if ($LASTEXITCODE -ne 0) { throw "npm install failed in $($app.dir)" }
  } finally {
    Pop-Location
  }
}

# 3. Default API target for local full-stack
if (-not (Test-Path $ApiTargetFile)) {
  Write-Host "[3/5] Creating $ApiTargetFile (VITE_API_TARGET=local) ..."
  @(
    "# Shared dev API target (used by apps/web and apps/admin Vite)"
    "VITE_API_TARGET=local"
  ) | Set-Content -Path $ApiTargetFile -Encoding utf8
} else {
  Write-Host "[3/5] Keeping existing $ApiTargetFile (target=$(Get-ApiTarget))"
}

# 4. Python venv for Stallion chatbot (first API start is faster)
$chatbotDir = Join-Path $RepoRoot "apps\services\chatbot-assistance-service"
$chatbotVenv = Join-Path $chatbotDir ".venv"
if (-not (Test-Path $chatbotVenv)) {
  Write-Host "[4/5] Creating chatbot venv (Stallion on :8090) ..."
  python -m venv $chatbotVenv
  & "$chatbotVenv\Scripts\pip.exe" install -q -r (Join-Path $chatbotDir "requirements.txt")
} else {
  Write-Host "[4/5] Chatbot venv already exists"
}

# 5. Gmail SMTP for welcome / reset emails
. (Join-Path $PSScriptRoot "email-env.ps1")
Write-Host "[5/5] Email configuration ..."
Ensure-EmailEnvFiles -RepoRoot $RepoRoot | Out-Null

Write-Host ""
Write-Host "Setup complete. Next:"
Write-Host "  local-dev.cmd start     Full local stack"
Write-Host "  local-dev.cmd cloud     UI against Cloud Run APIs"
