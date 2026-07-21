# GCUL cost-conscious cloud layout

## What “request-based” means here

| Component | Billing model | What we configure |
|-----------|---------------|-------------------|
| **Cloud Run** | Pay per request + CPU/memory while handling requests | `minInstances: 0` (scale to zero), capped `maxInstances`, default concurrency |
| **Cloud SQL** | **Not** per-request — instance runs while **started** | **One** small zonal instance, **one PostgreSQL database per Java microservice** (cheaper than 8 instances) |
| **Sidecar / chatbot** | Cloud Run only | No SQL; chatbot uses FAISS in container (or Pinecone if you add keys) |

There is no fully serverless PostgreSQL on GCP at Firestore-style pricing. The lowest-cost SQL pattern for this repo is **one shared `gcul-pg` instance** + isolated databases (`gcul_kyc`, `gcul_policy`, …).

## Estimated monthly (order of magnitude)

- **Cloud Run** (low traffic, scale to zero): often **$0–few dollars**
- **Cloud SQL `db-f1-micro` / `db-g1-small`**, zonal, 10 GB HDD: roughly **~$10–25/month** while the instance is **running**
- **Stop SQL when idle** (dev): `gcloud sql instances patch gcul-pg --activation-policy=NEVER` — no compute charge while stopped (storage still billed)

## Enable Cloud SQL + redeploy

```powershell
$env:GCP_PROJECT = "community-hub-6fb1b"
.\deploy\setup-cloud-sql.ps1
$env:GCUL_USE_CLOUD_SQL = "true"
.\deploy\deploy-cloud-run.ps1
```

Without `GCUL_USE_CLOUD_SQL=true`, services keep **ephemeral H2** in `/tmp` (no SQL cost, data not durable).

## Keep Cloud Run cheap

Defaults in `deploy/services.json` → `cloudRun`:

- `minInstances: 0` — no idle containers
- `maxInstances: 5` — cap burst spend
- `concurrency: 80` — fewer cold starts vs concurrency 1

Avoid `--min-instances=1` unless you need always-warm latency.

## Chatbot

Default image is heavy (PyTorch). For lower cost, use smaller memory after lazy-load fix, or disable deploy of `gcul-chatbot` until needed.
