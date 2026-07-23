# GCUL scripts (Windows CMD)

Run from repo root: `cd C:\projects\gcul`

| `scripts\install-gcul-messaging.cmd` | Install `apps/libs/gcul-messaging` into local Maven (before first Java build) |

## Local Java APIs

| Script | Purpose |
|--------|---------|
| `scripts\start-local-apis.cmd` | Start all 9 Java microservices (background, logs in `.local-dev\logs\`) |
| `scripts\start-local-apis.cmd python` | Also chatbot (:8090) + gcul-sidecar (:8091) |
| `scripts\status-local-apis.cmd` | Ports up/down + H2 vs Cloud SQL from `/health` |
| `scripts\stop-local-apis.cmd` | Stop services on ports 8081-8089, 8092 |
| `scripts\stop-local-apis.cmd python` | Also stop 8090-8091 |

## Local vs Cloud Run (customer + admin UI)

| Script / file | Purpose |
|---------------|---------|
| `scripts\set-api-target.cmd local` | UI dev proxies `/api/*` to **localhost** |
| `scripts\set-api-target.cmd cloud` | UI dev proxies `/api/*` to **Cloud Run** (`deploy/cloud-api.targets.json`) |
| `.local-dev\api-target.env` | Same setting (`VITE_API_TARGET=local` or `cloud`) — used by `apps/web` and `apps/admin` Vite |

Restart `npm run dev` after changing the API target.

Full guide: [`apps/services/LOCAL-DEV.md`](../apps/services/LOCAL-DEV.md)

## Cloud deploy

| Script | Purpose |
|--------|---------|
| `deploy\deploy-cloud-run.cmd` | Build + deploy all Cloud Run services (`set GCP_PROJECT=...` first) |
| `deploy\deploy-firebase.cmd` | Build + deploy Hosting |

See [`deploy/README.md`](../deploy/README.md) and [`deploy/GCP-PROJECTS.md`](../deploy/GCP-PROJECTS.md).
