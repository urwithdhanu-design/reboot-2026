#!/usr/bin/env bash
# Deploy the GCUL Insurance API to Google Cloud Run.
# Usage:
#   export GCP_PROJECT=your-project-id
#   export GCP_REGION=us-central1
#   bash apps/api/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT="${GCP_PROJECT:?Set GCP_PROJECT}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE_NAME:-gcul-insurance-api}"
REPO="${ARTIFACT_REPO:-gcul}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:latest"

echo "Project:  ${PROJECT}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE}"
echo "Image:    ${IMAGE}"

gcloud config set project "${PROJECT}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project "${PROJECT}"

gcloud artifacts repositories describe "${REPO}" --location="${REGION}" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "${REPO}" \
       --repository-format=docker \
       --location="${REGION}" \
       --description="GCUL insurance images"

gcloud builds submit "${ROOT}" \
  --config="${ROOT}/apps/api/cloudbuild.yaml" \
  --substitutions="_IMAGE=${IMAGE}"

gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "CORS_ORIGINS=*,GCUL_MODE=demo,JWT_SECRET=${JWT_SECRET:-change-me-in-prod}" \
  --quiet

URL="$(gcloud run services describe "${SERVICE}" --region "${REGION}" --format='value(status.url)')"
echo "Deployed: ${URL}"
echo "Health:   ${URL}/health"
