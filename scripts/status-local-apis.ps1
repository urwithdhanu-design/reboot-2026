#Requires -Version 5.1
<#
.SYNOPSIS
  Show local API ports and database mode (H2 vs Cloud SQL).
#>
param()

$ErrorActionPreference = "SilentlyContinue"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogDir = Join-Path $Root ".local-dev\logs"

$JavaServices = @(
  @{ id = "kyc";              propsDir = "kyc-service";                    port = 8081 },
  @{ id = "wallet";           propsDir = "wallet-service";                 port = 8089 },
  @{ id = "policy";           propsDir = "policy-service";                 port = 8082 },
  @{ id = "payment";          propsDir = "payment-service";                port = 8083 },
  @{ id = "notification";     propsDir = "notification-service";           port = 8084 },
  @{ id = "claims";           propsDir = "claims-service";                 port = 8085 },
  @{ id = "parametric";       propsDir = "parametric-claim-service";         port = 8086 },
  @{ id = "premium-deposit";  propsDir = "premium-deposit-service";        port = 8087 },
  @{ id = "blockchain";       propsDir = "blockchain-orchestrator-service"; port = 8088 }
)

$PythonServices = @(
  @{ id = "chatbot"; port = 8090 },
  @{ id = "sidecar"; port = 8091 }
)

function Test-PortListening([int] $Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Read-PropsFlag([string] $ServiceDir, [string] $Key) {
  $path = Join-Path $Root "apps\services\$ServiceDir\src\main\resources\application.properties"
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

function Format-Database([object] $Health, [string] $PropsCloudSql, [string] $PropsRuntime) {
  if ($Health -and $Health.database) { return $Health.database }
  if ($Health -and $Health.PSObject.Properties.Name -contains "database") { return $Health.database }
  if ($PropsCloudSql -eq "true") { return "cloud-sql-postgresql (configured, service down?)" }
  return "h2 (configured)"
}

Write-Host "GCUL local APIs - $Root"
Write-Host ""
Write-Host ("{0,-18} {1,6}  {2,-6}  {3,-12}  {4}" -f "SERVICE", "PORT", "STATE", "RUNTIME", "DATABASE")
Write-Host ("-" * 70)

foreach ($s in $JavaServices) {
  $up = Test-PortListening $s.port
  $state = if ($up) { "up" } else { "down" }
  $propsRuntime = Read-PropsFlag $s.propsDir "gcul.runtime.mode"
  $propsCloud = Read-PropsFlag $s.propsDir "gcul.cloud-sql.enabled"
  $health = if ($up) { Get-HealthInfo $s.port } else { $null }
  $runtime = if ($health -and $health.runtimeMode) { $health.runtimeMode } else { if ($propsRuntime) { $propsRuntime } else { "local" } }
  $db = Format-Database $health $propsCloud $propsRuntime
  Write-Host ("{0,-18} :{1,-4}  {2,-6}  {3,-12}  {4}" -f $s.id, $s.port, $state, $runtime, $db)
}

foreach ($s in $PythonServices) {
  $up = Test-PortListening $s.port
  $state = if ($up) { "up" } else { "down" }
  Write-Host ("{0,-18} :{1,-4}  {2,-6}  {3,-12}  {4}" -f $s.id, $s.port, $state, "n/a", "n/a")
}

Write-Host ""
Write-Host "Local dev expects: gcul.runtime.mode=local and gcul.cloud-sql.enabled=false in each service application.properties"
Write-Host "Logs: $LogDir"
Write-Host "Stop: scripts\stop-local-apis.cmd"
