# Canton Local Sandbox

GCUL uses a Canton local sandbox (Daml ledger) for on-chain policy minting in local development.

## Quick start

```powershell
# From repo root
local-dev.cmd canton          # build + start Docker sandbox
local-dev.cmd start           # starts Canton (if script wired) + APIs + UI
```

Or start everything in one step:

```powershell
local-dev.cmd start
```

## Endpoints

| Service | URL |
|---------|-----|
| JSON Ledger API | http://127.0.0.1:7575 |
| gRPC Ledger API | 127.0.0.1:6865 |

## Daml contracts

- `Gcul.InsurancePolicy:InsurerMintAuthority` — insurer-controlled mint authority (insurer signs)
- `Gcul.InsurancePolicy:InsurancePolicy` — on-ledger policy certificate

## Configuration (blockchain-orchestrator)

| Env var | Default |
|---------|---------|
| `GCUL_LEDGER_BACKEND` | `canton` |
| `GCUL_CANTON_ENABLED` | `true` |
| `GCUL_CANTON_JSON_API_URL` | `http://127.0.0.1:7575` |
| `GCUL_CANTON_INSURER_PARTY` | `GCUL_Insurer` |

When Canton is offline, the orchestrator falls back to simulated minting so the rest of the flow still works.

## E2E test flow

1. Register customer → complete KYC
2. Link wallet (0x address stored on Canton contract)
3. Get quote → pay premium (Stripe or wallet)
4. Policy issued → orchestrator exercises `MintPolicy` on Canton (insurer signs)
5. Customer UI shows minted contract ID; Admin Tokenization page shows Daml/Canton registry

## Commands

```powershell
local-dev.cmd canton status
local-dev.cmd canton stop
docker logs gcul-canton-sandbox
```

## Cloud Run deployment

Canton can run on **Cloud Run** as an internal service (like `gcul-sidecar`). The blockchain orchestrator calls its JSON Ledger API over HTTP; it is **not** exposed through Firebase Hosting.

**Live service (project `insure360-83a36`):** `gcul-canton` → `https://gcul-canton-690935448909.us-central1.run.app`

### Limitations

| Topic | Notes |
|-------|--------|
| **Ledger state** | Ephemeral — redeploys and cold starts reset the sandbox ledger (demo/dev only) |
| **Cost** | `minInstances: 1` keeps one warm instance (4 GiB RAM, 2 vCPU) |
| **Startup** | First deploy can take 3–5 minutes (Daml build + sandbox init) |
| **Production** | Use a managed Canton/Daml deployment or Canton Network for durable ledgers |

---

## Build and push to Cloud Run

All Canton cloud assets live in this repo (`reboot-2026` / `gcul`):

| Path | Role |
|------|------|
| `canton/daml/` | Daml contracts (compiled to `.dar` in the image) |
| `canton/docker/start-sandbox.sh` | Container entrypoint (sandbox + JSON API) |
| `deploy/docker/Dockerfile.canton` | Cloud Run image (used by Cloud Build) |
| `deploy/services.json` | Cloud Run service id `gcul-canton` |

**Image registry:** `us-central1-docker.pkg.dev/<GCP_PROJECT>/gcul/gcul-canton:latest`

### Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) installed and logged in:

   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. Set project and region:

   **Windows (PowerShell)**

   ```powershell
   $env:GCP_PROJECT = "insure360-83a36"
   $env:GCP_REGION = "us-central1"
   ```

   **macOS (bash/zsh)**

   ```bash
   export GCP_PROJECT=insure360-83a36
   export GCP_REGION=us-central1
   ```

3. **macOS:** install PowerShell for the deploy script: `brew install powershell`

4. One-time GCP setup (Artifact Registry repo `gcul`, APIs enabled) — see [`deploy/README.md`](../deploy/README.md) if this is a new project.

### Option A — Build, push, and deploy (recommended)

One command builds the image in **Cloud Build**, pushes to Artifact Registry, and deploys to Cloud Run.

**Windows:**

```powershell
cd C:\projects\gcul
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-canton,gcul-blockchain-orchestrator
```

**macOS:**

```bash
cd ~/path/to/gcul
export GCP_PROJECT=insure360-83a36
pwsh ./deploy/deploy-cloud-run.ps1 -ServiceIds gcul-canton,gcul-blockchain-orchestrator
```

What happens:

1. `gcloud builds submit` builds `deploy/docker/Dockerfile.canton` from repo root
2. Image is pushed to `us-central1-docker.pkg.dev/$GCP_PROJECT/gcul/gcul-canton:latest`
3. `gcloud run deploy gcul-canton` rolls out the new revision (port 8080, 4 GiB, `minInstances: 1`)
4. `gcul-blockchain-orchestrator` is updated with `GCUL_CANTON_JSON_API_URL`

Deploy Canton only (orchestrator wiring runs only if Canton URL is available):

```powershell
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-canton
```

Redeploy without rebuilding the image (config-only):

```powershell
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-canton -SkipBuild
```

### Option B — Build and push image only (manual)

Use this to build/push the Docker image without deploying, or to debug Cloud Build.

**Windows / macOS (same `gcloud` commands):**

```bash
cd /path/to/gcul   # repo root

export GCP_PROJECT=insure360-83a36
export GCP_REGION=us-central1
IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/gcul/gcul-canton:latest"

gcloud builds submit . \
  --project="$GCP_PROJECT" \
  --config=deploy/cloudbuild-service.yaml \
  --substitutions="_IMAGE=$IMAGE,_DOCKERFILE=deploy/docker/Dockerfile.canton,_SERVICE_DIR=canton"
```

Then deploy the pushed image:

```bash
gcloud run deploy gcul-canton \
  --image "$IMAGE" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 1 \
  --timeout 3600 \
  --no-cpu-throttling \
  --startup-probe httpGet.path=/,httpGet.port=8080,initialDelaySeconds=15,timeoutSeconds=5,periodSeconds=10,failureThreshold=90 \
  --project "$GCP_PROJECT"
```

Wire the orchestrator to the new Canton URL:

```bash
CANTON_URL=$(gcloud run services describe gcul-canton --region "$GCP_REGION" --project "$GCP_PROJECT" --format="value(status.url)")

gcloud run services update gcul-blockchain-orchestrator \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" \
  --update-env-vars "GCUL_LEDGER_BACKEND=canton,GCUL_CANTON_ENABLED=true,GCUL_CANTON_JSON_API_URL=$CANTON_URL"
```

### Option C — Local Docker build (test before push)

Build and run the same image locally (JSON API on port 7575):

```powershell
cd C:\projects\gcul\canton\docker
docker compose up --build
```

Or build the Cloud Run Dockerfile locally:

```bash
cd /path/to/gcul
docker build -f deploy/docker/Dockerfile.canton -t gcul-canton:local .
docker run --rm -p 8080:8080 -e PORT=8080 gcul-canton:local
```

### When to rebuild

| You changed… | Rebuild needed? |
|--------------|-----------------|
| `canton/daml/**/*.daml` | Yes — DAR is compiled in the image |
| `canton/docker/start-sandbox.sh` | Yes |
| `deploy/docker/Dockerfile.canton` | Yes |
| Orchestrator Java only (`apps/services/blockchain-orchestrator-service`) | No — redeploy orchestrator only |
| Cloud Run env vars only | No — use `-SkipBuild` |

### Verify after deploy

```bash
# Canton JSON API (admin JWT used by local scripts)
curl -s -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJzYW5kYm94IiwiYXBwbGljYXRpb25JZCI6ImdjdWwtb3JjaGVzdHJhdG9yIiwiYWRtaW4iOnRydWUsImFjdEFzIjpbXSwicmVhZEFzIjpbXX0sImV4cCI6NDEwMjQ0NDgwMH0." \
  "$(gcloud run services describe gcul-canton --region us-central1 --project insure360-83a36 --format='value(status.url)')/v1/parties"

# Orchestrator Canton status
curl -s https://gcul-blockchain-orchestrator-690935448909.us-central1.run.app/api/blockchain/canton/status
```

Service URLs are also written to `deploy/cloud-run-urls.json`.

See also [`docs/CLOUD-RUN-DEPLOY.md`](../docs/CLOUD-RUN-DEPLOY.md) for all backend services.
