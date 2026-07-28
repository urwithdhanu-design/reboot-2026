#Requires -Version 5.1
param(
  [string] $PolicyId = "POL-CANTON-TEST-001",
  [string] $CustomerId = "canton-test@example.com",
  [string] $Wallet = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  [string] $OrchestratorUrl = "http://127.0.0.1:8088"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
. (Join-Path $PSScriptRoot "_lib\common.ps1")

function Test-CantonUp {
  try {
    $health = Invoke-RestMethod -Uri "$OrchestratorUrl/health" -TimeoutSec 5
    # The orchestrator reports the active Canton adapter in the ledger block.
    return $health.ledger.live -eq $true -and $health.ledger.mode -eq "canton"
  }
  catch { return $false }
}

Write-Host "Canton E2E mint test"
Write-Host "  Orchestrator: $OrchestratorUrl"
Write-Host "  Policy ID:    $PolicyId"

if (-not (Test-CantonUp)) {
  Write-Host "Canton sandbox not running. Start with: local-dev.cmd canton"
  exit 1
}

$hashInput = "$PolicyId|$PolicyId|$CustomerId|Q-CANTON-TEST"
$bytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($hashInput))
$policyReferenceHash = "0x" + (($bytes | ForEach-Object { $_.ToString("x2") }) -join "")

$body = @{
  policyId = $PolicyId
  policyNumber = $PolicyId
  customerId = $CustomerId
  walletAddress = $Wallet
  policyReferenceHash = $policyReferenceHash
  metadataURI = "ipfs://gcul-policy/$PolicyId"
  kycVerified = $true
  policyEligible = $true
} | ConvertTo-Json

Write-Host "POST /api/blockchain/internal/policy-nft/mint ..."
$result = Invoke-RestMethod -Uri "$OrchestratorUrl/api/blockchain/internal/policy-nft/mint" `
  -Method Post -ContentType "application/json" -Body $body

Write-Host ""
Write-Host "Mint result:"
$result | ConvertTo-Json -Depth 5
Write-Host ""

if ($result.mode -ne "canton") {
  Write-Host "WARN: Expected mode=canton but got $($result.mode). Is GCUL_LEDGER_BACKEND=canton and Canton reachable?"
  exit 1
}

if ($result.mintStatus -ne "MINTED") {
  Write-Host "FAIL: mintStatus=$($result.mintStatus)"
  exit 1
}

Write-Host "PASS: Policy minted on Canton. tokenId=$($result.tokenId) updateId=$($result.transactionHash)"
