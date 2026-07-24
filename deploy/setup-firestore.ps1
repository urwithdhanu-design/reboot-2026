#Requires -Version 5.1
<#
.SYNOPSIS
  Enable Firestore on the GCUL Firebase project and grant Cloud Run write access.

.EXAMPLE
  $env:GCP_PROJECT = "community-hub-6fb1b"
  .\deploy\setup-firestore.ps1
#>
param(
  [string] $ProjectId = $(if ($env:GCUL_FIREBASE_PROJECT) { $env:GCUL_FIREBASE_PROJECT } else {
    (Get-Content (Join-Path $PSScriptRoot "firebase-project.json") -Raw | ConvertFrom-Json).projectId
  }),
  [string] $CloudRunProject = $(if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else { "community-hub-6fb1b" })
)

$ErrorActionPreference = "Stop"
gcloud config set project $ProjectId
gcloud services enable firestore.googleapis.com --project $ProjectId

$firebaseNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$firebaseRunSa = "$firebaseNumber-compute@developer.gserviceaccount.com"
try {
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$firebaseRunSa" `
    --role "roles/datastore.user" `
    --quiet | Out-Null
}
catch {
  Write-Host "Skipped IAM for $firebaseRunSa (not present in $ProjectId)" -ForegroundColor Yellow
}

if ($CloudRunProject -ne $ProjectId) {
  $runNumber = gcloud projects describe $CloudRunProject --format="value(projectNumber)"
  $crossRunSa = "$runNumber-compute@developer.gserviceaccount.com"
  Write-Host "Granting $crossRunSa Firestore access on $ProjectId ..."
  gcloud projects add-iam-policy-binding $ProjectId `
    --member "serviceAccount:$crossRunSa" `
    --role "roles/datastore.user" `
    --quiet | Out-Null
}

Write-Host "Firestore API enabled on $ProjectId"
Write-Host "Deploy rules: firebase deploy --only firestore:rules --project $ProjectId"
Write-Host "Cloud Run cache writers use GCUL_FIRESTORE_PROJECT=$ProjectId"
Write-Host "Firestore console: https://console.firebase.google.com/project/$ProjectId/firestore"
Write-Host "Cache docs: gcul_cache/admin_customers, admin_kyc_queue, admin_policies, admin_payments"
