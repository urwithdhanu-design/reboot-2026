#Requires -Version 5.1
param(
  [switch] $Force
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
Ensure-LocalDevDirs

$target = Get-ApiTarget
Write-Host "Starting UIs (API target: $target) ..."

foreach ($app in $UiApps) {
  $port = $app.port
  if ((Test-PortListening $port) -and -not $Force) {
    Write-Host "Skip $($app.id) - port $port already in use"
    continue
  }

  $appDir = Join-Path $RepoRoot $app.dir
  if (-not (Test-Path (Join-Path $appDir "node_modules"))) {
    Write-Host "Missing node_modules in $($app.dir) - run: local-dev.cmd setup"
    Push-Location $appDir
    try {
      npm install --no-fund --no-audit
      if ($LASTEXITCODE -ne 0) { throw "npm install failed in $($app.dir)" }
    } finally {
      Pop-Location
    }
  }

  $log = Join-Path $LogDir "$($app.id).log"
  if (Test-Path $log) { Remove-Item $log -Force }
  # Build this for cmd.exe without nested PowerShell quote escapes.  The
  # previous form was parsed as an operator by Windows PowerShell 5.1.
  $cmd = 'cd /d "' + $appDir + '" && npm run dev > "' + $log + '" 2>&1'
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden
  Write-Host "Started $($app.id) on :$port -> $log"
}

Write-Host ""
Write-Host "Customer: http://localhost:5174"
Write-Host "Admin:    http://localhost:5175"
