#Requires -Version 5.1
<#
.SYNOPSIS
  Wipe local H2 data for policies, mints, claims, and related payment/wallet state.

.DESCRIPTION
  Stops Java APIs (to release H2 file locks), deletes service databases under
  apps/services/*/data, and removes uploaded claim documents. KYC users and
  notifications are left intact unless -IncludeKyc is passed.
#>
param(
  [switch] $IncludeKyc,
  [switch] $SkipStop
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$targets = @(
  @{ service = "policy-service";                 patterns = @("policy-db.mv.db", "policy-db.trace.db") },
  @{ service = "claims-service";                 patterns = @("claims-db.mv.db", "claims-db.trace.db"); extraDirs = @("claim-documents") },
  @{ service = "parametric-claim-service";       patterns = @("parametric-db.mv.db", "parametric-db.trace.db") },
  @{ service = "blockchain-orchestrator-service"; patterns = @("blockchain-db.mv.db", "blockchain-db.trace.db") },
  @{ service = "payment-service";                patterns = @("payment-db.mv.db", "payment-db.trace.db") },
  @{ service = "wallet-service";                patterns = @("wallet-db.mv.db", "wallet-db.trace.db") },
  @{ service = "premium-deposit-service";        patterns = @("premium-deposit-db.mv.db", "premium-deposit-db.trace.db") }
)

if ($IncludeKyc) {
  $targets += @(
    @{ service = "kyc-service";           patterns = @("kyc-db.mv.db", "kyc-db.trace.db") },
    @{ service = "notification-service";  patterns = @("notification-db.mv.db", "notification-db.trace.db") }
  )
}

if (-not $SkipStop) {
  Write-Host "Stopping Java APIs to release database files..."
  & (Join-Path $PSScriptRoot "stop-apis.ps1")
  Start-Sleep -Seconds 2
}

$removed = @()
$failed = @()

foreach ($target in $targets) {
  $dataDir = Join-Path $RepoRoot "apps\services\$($target.service)\data"
  if (-not (Test-Path $dataDir)) {
    continue
  }

  foreach ($pattern in $target.patterns) {
    Get-ChildItem -Path $dataDir -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        Remove-Item -LiteralPath $_.FullName -Force
        $removed += $_.FullName
      } catch {
        $failed += "$($_.FullName): $_"
      }
    }
  }

  $extraDirs = @()
  if ($null -ne $target.extraDirs) {
    $extraDirs = @($target.extraDirs)
  }
  foreach ($dirName in $extraDirs) {
    $extraPath = Join-Path $dataDir $dirName
    if (Test-Path $extraPath) {
      try {
        Remove-Item -LiteralPath $extraPath -Recurse -Force
        $removed += $extraPath
      } catch {
        $failed += "${extraPath}: $_"
      }
    }
  }
}

Write-Host ""
Write-Host "Local test data cleanup complete."
Write-Host ""
if ($removed.Count -gt 0) {
  Write-Host "Removed:"
  foreach ($path in $removed) {
    Write-Host "  - $path"
  }
} else {
  Write-Host "Nothing to remove (databases may already be empty)."
}

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Failed (stop services and retry):"
  foreach ($msg in $failed) {
    Write-Host "  - $msg"
  }
  exit 1
}

Write-Host ""
Write-Host "Restart backends: local-dev.cmd apis"
Write-Host "Fresh policy flow: quote -> pay -> mint -> parametric claim"
Write-Host ""
