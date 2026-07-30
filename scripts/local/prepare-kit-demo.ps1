#Requires -Version 5.1
<#
.SYNOPSIS
  Start Canton + APIs for Canton kit live / integration tests (admin UI smoke tests).

.EXAMPLE
  local-dev.cmd kit-demo
  cd apps\admin && npm run dev
  Open http://localhost:5175/capital-market/kit?view=recommendation
#>
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "_lib\common.ps1")

& (Join-Path $PSScriptRoot "_lib\api-target.ps1") -Target local

$CantonScript = Join-Path $PSScriptRoot "start-canton.ps1"
if (Test-Path $CantonScript) {
  Write-Host "Starting Canton sandbox ..."
  & $CantonScript
}

Write-Host "Starting backend APIs (orchestrator on :8088) ..."
& (Join-Path $PSScriptRoot "_lib\start-apis.ps1")

$healthUrl = "http://127.0.0.1:8088/api/blockchain/canton/health"
$deadline = (Get-Date).AddMinutes(3)
Write-Host "Waiting for blockchain orchestrator ..."
while ((Get-Date) -lt $deadline) {
  try {
    $probe = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
    if ($probe) {
      Write-Host ""
      Write-Host "Orchestrator ready."
      Write-Host "  Canton health:  $healthUrl"
      Write-Host "  Kit test run:   http://127.0.0.1:8088/api/blockchain/canton/kit-tests/run"
      Write-Host "  Canton live:    $($probe.reachable)  mint live: $($probe.live)  status: $($probe.status)"
      Write-Host ""
      Write-Host "Next: start admin UI and run tests from the kit blueprint Start here tab."
      Write-Host "  cd apps\admin"
      Write-Host "  npm run dev"
      Write-Host "  http://localhost:5175/capital-market/kit?view=recommendation"
      exit 0
    }
  }
  catch {
    Start-Sleep -Seconds 3
    Write-Host "  waiting for :8088 ..."
  }
}

Write-Host "Timed out waiting for orchestrator. Check: local-dev.cmd status"
exit 1
