#Requires -Version 5.1
param(
  [switch] $IncludePython
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
Ensure-LocalDevDirs

Write-Host "GCUL refresh messaging + restart ($RepoRoot)"
Write-Host ""

$mvnw = Join-Path $RepoRoot "apps\services\kyc-service\mvnw.cmd"
$messagingPom = Join-Path $RepoRoot "apps\libs\gcul-messaging\pom.xml"
if (-not (Test-Path $mvnw)) {
  throw "Missing $mvnw - clone the full repo first."
}

Write-Host "[1/3] Installing gcul-messaging into local Maven ..."
& $mvnw -q -f $messagingPom install -DskipTests
if ($LASTEXITCODE -ne 0) { throw "gcul-messaging install failed (exit $LASTEXITCODE)" }

Write-Host "[2/3] Stopping local stack ..."
& (Join-Path $PSScriptRoot "stop.ps1") -IncludePython:$IncludePython

Write-Host "[3/3] Starting local stack ..."
& (Join-Path $PSScriptRoot "start-local.ps1") -IncludePython:$IncludePython
