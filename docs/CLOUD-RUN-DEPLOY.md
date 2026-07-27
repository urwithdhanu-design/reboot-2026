# Build and deploy to Cloud Run (after code changes)

Practical guide for shipping backend microservice changes to **Google Cloud Run** from a **Windows** or **macOS** machine. For first-time GCP project setup, Cloud SQL, Pub/Sub, and architecture details, see [`deploy/README.md`](../deploy/README.md).

**Live app URLs and login:** [`docs/HOSTING-ACCESS.md`](HOSTING-ACCESS.md)

---

## What gets deployed

| You changed… | Deploy with |
|--------------|-------------|
| A Java service under `apps/services/*` | `deploy/deploy-cloud-run.ps1` (one or all services) |
| `gcul-sidecar` or `chatbot-assistance-service` | Same script (different Dockerfiles) |
| Customer or admin React app (`apps/web`, `apps/admin`) | `deploy/deploy-firebase.ps1` |
| API rewrite routes (`deploy/api-rewrites.json`) | Redeploy Firebase Hosting |

Cloud Build compiles each service in the cloud (you do **not** need local Java or Maven for deployment). Images are pushed to Artifact Registry and rolled out to Cloud Run.

Default GCP project: **`insure360-83a36`** (see `deploy/firebase-project.json`).

---

## One-time setup (each machine)

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`).
2. Install [Firebase CLI](https://firebase.google.com/docs/cli) (`firebase`) if you deploy the web UIs.
3. Authenticate:

   ```bash
   gcloud auth login
   gcloud auth application-default login
   firebase login
   ```

4. Set your project (add to shell profile on Mac, or set each session on Windows):

   **Windows (PowerShell)**

   ```powershell
   $env:GCP_PROJECT = "insure360-83a36"
   $env:GCP_REGION = "us-central1"   # optional; this is the default
   ```

   **Windows (CMD)**

   ```cmd
   set GCP_PROJECT=insure360-83a36
   set GCP_REGION=us-central1
   ```

   **macOS (bash/zsh)**

   ```bash
   export GCP_PROJECT=insure360-83a36
   export GCP_REGION=us-central1
   ```

5. **macOS only:** install PowerShell so you can run the same deploy scripts as Windows:

   ```bash
   brew install powershell
   ```

   The deploy scripts are PowerShell (`.ps1`). On Windows, PowerShell is built in; on Mac, use `pwsh`.

---

## Service name cheat sheet

When you edit code locally, map the folder to the Cloud Run service id in `deploy/services.json`:

| Local path | Cloud Run service id |
|------------|----------------------|
| `apps/services/kyc-service` | `gcul-kyc` |
| `apps/services/wallet-service` | `gcul-wallet` |
| `apps/services/policy-service` | `gcul-policy` |
| `apps/services/payment-service` | `gcul-payment` |
| `apps/services/notification-service` | `gcul-notification` |
| `apps/services/claims-service` | `gcul-claims` |
| `apps/services/parametric-claim-service` | `gcul-parametric` |
| `apps/services/premium-deposit-service` | `gcul-premium-deposit` |
| `apps/services/blockchain-orchestrator-service` | `gcul-blockchain-orchestrator` |
| `apps/services/gcul-sidecar` | `gcul-sidecar` |
| `apps/services/chatbot-assistance-service` | `gcul-chatbot` |
| `canton` (Daml sandbox) | `gcul-canton` |

`gcul-canton` is an **internal** Cloud Run service (not routed via Firebase Hosting). Deploy it before `gcul-blockchain-orchestrator` so Canton minting works in cloud. See [`canton/README.md`](../canton/README.md).

### Deploy Canton (Daml ledger sandbox)

Full build/push/deploy guide: [`canton/README.md`](../canton/README.md#build-and-push-to-cloud-run).

Canton runs as `gcul-canton` on Cloud Run. The blockchain orchestrator talks to it over HTTP (JSON Ledger API).

**Quick deploy (build + push + rollout):**

**Windows:**

```powershell
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-canton,gcul-blockchain-orchestrator
```

**macOS:**

```bash
export GCP_PROJECT=insure360-83a36
pwsh ./deploy/deploy-cloud-run.ps1 -ServiceIds gcul-canton,gcul-blockchain-orchestrator
```

**Build and push image only (no deploy):**

```bash
IMAGE="us-central1-docker.pkg.dev/insure360-83a36/gcul/gcul-canton:latest"
gcloud builds submit . --project=insure360-83a36 \
  --config=deploy/cloudbuild-service.yaml \
  --substitutions="_IMAGE=$IMAGE,_DOCKERFILE=deploy/docker/Dockerfile.canton,_SERVICE_DIR=canton"
```

**Verify:**

```bash
curl -s https://gcul-blockchain-orchestrator-690935448909.us-central1.run.app/api/blockchain/canton/status
```

**Important:** Canton ledger state is **ephemeral** on Cloud Run (resets on redeploy). It uses `minInstances: 1` and 4 GiB RAM. Not a substitute for a production Canton Network deployment.

---

## Typical workflow after a code change

### 1. Deploy only the service you changed (fastest)

Use this when you touched one microservice and want a quick iteration.

**Windows (PowerShell)** — from repo root:

```powershell
cd C:\projects\gcul
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-claims
```

**Windows (CMD):**

```cmd
cd C:\projects\gcul
set GCP_PROJECT=insure360-83a36
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\deploy-cloud-run.ps1 -ServiceIds gcul-claims
```

**macOS:**

```bash
cd ~/path/to/gcul
export GCP_PROJECT=insure360-83a36
pwsh ./deploy/deploy-cloud-run.ps1 -ServiceIds gcul-claims
```

Deploy multiple services in one run:

```powershell
.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-claims,gcul-policy
```

**What the script does for each service**

1. `gcloud builds submit` — builds a Docker image via `deploy/cloudbuild-service.yaml`
2. Pushes to `us-central1-docker.pkg.dev/$GCP_PROJECT/gcul/<service-id>:latest`
3. `gcloud run deploy` — rolls out the new image with env vars from `deploy/services.json`

Service URLs are merged into `deploy/cloud-run-urls.json`.

### 2. Deploy all backend services

Use after wide-ranging changes, when peer service URLs need re-linking (wallet ↔ policy ↔ orchestrator), or before a release.

**Windows:**

```powershell
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-cloud-run.ps1
```

Or the CMD wrapper:

```cmd
set GCP_PROJECT=insure360-83a36
deploy\deploy-cloud-run.cmd
```

**macOS:**

```bash
export GCP_PROJECT=insure360-83a36
pwsh ./deploy/deploy-cloud-run.ps1
```

A full deploy also updates cross-service env vars (for example `gcul-blockchain-orchestrator` → sidecar, claims, notification, payment URLs).

### 3. Redeploy without rebuilding (image unchanged)

If you only changed Cloud Run settings or env vars and want to reuse the existing `:latest` image:

**Windows:**

```powershell
.\deploy\deploy-cloud-run.ps1 -SkipBuild
```

**Windows CMD:**

```cmd
deploy\deploy-cloud-run.cmd skipbuild
```

**macOS:**

```bash
pwsh ./deploy/deploy-cloud-run.ps1 -SkipBuild
```

---

## Optional flags (Cloud SQL and Pub/Sub)

If your project already has Cloud SQL or Pub/Sub configured (see [`deploy/README.md`](../deploy/README.md)):

```powershell
$env:GCUL_USE_CLOUD_SQL = "true"   # uses deploy/cloud-sql-connection.json
$env:GCUL_USE_PUBSUB = "true"      # after deploy/setup-pubsub.ps1
.\deploy\deploy-cloud-run.ps1
```

On Mac, use `export` instead of `$env:`.

If `deploy/cloud-sql-connection.json` exists and you do not set `GCUL_USE_CLOUD_SQL=false`, the script enables Cloud SQL automatically.

---

## Deploy frontend changes (Firebase Hosting)

After changing `apps/web` or `apps/admin`, rebuild and publish Hosting (API calls still go to Cloud Run via rewrites):

**Windows:**

```powershell
$env:GCP_PROJECT = "insure360-83a36"
.\deploy\deploy-firebase.ps1
```

**Windows CMD:**

```cmd
set GCP_PROJECT=insure360-83a36
deploy\deploy-firebase.cmd
```

**macOS:**

```bash
export GCP_PROJECT=insure360-83a36
pwsh ./deploy/deploy-firebase.ps1
```

Requires Node.js 20+. The script runs `npm ci` / `npm run build` for both apps, then `firebase deploy`.

---

## Verify the deployment

1. **List services**

   ```bash
   gcloud run services list --project insure360-83a36 --region us-central1
   ```

2. **Check a service URL** (also in `deploy/cloud-run-urls.json`)

   ```bash
   gcloud run services describe gcul-kyc --region us-central1 --project insure360-83a36 --format="value(status.url)"
   ```

3. **Health check** (replace with your service URL)

   ```bash
   curl -s https://gcul-kyc-XXXXX-uc.a.run.app/health
   ```

4. **End-to-end via Hosting** — open the customer or admin app from [`docs/HOSTING-ACCESS.md`](HOSTING-ACCESS.md) and exercise the feature you changed.

5. **Cloud Build logs** (if a build failed)

   ```bash
   gcloud builds list --project insure360-83a36 --limit 5
   ```

---

## Manual single-service deploy (without PowerShell)

If you cannot use `pwsh` on Mac, run the same steps the script uses. Example for **kyc-service**:

```bash
cd /path/to/gcul
export GCP_PROJECT=insure360-83a36
export GCP_REGION=us-central1

IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/gcul/gcul-kyc:latest"

gcloud builds submit . \
  --project="$GCP_PROJECT" \
  --config=deploy/cloudbuild-service.yaml \
  --substitutions="_IMAGE=$IMAGE,_DOCKERFILE=deploy/docker/Dockerfile.java,_SERVICE_DIR=apps/services/kyc-service"

gcloud run deploy gcul-kyc \
  --image "$IMAGE" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "SPRING_PROFILES_ACTIVE=cloud" \
  --project "$GCP_PROJECT"
```

For other services, change the service id, `_SERVICE_DIR`, and dockerfile (`deploy/docker/Dockerfile.gcul-sidecar` or `deploy/docker/Dockerfile.chatbot` for Python services). See `deploy/services.json` for the full list.

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `Set GCP_PROJECT` / project not set | Export or `$env:GCP_PROJECT` before running scripts |
| `gcloud: command not found` | Install Cloud SDK and restart the terminal |
| `pwsh: command not found` (Mac) | `brew install powershell` |
| Cloud Build compile error | Open the build in [Cloud Console → Cloud Build](https://console.cloud.google.com/cloud-build/builds); fix Java/Python errors locally if possible |
| Permission denied on deploy | `gcloud auth login` and ensure your account has Cloud Run Admin + Cloud Build Editor on the project |
| Orchestrator cannot reach sidecar/claims | Run a **full** deploy (no `-ServiceIds`) so peer URLs are re-linked |
| Wallet/policy integration broken after partial deploy | Full deploy, or redeploy `gcul-kyc` then `gcul-wallet` then `gcul-policy` in order |
| UI still shows old behavior | Hard-refresh the browser; if you changed React code, run `deploy-firebase.ps1` |
| Windows concurrent build errors | The script pauses between services; avoid running two `deploy-cloud-run` jobs at once |

---

## Quick reference

| Task | Windows | macOS |
|------|---------|-------|
| Deploy one service | `.\deploy\deploy-cloud-run.ps1 -ServiceIds gcul-claims` | `pwsh ./deploy/deploy-cloud-run.ps1 -ServiceIds gcul-claims` |
| Deploy all services | `.\deploy\deploy-cloud-run.ps1` | `pwsh ./deploy/deploy-cloud-run.ps1` |
| Deploy all (CMD) | `deploy\deploy-cloud-run.cmd` | — |
| Skip Docker rebuild | `-SkipBuild` or `skipbuild` | `-SkipBuild` |
| Deploy web UIs | `.\deploy\deploy-firebase.ps1` | `pwsh ./deploy/deploy-firebase.ps1` |

**Related docs:** [`deploy/README.md`](../deploy/README.md) · [`deploy/COST.md`](../deploy/COST.md) · [`docs/LOCAL-SETUP.md`](LOCAL-SETUP.md)
