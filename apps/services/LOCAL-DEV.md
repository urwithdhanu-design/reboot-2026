# Local development — quick guide

## 1. Start all backend APIs at once (CMD)

From repo root:

```cmd
cd C:\projects\gcul
scripts\start-local-apis.cmd
scripts\status-local-apis.cmd
```

Optional Python (chatbot + GCUL sidecar):

```cmd
scripts\start-local-apis.cmd python
```

Wait **1–3 minutes** on first Maven start. Logs: `.local-dev\logs\`.

Stop:

```cmd
scripts\stop-local-apis.cmd
scripts\stop-local-apis.cmd python
```

### Java ports

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

---

## 2. Local vs Cloud Run APIs (one flag)

Customer and admin dev servers proxy `/api/*` based on **`VITE_API_TARGET`**:

| Flag | Meaning |
|------|---------|
| **`local`** (default) | Vite → `http://127.0.0.1:8081`–`8089` (start backends first) |
| **`cloud`** | Vite → URLs in `deploy/cloud-api.targets.json` (Cloud Run) |

### Shared config file (both web + admin)

Edit:

```text
.local-dev\api-target.env
```

```env
VITE_API_TARGET=local
```

or

```env
VITE_API_TARGET=cloud
```

### Or use CMD

```cmd
scripts\set-api-target.cmd local
scripts\set-api-target.cmd cloud
```

**Restart** `npm run dev` after changing the flag (Vite reads config at startup).

Legacy: `VITE_API_PROXY=cloud` in `apps/web/.env.local` still works.

### Run the UIs

```cmd
scripts\set-api-target.cmd local
cd apps\web
npm run dev
```

- Customer: http://localhost:5173  
- Admin: `cd apps\admin` → `npm run dev` → http://localhost:5174  

Console on startup shows either `API target: local` or `API target: cloud`.

---

## 3. Backend DB mode (local machines)

Each Java service uses **H2** when `gcul.cloud-sql.enabled=false` in `application.properties` (default for local).  
`scripts\status-local-apis.cmd` shows **database: h2** vs **cloud-sql-postgresql** from `/health`.

---

## 4. Deploy (Cloud Run + Cloud SQL)

See [deploy/README.md](../../deploy/README.md) and [deploy/GCP-PROJECTS.md](../../deploy/GCP-PROJECTS.md).

Demo password after register: **`ChangeMe123!`**
