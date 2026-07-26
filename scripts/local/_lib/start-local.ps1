#Requires -Version 5.1
param(
  [switch] $IncludePython
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

& (Join-Path $PSScriptRoot "api-target.ps1") -Target local

$CantonScript = Join-Path $PSScriptRoot "..\start-canton.ps1"
if (Test-Path $CantonScript) {
  Write-Host "Starting Canton local sandbox ..."
  & $CantonScript
}

& (Join-Path $PSScriptRoot "start-apis.ps1") -IncludePython:$IncludePython
& (Join-Path $PSScriptRoot "start-ui.ps1")

Write-Host ""
Write-Host "Local stack starting."
Write-Host "  Customer  http://localhost:5174"
Write-Host "  Admin     http://localhost:5175"
Write-Host "  Status    local-dev.cmd status"
Write-Host "  Stop      local-dev.cmd stop"
