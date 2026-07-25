# Policy NFT E2E integration test (simulated or live Sepolia mint)

param(
    [string]$BlockchainUrl = "http://127.0.0.1:8088",
    [string]$PolicyId = "POL-E2E-TEST",
    [string]$WalletAddress = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Policy NFT E2E Test ===" -ForegroundColor Cyan
Write-Host "Blockchain: $BlockchainUrl"

# 1. Health check
$health = Invoke-RestMethod -Uri "$BlockchainUrl/health" -Method Get
Write-Host "Service health: $($health.status)"
Write-Host "Ethereum mode: $($health.ethereum.mode) (live=$($health.ethereum.live))"

# 2. Mint policy NFT
$body = @{
    policyId      = $PolicyId
    policyNumber  = $PolicyId
    customerId    = "e2e-test@example.com"
    walletAddress = $WalletAddress
    metadata      = @{ productTitle = "E2E Test Policy"; source = "integration-script" }
} | ConvertTo-Json -Depth 5

Write-Host "Minting policy NFT to $WalletAddress ..."
$mint = Invoke-RestMethod -Uri "$BlockchainUrl/api/blockchain/internal/policy-nft/mint" `
    -Method Post -ContentType "application/json" -Body $body

Write-Host "Mint result:" -ForegroundColor Green
$mint | ConvertTo-Json -Depth 5

# 3. Verify record persisted
$record = Invoke-RestMethod -Uri "$BlockchainUrl/api/blockchain/internal/policy-nft/$PolicyId" -Method Get
Write-Host "Stored record:" -ForegroundColor Green
$record | ConvertTo-Json -Depth 5

if ($mint.tokenId -and $mint.transactionHash -and $mint.walletAddress -eq $WalletAddress) {
    Write-Host "`nE2E test PASSED" -ForegroundColor Green
    exit 0
}

Write-Host "`nE2E test FAILED" -ForegroundColor Red
exit 1
