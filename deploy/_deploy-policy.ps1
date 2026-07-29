$env:GCP_PROJECT = "insure360-83a36"
& (Join-Path $PSScriptRoot "deploy-cloud-run.ps1") -ServiceIds gcul-policy
