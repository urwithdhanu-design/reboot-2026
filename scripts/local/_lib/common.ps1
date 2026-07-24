#Requires -Version 5.1
# Shared paths and service definitions for GCUL local development scripts.

$Script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$Script:LocalDevDir = Join-Path $RepoRoot ".local-dev"
$Script:LogDir = Join-Path $LocalDevDir "logs"
$Script:ApiTargetFile = Join-Path $LocalDevDir "api-target.env"

$Script:JavaServices = @(
  @{ id = "kyc";              dir = "apps\services\kyc-service";                    port = 8081; propsDir = "kyc-service" },
  @{ id = "wallet";           dir = "apps\services\wallet-service";                 port = 8089; propsDir = "wallet-service" },
  @{ id = "policy";           dir = "apps\services\policy-service";                 port = 8082; propsDir = "policy-service" },
  @{ id = "payment";          dir = "apps\services\payment-service";                port = 8083; propsDir = "payment-service" },
  @{ id = "notification";     dir = "apps\services\notification-service";           port = 8084; propsDir = "notification-service" },
  @{ id = "claims";           dir = "apps\services\claims-service";                 port = 8085; propsDir = "claims-service" },
  @{ id = "parametric";       dir = "apps\services\parametric-claim-service";         port = 8086; propsDir = "parametric-claim-service" },
  @{ id = "premium-deposit";  dir = "apps\services\premium-deposit-service";        port = 8087; propsDir = "premium-deposit-service" },
  @{ id = "blockchain";       dir = "apps\services\blockchain-orchestrator-service"; port = 8088; propsDir = "blockchain-orchestrator-service" },
  @{ id = "audit";            dir = "apps\services\audit-service";                  port = 8092; propsDir = "audit-service" }
)

$Script:PythonServices = @(
  @{ id = "chatbot"; dir = "apps\services\chatbot-assistance-service"; port = 8090 },
  @{ id = "sidecar"; dir = "apps\services\gcul-sidecar";               port = 8091 }
)

$Script:UiApps = @(
  @{ id = "web";   dir = "apps\web";   port = 5174 },
  @{ id = "admin"; dir = "apps\admin"; port = 5175 }
)

function Ensure-LocalDevDirs {
  New-Item -ItemType Directory -Force -Path $Script:LocalDevDir | Out-Null
  New-Item -ItemType Directory -Force -Path $Script:LogDir | Out-Null
}

function Test-PortListening([int] $Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Get-ApiTarget {
  if (-not (Test-Path $Script:ApiTargetFile)) { return "cloud" }
  foreach ($line in Get-Content $Script:ApiTargetFile) {
    if ($line -match '^\s*VITE_API_TARGET\s*=\s*(\S+)') {
      return $Matches[1].Trim()
    }
  }
  return "cloud"
}

function Show-Help {
  Write-Host ""
  Write-Host "GCUL local development"
  Write-Host ""
  Write-Host "  local-dev.cmd setup              First-time setup (Maven lib + npm install)"
  Write-Host "  local-dev.cmd start              Full local stack (APIs + customer + admin UI)"
  Write-Host "  local-dev.cmd cloud              UI only, APIs on Cloud Run (default for demos)"
  Write-Host ""
  Write-Host "  local-dev.cmd apis               Start Java backends only"
  Write-Host "  local-dev.cmd apis python        Also chatbot (:8090) + sidecar (:8091)"
  Write-Host "  local-dev.cmd ui                 Start customer + admin Vite dev servers"
  Write-Host "  local-dev.cmd status             Ports, DB mode, API target"
  Write-Host "  local-dev.cmd stop               Stop APIs and UIs"
  Write-Host "  local-dev.cmd target local|cloud Switch where the UI sends /api/*"
  Write-Host ""
  Write-Host "URLs (when running):"
  Write-Host "  Customer  http://localhost:5174"
  Write-Host "  Admin       http://localhost:5175"
  Write-Host "  Logs        .local-dev\logs\"
  Write-Host ""
  Write-Host "Demo password after register: ChangeMe123!"
  Write-Host ""
}
