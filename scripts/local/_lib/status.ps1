#Requires -Version 5.1
$ErrorActionPreference = "SilentlyContinue"
. (Join-Path $PSScriptRoot "common.ps1")

function Read-PropsFlag([string] $ServiceDir, [string] $Key) {
  $path = Join-Path $RepoRoot "apps\services\$ServiceDir\src\main\resources\application.properties"
  if (-not (Test-Path $path)) { return $null }
  foreach ($line in Get-Content $path) {
    if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim()
    }
  }
  return $null
}

function Get-HealthInfo([int] $Port) {
  try {
    return Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 4
  } catch {
    return $null
  }
}

function Format-Database([object] $Health, [string] $PropsCloudSql) {
  if ($Health -and $Health.database) { return $Health.database }
  if ($PropsCloudSql -eq "true") { return "cloud-sql-postgresql (configured, service down?)" }
  return "h2 (configured)"
}

$apiTarget = Get-ApiTarget

Write-Host ""
Write-Host "GCUL local development - $RepoRoot"
Write-Host "API target: $apiTarget  ($ApiTargetFile)"
Write-Host ""
Write-Host ("{0,-18} {1,6}  {2,-6}  {3,-12}  {4}" -f "SERVICE", "PORT", "STATE", "RUNTIME", "DATABASE")
Write-Host ("-" * 70)

foreach ($s in $JavaServices) {
  $up = Test-PortListening $s.port
  $state = if ($up) { "up" } else { "down" }
  $propsCloud = Read-PropsFlag $s.propsDir "gcul.cloud-sql.enabled"
  $health = if ($up) { Get-HealthInfo $s.port } else { $null }
  $runtime = if ($health -and $health.runtimeMode) { $health.runtimeMode } else { "local" }
  $db = Format-Database $health $propsCloud
  Write-Host ("{0,-18} :{1,-4}  {2,-6}  {3,-12}  {4}" -f $s.id, $s.port, $state, $runtime, $db)
}

foreach ($s in $PythonServices) {
  $up = Test-PortListening $s.port
  $state = if ($up) { "up" } else { "down" }
  Write-Host ("{0,-18} :{1,-4}  {2,-6}  {3,-12}  {4}" -f $s.id, $s.port, $state, "n/a", "n/a")
}

Write-Host ""
Write-Host ("{0,-18} {1,6}  {2,-6}  {3}" -f "UI", "PORT", "STATE", "URL")
Write-Host ("-" * 50)
foreach ($app in $UiApps) {
  $up = Test-PortListening $app.port
  $state = if ($up) { "up" } else { "down" }
  Write-Host ("{0,-18} :{1,-4}  {2,-6}  http://localhost:{1}" -f $app.id, $app.port, $state)
}

Write-Host ""
Write-Host "Logs: $LogDir"
Write-Host "Stop: local-dev.cmd stop"
