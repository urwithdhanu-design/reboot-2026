#Requires -Version 5.1
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

& (Join-Path $PSScriptRoot "api-target.ps1") -Target cloud
& (Join-Path $PSScriptRoot "start-ui.ps1")

Write-Host ""
Write-Host "Cloud demo mode: UIs proxy /api/* to Cloud Run."
Write-Host "  Customer  http://localhost:5174"
Write-Host "  Admin     http://localhost:5175"
Write-Host "  Stop      local-dev.cmd stop ui"
