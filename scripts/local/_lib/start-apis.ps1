#Requires -Version 5.1
param(
  [switch] $IncludePython,
  [switch] $Force
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "email-env.ps1")
Ensure-LocalDevDirs

$emailEnv = Ensure-EmailEnvFiles -RepoRoot $RepoRoot
$emailCmdPrefix = Get-EmailEnvCmdPrefix $emailEnv
$mailServices = @{ kyc = $true; policy = $true; notification = $true }

function Start-JavaService($Service) {
  $port = $Service.port
  if ((Test-PortListening $port) -and -not $Force) {
    Write-Host "Skip $($Service.id) - port $port already in use (use -Force to start anyway)"
    return
  }
  $workDir = Join-Path $RepoRoot $Service.dir
  $log = Join-Path $LogDir "$($Service.id).log"
  if (Test-Path $log) { Remove-Item $log -Force }
  $prefix = if ($mailServices.ContainsKey($Service.id)) { $emailCmdPrefix } else { "" }
  $cmd = "cd /d `"$workDir`" && ${prefix}mvnw.cmd spring-boot:run > `"$log`" 2>&1"
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
      & "$venv\Scripts\pip.exe" install -q -e (Join-Path $RepoRoot "packages\gcul-sdk")
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
  $workDir = Join-Path $RepoRoot $Service.dir
  $venv = Ensure-PythonVenv $workDir
  $uvicorn = Join-Path $venv "Scripts\uvicorn.exe"
  if (-not (Test-Path $uvicorn)) {
    throw "uvicorn not found in $venv - run: local-dev.cmd setup"
  }
  $log = Join-Path $LogDir "$($Service.id).log"
  if (Test-Path $log) { Remove-Item $log -Force }
  $cmd = "cd /d `"$workDir`" && `"$uvicorn`" app.main:app --host 127.0.0.1 --port $port > `"$log`" 2>&1"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden
  Write-Host "Started $($Service.id) on :$port -> $log"
}

Write-Host "Starting GCUL Java APIs ($($JavaServices.Count) services) ..."
foreach ($s in $JavaServices) { Start-JavaService $s }

$chatbot = $PythonServices | Where-Object { $_.id -eq "chatbot" } | Select-Object -First 1
if ($chatbot) {
  Write-Host "Starting Stallion chatbot (customer app) ..."
  Start-PythonService $chatbot
}

$observability = $PythonServices | Where-Object { $_.id -eq "observability" } | Select-Object -First 1
if ($observability) {
  Write-Host "Starting platform observability (:8093) ..."
  Start-PythonService $observability
}

if ($IncludePython) {
  $sidecar = $PythonServices | Where-Object { $_.id -eq "sidecar" } | Select-Object -First 1
  if ($sidecar) {
    Write-Host "Starting GCUL sidecar ..."
    Start-PythonService $sidecar
  }
}

Write-Host ""
Write-Host "First boot can take 1-3 minutes (Maven downloads)."
Write-Host "Check progress: local-dev.cmd status"
Write-Host "Logs: $LogDir"
