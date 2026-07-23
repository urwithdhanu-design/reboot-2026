#Requires -Version 5.1
<#
.SYNOPSIS
  Stop local GCUL APIs by listening ports (8081–8088, optional 8090–8091).

.EXAMPLE
  .\scripts\stop-local-apis.ps1
  .\scripts\stop-local-apis.ps1 -IncludePython
#>
param(
  [switch] $IncludePython
)

$ErrorActionPreference = "Stop"
$ports = 8081..8089 + 8092
if ($IncludePython) { $ports += 8090, 8091 }

$pids = @()
foreach ($port in $ports) {
  $pids += Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
}
$pids = $pids | Where-Object { $_ } | Select-Object -Unique

if (-not $pids) {
  Write-Host "No GCUL API listeners on ports $($ports -join ', ')."
  exit 0
}

foreach ($procId in $pids) {
  try {
    $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
    Stop-Process -Id $procId -Force -ErrorAction Stop
    Write-Host "Stopped PID $procId ($name)"
  } catch {
    Write-Warning "Could not stop PID $procId : $_"
  }
}
