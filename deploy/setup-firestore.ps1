#Requires -Version 5.1
<#
.SYNOPSIS
  Enable Firestore and IAM for GCUL server-side cache (gcul-policy marketplace catalog).
#>
param(
  [string] $ProjectId = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" })
)

$ErrorActionPreference = "Stop"
gcloud config set project $ProjectId
gcloud services enable firestore.googleapis.com --project $ProjectId

$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$runSa = "$projectNumber-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $ProjectId `
  --member "serviceAccount:$runSa" `
  --role "roles/datastore.user" `
  --quiet | Out-Null

Write-Host "Firestore API enabled; $runSa has roles/datastore.user"
Write-Host "Deploy rules: firebase deploy --only firestore:rules --project $ProjectId"
Write-Host "Policy service: set GCUL_FIRESTORE_ENABLED=true (default in cloud profile)"
