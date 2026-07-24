#Requires -Version 5.1
# [legacy] Forwards to scripts/local/_lib/stop-apis.ps1
param([switch] $IncludePython)
& (Join-Path $PSScriptRoot "local\_lib\stop-apis.ps1") -IncludePython:$IncludePython
