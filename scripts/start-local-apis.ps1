#Requires -Version 5.1
<#
.SYNOPSIS
  Start all GCUL Java microservices locally (ports 8081-8088).

.DESCRIPTION
  Launches each service in a background process and writes logs under .local-dev/logs/.
  Optional: Python chatbot (8090) and gcul-sidecar (8091).

.EXAMPLE
  cd C:\projects\gcul
  .\scripts\start-local-apis.ps1

.EXAMPLE
  .\scripts\start-local-apis.ps1 -IncludePython

.EXAMPLE
  .\scripts\start-local-apis.ps1 -Status
#>
param(
  [switch] $IncludePython,
  [switch] $Status,
  [switch] $Force
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Root ".local-dev\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$JavaServices = @(
  @{ id = "kyc";              dir = "apps\services\kyc-service";                    port = 8081 },
  @{ id = "wallet";           dir = "apps\services\wallet-service";                 port = 8089 },
  @{ id = "policy";           dir = "apps\services\policy-service";                 port = 8082 },
  @{ id = "payment";          dir = "apps\services\payment-service";                port = 8083 },
  @{ id = "notification";     dir = "apps\services\notification-service";           port = 8084 },
  @{ id = "claims";           dir = "apps\services\claims-service";                 port = 8085 },
  @{ id = "parametric";       dir = "apps\services\parametric-claim-service";         port = 8086 },
  @{ id = "premium-deposit";  dir = "apps\services\premium-deposit-service";        port = 8087 },
  @{ id = "blockchain";       dir = "apps\services\blockchain-orchestrator-service"; port = 8088 },
  @{ id = "audit";            dir = "apps\services\audit-service";                  port = 8092 }
)

$PythonServices = @(
  @{ id = "chatbot"; dir = "apps\services\chatbot-assistance-service"; port = 8090 },
  @{ id = "sidecar"; dir = "apps\services\gcul-sidecar";               port = 8091 }
)

function Test-PortListening([int] $Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Show-Status {
  Write-Host "GCUL local API status ($Root)"
  foreach ($s in $JavaServices) {
    $state = if (Test-PortListening $s.port) { "up" } else { "down" }
    Write-Host ("  {0,-18} :{1}  {2}" -f $s.id, $s.port, $state)
  }
  foreach ($s in $PythonServices) {
    $state = if (Test-PortListening $s.port) { "up" } else { "down" }
    Write-Host ("  {0,-18} :{1}  {2}" -f $s.id, $s.port, $state)
  }
  Write-Host ""
  Write-Host "Logs: $LogDir"
  Write-Host "Stop: scripts\stop-local-apis.cmd"
}

function Start-JavaService($Service) {
  $port = $Service.port
  if ((Test-PortListening $port) -and -not $Force) {
    Write-Host "Skip $($Service.id) - port $port already in use (use -Force to start anyway)"
    return
  }
  $workDir = Join-Path $Root $Service.dir
  $log = Join-Path $LogDir "$($Service.id).log"
  if (Test-Path $log) { Remove-Item $log -Force }
  $cmd = "cd /d `"$workDir`" && mvnw.cmd spring-boot:run > `"$log`" 2>&1"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden
  Write-Host "Started $($Service.id) on :$port -> $log"
}

function Ensure-PythonVenv($ServiceDir) {
  $venv = Join-Path $ServiceDir ".venv"
  if (-not (Test-Path $venv)) {
    Write-Host "Creating venv in $ServiceDir ..."
    python -m venv $venv
    & "$venv\Scripts\pip.exe" install -q -r (Join-Path $ServiceDir "requirements.txt")
    if ($ServiceDir -match "gcul-sidecar") {
      & "$venv\Scripts\pip.exe" install -q -e (Join-Path $Root "packages\gcul-sdk")
    }
  }
  return $venv
}

function Start-PythonService($Service) {
  $port = $Service.port
  if ((Test-PortListening $port) -and -not $Force) {
    Write-Host "Skip $($Service.id) - port $port already in use"
    return
  }
  $workDir = Join-Path $Root $Service.dir
  $venv = Ensure-PythonVenv $workDir
  $uvicorn = Join-Path $venv "Scripts\uvicorn.exe"
  if (-not (Test-Path $uvicorn)) {
    throw "uvicorn not found in $venv - run pip install -r requirements.txt"
  }
  $log = Join-Path $LogDir "$($Service.id).log"
  if (Test-Path $log) { Remove-Item $log -Force }
  $cmd = "cd /d `"$workDir`" && `"$uvicorn`" app.main:app --host 127.0.0.1 --port $port > `"$log`" 2>&1"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden
  Write-Host "Started $($Service.id) on :$port -> $log"
}

if ($Status) {
  Show-Status
  exit 0
}

Write-Host "Starting GCUL Java APIs (9 services) ..."
foreach ($s in $JavaServices) { Start-JavaService $s }

if ($IncludePython) {
  Write-Host "Starting Python sidecar + chatbot ..."
  foreach ($s in $PythonServices) { Start-PythonService $s }
}

Write-Host ""
Write-Host "First boot can take 1-3 minutes (Maven downloads). Then run:"
Write-Host "Status: scripts\status-local-apis.cmd"
Write-Host ""
Write-Host "Customer UI:  cd apps\web; npm run dev   -> http://localhost:5173"
Write-Host "Admin UI:     cd apps\admin; npm run dev -> http://localhost:5174"
Write-Host "Full guide:   apps\services\LOCAL-DEV.md"
