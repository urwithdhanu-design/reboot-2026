#Requires -Version 5.1
param(
  [switch] $IncludePython
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

& (Join-Path $PSScriptRoot "stop-apis.ps1") -IncludePython:$IncludePython
& (Join-Path $PSScriptRoot "stop-ui.ps1")
