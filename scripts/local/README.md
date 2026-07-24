# GCUL local development — Windows guide

Run everything from the **repo root** using one entry point:

```cmd
cd C:\projects\gcul
local-dev.cmd help
```

> **You do not need to run `.ps1` files directly.** Use `local-dev.cmd` — it handles PowerShell for you.

---

## Prerequisites

Install these before your first `local-dev.cmd setup`:

| Tool | Version | Used for |
|------|---------|----------|
| **Java JDK** | 17+ | Java microservices (Maven) |
| **Node.js** | 18+ (LTS) | Customer + admin React apps |
| **Python** | 3.10+ | Optional: chatbot + GCUL sidecar |
| **Git** | any recent | Clone the repo |

Check:

```cmd
java -version
node -version
npm -version
python --version
```

---

## Quick start (3 steps)

### 1. First time (after clone)

```cmd
cd C:\projects\gcul
local-dev.cmd setup
```

This will:

- Install `gcul-messaging` into your local Maven repo (required before Java builds)
- Run `npm install` in `apps\web` and `apps\admin`
- Create `.local-dev\api-target.env` with `VITE_API_TARGET=local`

### 2. Start the full local stack

```cmd
local-dev.cmd start
```

This will:

- Set API target to **local** (UI → your PC, not Cloud Run)
- Start all Java microservices (ports 8081–8089, 8092)
- Start customer + admin Vite dev servers

| App | URL |
|-----|-----|
| Customer | http://localhost:5174 |
| Admin | http://localhost:5175 |

**First Maven boot can take 1–3 minutes** (downloads dependencies). Check progress:

```cmd
local-dev.cmd status
```

Service logs: `.local-dev\logs\` (e.g. `kyc.log`, `policy.log`, `web.log`, `admin.log`)

### 3. Stop when done

```cmd
local-dev.cmd stop
```

Stop only the UIs (keep backends running): `local-dev.cmd stop ui`

---

## All commands

| Command | What it does |
|---------|----------------|
| `local-dev.cmd help` | Show command list |
| `local-dev.cmd setup` | First-time install (Maven lib + npm) |
| `local-dev.cmd start` | **Full local stack** — APIs + customer + admin UI |
| `local-dev.cmd cloud` | UI only → Cloud Run APIs (no local Java) |
| `local-dev.cmd apis` | Java backends only |
| `local-dev.cmd apis python` | Also chatbot (:8090) + GCUL sidecar (:8091) |
| `local-dev.cmd ui` | Customer + admin Vite servers only |
| `local-dev.cmd status` | Ports up/down, DB mode, API target |
| `local-dev.cmd stop` | Stop APIs and UIs |
| `local-dev.cmd stop ui` | Stop UIs only |
| `local-dev.cmd target local` | Point UI `/api/*` to localhost |
| `local-dev.cmd target cloud` | Point UI `/api/*` to Cloud Run |

**Demo password** after register: `ChangeMe123!`

---

## Two ways to run locally

### Option A — Full local (backends on your PC)

```cmd
local-dev.cmd start
```

Best when you are changing Java services or want to work fully offline.

### Option B — Cloud demo (UI only)

```cmd
local-dev.cmd cloud
```

Best for frontend-only work. The UI talks to deployed Cloud Run APIs — no Maven/Java startup needed.

You can switch API target without restarting backends:

```cmd
local-dev.cmd target local
local-dev.cmd target cloud
```

Then restart UIs: `local-dev.cmd ui`

Config file (both web + admin read this): `.local-dev\api-target.env`

```env
VITE_API_TARGET=local
```

---

## What are the `.ps1` files?

PowerShell scripts (`.ps1`) are the **implementation** behind the `.cmd` entry points. They do things CMD cannot easily do:

- Check which TCP ports are listening
- Start Java / Python / Node processes in the background
- Write logs under `.local-dev\logs\`
- Call `/health` on each service for status output

### How it is wired

```text
You type:
  local-dev.cmd start

Which runs:
  scripts\local.cmd start

Which calls:
  scripts\local\_lib\start-local.ps1
    → api-target.ps1   (set VITE_API_TARGET=local)
    → start-apis.ps1   (Java services)
    → start-ui.ps1     (Vite dev servers)
```

### PowerShell files reference

| File | Purpose |
|------|---------|
| `_lib/common.ps1` | Shared paths, service list, ports |
| `_lib/setup.ps1` | Maven messaging lib + npm install |
| `_lib/start-apis.ps1` | Start Java backends |
| `_lib/start-ui.ps1` | Start customer + admin Vite |
| `_lib/start-local.ps1` | Full local stack (APIs + UI) |
| `_lib/start-cloud.ps1` | Cloud demo (UI only) |
| `_lib/status.ps1` | Port / health / API target status |
| `_lib/stop-apis.ps1` | Stop Java/Python services |
| `_lib/stop-ui.ps1` | Stop Vite on 5174 / 5175 |
| `_lib/stop.ps1` | Stop APIs + UIs |
| `_lib/api-target.ps1` | Write `.local-dev\api-target.env` |

Legacy forwards (still work): `scripts\start-local-apis.ps1`, `stop-local-apis.ps1`, `status-local-apis.ps1`

---

## How to use on Windows

### Recommended — Command Prompt or PowerShell

Open **Command Prompt** or **Windows Terminal**, then:

```cmd
cd C:\projects\gcul
local-dev.cmd setup
local-dev.cmd start
local-dev.cmd status
```

Works from CMD because `local-dev.cmd` passes `-ExecutionPolicy Bypass` to PowerShell automatically.

### Advanced — run a `.ps1` directly (debugging only)

Open **PowerShell**:

```powershell
cd C:\projects\gcul

# If Windows blocks scripts, allow for this session only:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Examples:
.\scripts\local\_lib\status.ps1
.\scripts\local\_lib\start-apis.ps1
```

If you see **"running scripts is disabled on this system"**:

1. **Easiest:** use `local-dev.cmd` instead (no policy change needed), or
2. **Per session:** `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell

---

## Service ports

### Java APIs

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

### Optional Python

| Service | Port |
|---------|------|
| chatbot | 8090 |
| gcul-sidecar | 8091 |

Start with: `local-dev.cmd apis python`

### UIs

| App | Port |
|-----|------|
| Customer (`apps/web`) | 5174 |
| Admin (`apps/admin`) | 5175 |

---

## Troubleshooting

### Maven fails: `google-cloud-firestore` version missing

Run `local-dev.cmd setup` first. If a service still fails, ensure `pom.xml` pins `google-cloud-firestore` (see `policy-service` for the working version).

### Maven fails: `gcul-messaging` not found

```cmd
local-dev.cmd setup
```

Or legacy: `scripts\install-gcul-messaging.cmd`

### Port already in use

```cmd
local-dev.cmd stop
local-dev.cmd status
```

Or force-start APIs: `local-dev.cmd apis force`

### UI shows API errors with `local` target

Backends may still be starting. Wait 1–3 minutes, then:

```cmd
local-dev.cmd status
```

All Java rows should show `up`. Check `.local-dev\logs\kyc.log` (etc.) for errors.

### UI changes API target but still hits old backend

Restart UIs after changing target:

```cmd
local-dev.cmd target local
local-dev.cmd stop ui
local-dev.cmd ui
```

### Firestore cache (optional)

Firestore is **disabled by default** for local Java (`GCUL_FIRESTORE_ENABLED=false`). Apps fall back to REST APIs. To disable client-side Firestore reads in the UI, set in `apps/web/.env.local` or `apps/admin/.env.local`:

```env
VITE_FIRESTORE_CACHE=false
```

---

## Folder layout

```text
C:\projects\gcul\
  local-dev.cmd                 ← start here (repo root)
  .local-dev\
    api-target.env              ← local vs cloud API routing
    logs\                       ← service + UI logs
  scripts\
    local.cmd                   ← dispatcher
    local\
      README.md                 ← this file
      _lib\                     ← PowerShell implementation (*.ps1)
    start-local-apis.cmd        ← legacy (forwards to local.cmd)
    set-api-target.cmd          ← legacy (forwards to local.cmd)
  apps\
    web\                        ← customer UI
    admin\                      ← admin UI
    services\                   ← Java microservices
```

---

## Legacy scripts (still work)

| Old script | Use instead |
|------------|-------------|
| `scripts\install-gcul-messaging.cmd` | `local-dev.cmd setup` |
| `scripts\start-local-apis.cmd` | `local-dev.cmd apis` |
| `scripts\status-local-apis.cmd` | `local-dev.cmd status` |
| `scripts\stop-local-apis.cmd` | `local-dev.cmd stop` (legacy stops APIs only) |
| `scripts\set-api-target.cmd` | `local-dev.cmd target local\|cloud` |

---

## See also

- [`apps/services/LOCAL-DEV.md`](../../apps/services/LOCAL-DEV.md) — short quick-reference
- [`scripts/README.md`](../README.md) — scripts index + cloud deploy
- [`deploy/GCP-PROJECTS.md`](../../deploy/GCP-PROJECTS.md) — GCP / Firebase project layout
