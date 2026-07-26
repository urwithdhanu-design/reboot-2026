#Requires -Version 5.1
<#
.SYNOPSIS
  Provision a Google Cloud Blockchain Node Engine Sepolia node and store RPC credentials.

.EXAMPLE
  $env:GCP_PROJECT = "insure360-83a36"
  $env:GCP_BLOCKCHAIN_NODE_API_KEY = "AIza..."
  .\deploy\setup-blockchain-node.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { throw "Set GCP_PROJECT" }),
  [string] $Region = $(if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }),
  [string] $NodeName = $(if ($env:GCUL_BLOCKCHAIN_NODE_NAME) { $env:GCUL_BLOCKCHAIN_NODE_NAME } else { "gcul-sepolia" }),
  [string] $ApiKey = $(if ($env:GCP_BLOCKCHAIN_NODE_API_KEY) { $env:GCP_BLOCKCHAIN_NODE_API_KEY } else { "" }),
  [int] $WaitMinutes = 45,
  [switch] $SkipCreate
)

$ErrorActionPreference = "Stop"
$OutFile = Join-Path $PSScriptRoot "blockchain-node.json"
$RpcSecret = "gcul-blockchain-node-rpc-url"
$ApiKeySecret = "gcul-blockchain-node-api-key"
$BaseUrl = "https://blockchainnodeengine.googleapis.com/v1"
$nodeResource = "projects/$ProjectId/locations/$Region/blockchainNodes/$NodeName"

function Get-AccessToken {
  return (gcloud auth print-access-token).Trim()
}

function Invoke-BneApi {
  param(
    [string] $Method,
    [string] $Uri,
    [object] $Body = $null
  )
  $headers = @{
    Authorization = "Bearer $(Get-AccessToken)"
    "Content-Type" = "application/json"
  }
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 8)
  }
  return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
}

gcloud config set project $ProjectId | Out-Null
gcloud services enable blockchainnodeengine.googleapis.com --project $ProjectId --quiet

$existing = $null
try {
  $existing = Invoke-BneApi -Method GET -Uri "$BaseUrl/$nodeResource"
}
catch {
  $existing = $null
}

if (-not $existing -and -not $SkipCreate) {
  Write-Host "Creating Sepolia blockchain node '$NodeName' in $Region ..." -ForegroundColor Cyan
  $createBody = @{
    blockchainType = "ETHEREUM"
    ethereumDetails = @{
      network = "TESTNET_SEPOLIA"
      nodeType = "FULL"
      executionClient = "GETH"
      consensusClient = "LIGHTHOUSE"
    }
  }
  try {
    $op = Invoke-BneApi -Method POST `
      -Uri "$BaseUrl/projects/$ProjectId/locations/$Region/blockchainNodes?blockchainNodeId=$NodeName" `
      -Body $createBody
    Write-Host "Create operation started: $($op.name)"
  }
  catch {
    Write-Warning "Node create request failed: $($_.Exception.Message)"
    throw
  }
}
elseif ($existing) {
  Write-Host "Blockchain node '$NodeName' already exists (state=$($existing.state))." -ForegroundColor Yellow
}
else {
  Write-Host "SkipCreate set — expecting existing node $NodeName" -ForegroundColor Yellow
}

Write-Host "Waiting for node to reach RUNNING (up to $WaitMinutes min) ..." -ForegroundColor Cyan
$deadline = (Get-Date).AddMinutes($WaitMinutes)
$node = $null
while ((Get-Date) -lt $deadline) {
  $node = Invoke-BneApi -Method GET -Uri "$BaseUrl/$nodeResource"
  if ($node.state -eq "RUNNING") {
    break
  }
  Write-Host "  state=$($node.state) — retrying in 30s ..."
  Start-Sleep -Seconds 30
}
if ($node.state -ne "RUNNING") {
  throw "Node $NodeName did not reach RUNNING within $WaitMinutes minutes (state=$($node.state))"
}

$endpointHost = $node.connectionInfo.endpointInfo.jsonRpcApiEndpoint
if (-not $endpointHost) {
  throw "Node is RUNNING but jsonRpcApiEndpoint is missing"
}

if (-not $ApiKey) {
  $keys = gcloud services api-keys list --project $ProjectId --format=json 2>$null | ConvertFrom-Json
  $candidate = $keys | Where-Object { $_.displayName -match "blockchain|bne|gcul" } | Select-Object -First 1
  if ($candidate -and $candidate.keyString) {
    $ApiKey = $candidate.keyString
    Write-Host "Using API key from display name $($candidate.displayName)" -ForegroundColor Yellow
  }
}
if (-not $ApiKey) {
  throw "Set GCP_BLOCKCHAIN_NODE_API_KEY (Blockchain Node Engine JSON-RPC API key)"
}

$rpcUrl = "https://$endpointHost/?key=$ApiKey"
Write-Host "RPC endpoint: https://$endpointHost/?key=***" -ForegroundColor Green

$null = gcloud secrets describe $RpcSecret --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  $rpcUrl | gcloud secrets create $RpcSecret --data-file=- --project $ProjectId --quiet
}
else {
  $rpcUrl | gcloud secrets versions add $RpcSecret --data-file=- --project $ProjectId --quiet
}

$null = gcloud secrets describe $ApiKeySecret --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  $ApiKey | gcloud secrets create $ApiKeySecret --data-file=- --project $ProjectId --quiet
}
else {
  $ApiKey | gcloud secrets versions add $ApiKeySecret --data-file=- --project $ProjectId --quiet
}

$payload = @{
  projectId = $ProjectId
  region = $Region
  nodeName = $NodeName
  resourceName = $nodeResource
  network = "TESTNET_SEPOLIA"
  chainId = 11155111
  endpointHost = $endpointHost
  rpcSecret = $RpcSecret
  apiKeySecret = $ApiKeySecret
  rpcUrlEnv = "GCP_BLOCKCHAIN_NODE_RPC_URL"
  state = $node.state
}
$payload | ConvertTo-Json | Set-Content -Encoding utf8 $OutFile
Write-Host "Wrote $OutFile"
