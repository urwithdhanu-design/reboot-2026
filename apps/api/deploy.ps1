# PowerShell deploy helper for Windows.
# Usage:
#   $env:GCP_PROJECT = "your-project-id"
#   .\apps\api\deploy.ps1

$ErrorActionPreference = "Stop"

if (-not $env:GCP_PROJECT) { throw "Set GCP_PROJECT first" }

$Project = $env:GCP_PROJECT
$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$Service = if ($env:SERVICE_NAME) { $env:SERVICE_NAME } else { "gcul-insurance-api" }
$Repo = if ($env:ARTIFACT_REPO) { $env:ARTIFACT_REPO } else { "gcul" }
$Image = "$Region-docker.pkg.dev/$Project/$Repo/${Service}:latest"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$Jwt = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "change-me-in-prod" }

Write-Host "Project: $Project"
Write-Host "Region:  $Region"
Write-Host "Image:   $Image"

gcloud config set project $Project
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project $Project

$repoExists = $true
try { gcloud artifacts repositories describe $Repo --location=$Region | Out-Null } catch { $repoExists = $false }
if (-not $repoExists) {
  gcloud artifacts repositories create $Repo --repository-format=docker --location=$Region --description="GCUL insurance images"
}

gcloud builds submit $Root --config "$Root/apps/api/cloudbuild.yaml" --substitutions="_IMAGE=$Image"

gcloud run deploy $Service `
  --image $Image `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars "CORS_ORIGINS=*,GCUL_MODE=demo,JWT_SECRET=$Jwt" `
  --quiet

$Url = gcloud run services describe $Service --region $Region --format="value(status.url)"
Write-Host "Deployed: $Url"
Write-Host "Health:   $Url/health"
