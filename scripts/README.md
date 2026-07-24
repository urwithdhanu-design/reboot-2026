# GCUL scripts (Windows CMD)

**Local development:** use **`local-dev.cmd`** from the repo root.

```cmd
cd C:\projects\gcul
local-dev.cmd help
local-dev.cmd setup
local-dev.cmd start
```

See [`local/README.md`](local/README.md) for the **full Windows guide** (prerequisites, `.ps1` files, troubleshooting, ports).

## Cloud deploy

| Script | Purpose |
|--------|---------|
| `deploy\deploy-cloud-run.cmd` | Build + deploy all Cloud Run services (`set GCP_PROJECT=...` first) |
| `deploy\deploy-firebase.cmd` | Build + deploy Hosting |

See [`deploy/README.md`](../deploy/README.md) and [`deploy/GCP-PROJECTS.md`](../deploy/GCP-PROJECTS.md).

## Legacy local scripts (still work)

| Script | Replaced by |
|--------|-------------|
| `scripts\install-gcul-messaging.cmd` | `local-dev.cmd setup` |
| `scripts\start-local-apis.cmd` | `local-dev.cmd apis` |
| `scripts\status-local-apis.cmd` | `local-dev.cmd status` |
| `scripts\stop-local-apis.cmd` | `local-dev.cmd stop` (APIs only via legacy script) |
| `scripts\set-api-target.cmd` | `local-dev.cmd target local\|cloud` |
