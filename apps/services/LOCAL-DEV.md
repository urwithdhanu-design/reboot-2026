# Local development — quick guide

Use **`local-dev.cmd`** from the repo root — one command for setup, start, stop, and status.

**Full Windows guide (prerequisites, `.ps1` files, troubleshooting):** [`scripts/local/README.md`](../../scripts/local/README.md)  
**New machine setup (step-by-step):** [`docs/LOCAL-SETUP.md`](../../docs/LOCAL-SETUP.md)  
**Minting, deposits & claims (architecture):** [`docs/MINT-DEPOSITS-CLAIMS.md`](../../docs/MINT-DEPOSITS-CLAIMS.md)

## First time

```cmd
cd C:\projects\gcul
local-dev.cmd setup
```

## Run everything locally

```cmd
local-dev.cmd start
```

| App | URL |
|-----|-----|
| Customer | http://localhost:5174 |
| Admin | http://localhost:5175 |

Wait **1–3 minutes** on first Maven start. Then:

```cmd
local-dev.cmd status
```

Logs: `.local-dev\logs\`

Stop:

```cmd
local-dev.cmd stop
```

## Cloud demo (no local Java)

UI talks to deployed Cloud Run APIs:

```cmd
local-dev.cmd cloud
```

## Granular control

| Command | Purpose |
|---------|---------|
| `local-dev.cmd apis` | Java backends only |
| `local-dev.cmd apis python` | + chatbot (:8090) + sidecar (:8091) |
| `local-dev.cmd ui` | Customer + admin Vite only |
| `local-dev.cmd target local` | UI → localhost APIs |
| `local-dev.cmd target cloud` | UI → Cloud Run APIs |

Config file (both web + admin read this): `.local-dev\api-target.env`

```env
VITE_API_TARGET=local
```

Restart UIs after changing the target.

---

## Java ports

| Service | Port |
|---------|------|
| kyc | 8081 |
| wallet | 8089 |
| policy | 8082 |
| payment | 8083 |
| notification | 8084 |
| claims | 8085 |
| parametric | 8086 |
| premium-deposit | 8087 |
| blockchain-orchestrator | 8088 |
| audit | 8092 |
| chatbot (optional) | 8090 |
| gcul-sidecar (optional) | 8091 |

---

## Backend DB mode

Each Java service uses **H2** when `gcul.cloud-sql.enabled=false` in `application.properties` (default for local).  
`local-dev.cmd status` shows **h2** vs **cloud-sql-postgresql** from `/health`.

---

## Deploy (Cloud Run + Cloud SQL)

See [deploy/README.md](../../deploy/README.md) and [deploy/GCP-PROJECTS.md](../../deploy/GCP-PROJECTS.md).

Demo password after register: **`ChangeMe123!`**

Script reference: [`scripts/local/README.md`](../../scripts/local/README.md)
