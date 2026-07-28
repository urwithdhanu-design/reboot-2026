#Requires -Version 5.1
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "email-env.ps1")
Ensure-LocalDevDirs

$emailEnv = Ensure-EmailEnvFiles -RepoRoot $RepoRoot
$prefix = Get-EmailEnvCmdPrefix $emailEnv
if (-not $prefix) {
  Write-Error "Email not configured in kyc-service/.env"
}

$port = 8089
$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  Write-Host "Stopped process on :$port (pid $($c.OwningProcess))"
}

Start-Sleep -Seconds 2

$workDir = Join-Path $RepoRoot "apps\services\wallet-service"
$log = Join-Path $LogDir "wallet.log"
$cmd = "cd /d `"$workDir`" && ${prefix}mvnw.cmd spring-boot:run > `"$log`" 2>&1"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -WindowStyle Hidden
Write-Host "Restarted wallet on :$port with SMTP env -> $log"
