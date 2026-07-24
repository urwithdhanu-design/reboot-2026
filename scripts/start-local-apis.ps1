#Requires -Version 5.1
# [legacy] Forwards to scripts/local/_lib/start-apis.ps1
param(
  [switch] $IncludePython,
  [switch] $Status,
  [switch] $Force
)
$lib = Join-Path $PSScriptRoot "local\_lib"
if ($Status) {
  & (Join-Path $lib "status.ps1")
  exit 0
}
& (Join-Path $lib "start-apis.ps1") -IncludePython:$IncludePython -Force:$Force
