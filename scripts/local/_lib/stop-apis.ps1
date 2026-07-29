#Requires -Version 5.1
param(
  [switch] $IncludePython
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Stop-Ports([int[]] $PortList, [string] $Label) {
  $pids = @()
  foreach ($port in $PortList) {
    $pids += Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  }
  $pids = $pids | Where-Object { $_ } | Select-Object -Unique

  if (-not $pids) {
    Write-Host "No $Label listeners on ports $($PortList -join ', ')."
    return
  }

  foreach ($procId in $pids) {
    try {
      $name = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Stopped $Label PID $procId ($name)"
    } catch {
      Write-Warning "Could not stop PID $procId : $_"
    }
  }
}

$ports = 8081..8089 + 8090 + 8092 + 8093
if ($IncludePython) { $ports += 8091 }
Stop-Ports $ports "API"
