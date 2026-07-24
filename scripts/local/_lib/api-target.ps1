#Requires -Version 5.1
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("local", "cloud")]
  [string] $Target
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
Ensure-LocalDevDirs

@(
  "# Shared dev API target (used by apps/web and apps/admin Vite)"
  "VITE_API_TARGET=$Target"
) | Set-Content -Path $ApiTargetFile -Encoding utf8

Write-Host "API target set to: $Target"
Write-Host "File: $ApiTargetFile"
if ($Target -eq "local") {
  Write-Host "Start backends first: local-dev.cmd apis"
}
Write-Host "Restart UIs after changing target: local-dev.cmd ui"
