#Requires -Version 5.1
param(
  [switch] $Stop,
  [switch] $Status
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ComposeDir = Join-Path $RepoRoot "canton\docker"
$ComposeFile = Join-Path $ComposeDir "docker-compose.yml"

function Test-CantonHealthy {
  try {
    $header = @{ Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJzYW5kYm94IiwiYXBwbGljYXRpb25JZCI6ImdjdWwtb3JjaGVzdHJhdG9yIiwiYWRtaW4iOnRydWUsImFjdEFzIjpbXSwicmVhZEFzIjpbXX0sImV4cCI6NDEwMjQ0NDgwMH0." }
    Invoke-RestMethod -Uri "http://127.0.0.1:7575/v1/parties" -Headers $header -TimeoutSec 3 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

if ($Stop) {
  Write-Host "Stopping Canton local sandbox ..."
  Push-Location $ComposeDir
  docker compose -f $ComposeFile down
  Pop-Location
  exit 0
}

if ($Status) {
  $healthy = Test-CantonHealthy
  Write-Host "Canton sandbox: $(if ($healthy) { 'healthy' } else { 'not running' })"
  Write-Host "  JSON API: http://127.0.0.1:7575"
  Write-Host "  gRPC:     127.0.0.1:6865"
  exit $(if ($healthy) { 0 } else { 1 })
}

Write-Host "Building and starting Canton local sandbox (first run may take several minutes) ..."
Push-Location $ComposeDir
docker compose -f $ComposeFile up -d --build
Pop-Location

Write-Host "Waiting for JSON Ledger API ..."
$deadline = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $deadline) {
  if (Test-CantonHealthy) {
    Write-Host ""
    Write-Host "Canton sandbox is ready."
    Write-Host "  JSON Ledger API: http://127.0.0.1:7575"
    Write-Host "  gRPC Ledger API: 127.0.0.1:6865"
    Write-Host ""
    Write-Host "Set GCUL_LEDGER_BACKEND=canton and restart blockchain-orchestrator."
    exit 0
  }
  Start-Sleep -Seconds 5
  Write-Host "  still starting ..."
}

Write-Host "Canton sandbox did not become healthy in time. Check: docker logs gcul-canton-sandbox"
exit 1
