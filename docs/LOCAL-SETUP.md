# Local setup on a new machine

Step-by-step guide to clone, install, start, and test the GCUL insurance platform locally on a **new Windows laptop**.

For command reference and troubleshooting details, see also:

- [`scripts/local/README.md`](../scripts/local/README.md) — full Windows dev guide
- [`apps/services/LOCAL-DEV.md`](../apps/services/LOCAL-DEV.md) — short quick reference
- [`canton/README.md`](../canton/README.md) — Canton sandbox

---

## 1. Prerequisites

Install these before your first run:

| Tool | Version | Used for | Download |
|------|---------|----------|----------|
| **Git** | Recent | Clone the repo | https://git-scm.com |
| **Java JDK** | **17+** | Java microservices (Maven) | https://adoptium.net |
| **Node.js** | **18+ LTS** | Customer + admin React apps | https://nodejs.org |
| **Docker Desktop** | Recent | Canton local sandbox (on-chain mint) | https://www.docker.com/products/docker-desktop/ |

Docker is required for **Canton** (on-chain policy minting). Without Docker, most flows still work using simulated minting.

Verify installations:

```cmd
git --version
java -version
node -version
npm -version
docker --version
```

Optional (not required for core flows):

| Tool | Version | Used for |
|------|---------|----------|
| **Python** | 3.10+ | Chatbot (:8090) + GCUL sidecar (:8091) |

---

## 2. Clone the repository

```cmd
cd C:\projects
git clone <your-repo-url> gcul
cd gcul
```

Replace `<your-repo-url>` with your actual Git remote (GitHub, Azure DevOps, etc.).

---

## 3. First-time setup

From the **repo root**:

```cmd
cd C:\projects\gcul
local-dev.cmd setup
```

This will:

- Install `gcul-messaging` into your local Maven repository (required before Java builds)
- Run `npm install` in `apps\web` and `apps\admin`
- Create `.local-dev\api-target.env` with `VITE_API_TARGET=local`

### If `local-dev.cmd setup` fails

Run these commands manually:

```cmd
cd C:\projects\gcul\apps\libs\gcul-messaging
..\..\services\kyc-service\mvnw.cmd install -DskipTests

cd C:\projects\gcul\apps\web
npm install

cd C:\projects\gcul\apps\admin
npm install
```

Create `.local-dev\api-target.env`:

```env
VITE_API_TARGET=local
```

---

## 4. Start the full stack

```cmd
cd C:\projects\gcul
local-dev.cmd start
```

This will:

1. Set API target to **local** (UI calls your PC, not Cloud Run)
2. Start the **Canton** sandbox via Docker (first run may take several minutes)
3. Start all **Java microservices** (ports 8081–8089, 8092)
4. Start **customer** and **admin** Vite dev servers

**First Maven boot can take 1–3 minutes** while dependencies download.

### Verify services are running

```cmd
local-dev.cmd status
```

All Java services and both UIs should show **`up`**.

| App | URL |
|-----|-----|
| **Customer UI** | http://localhost:5174 |
| **Admin UI** | http://localhost:5175 |

### Logs

Service and UI logs are written to:

```text
.local-dev\logs\
```

Examples: `kyc.log`, `policy.log`, `claims.log`, `parametric.log`, `blockchain.log`, `web.log`, `admin.log`

### Stop when done

```cmd
local-dev.cmd stop
```

Stop UIs only (keep backends running): `local-dev.cmd stop ui`

---

## 5. Optional configuration

### Email (welcome / password reset)

Copy the example env file and add a Gmail App Password:

```cmd
copy apps\services\kyc-service\.env.example apps\services\kyc-service\.env
```

Edit `apps\services\kyc-service\.env`:

```env
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-16-char-app-password
```

Restart APIs after changing env files: `local-dev.cmd stop` then `local-dev.cmd apis`

### Flight delay oracle (parametric auto-claims)

Manual simulation works without an API key. For **live** flight data, set in the environment or `apps\services\parametric-claim-service\.env`:

```env
AVIATIONSTACK_API_KEY=your_key
GCUL_FLIGHT_ORACLE_PROVIDER=aviationstack
GCUL_FLIGHT_ORACLE_POLL_MS=300000
```

Free tier: https://aviationstack.com

Restart the parametric service after adding keys.

### Canton blockchain

`local-dev.cmd start` starts Canton automatically. Manual control:

```cmd
local-dev.cmd canton status
local-dev.cmd canton stop
```

| Endpoint | URL |
|----------|-----|
| JSON Ledger API | http://127.0.0.1:7575 |
| gRPC Ledger API | 127.0.0.1:6865 |

If Canton is offline, the blockchain orchestrator falls back to simulated minting so other flows still work.

---

## 6. Service ports

### Java APIs

| Service | Port |
|---------|------|
| kyc | 8081 |
| policy | 8082 |
| payment | 8083 |
| notification | 8084 |
| claims | 8085 |
| parametric | 8086 |
| premium-deposit | 8087 |
| blockchain-orchestrator | 8088 |
| wallet | 8089 |
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

## 7. End-to-end testing checklist

### A. Customer registration and login

1. Open http://localhost:5174
2. **Register** a new account
3. Demo password after register: **`ChangeMe123!`**
4. Log in

### B. KYC verification

1. Complete KYC in the customer app
2. In admin (http://localhost:5175) → **KYC Review** → approve if manual review is required

### C. Wallet setup

1. Customer → **Wallet**
2. **Create / link wallet** (demo wallet with 0x address)
3. Optionally **recharge** balance for wallet-based premium payment

### D. Quote and premium payment (e.g. Travel Protect Plus)

1. Customer → **Marketplace** → select **Travel Protect Plus**
2. Complete the quote wizard (enter a real email in the form when possible)
3. Pay via:
   - **Wallet** (if balance is sufficient), or
   - **Stripe** demo checkout
4. Go to **Policies → Manage**
5. Policy should appear with status such as **Cover active · Premium paid · Issued** or **Minted on Canton**

### E. Canton mint (admin)

1. Admin → **Tokenization**
2. Find the policy in the mint queue → **Approve Mint**
3. Customer **Manage** tab should show **Minted on Canton**

### F. Manual claim

1. Customer → **Claims** → submit a claim against a Canton-minted policy
2. Admin → **Claims** → **Review** → **Approve & pay**
3. Customer wallet should be credited

### G. Parametric auto-claim (flight delay)

1. Admin → **Parametric**
2. Create a **flight delay rule** for a Canton-minted travel policy
3. Under **Manual simulation**, set delay above threshold (e.g. **270** minutes for a 240-minute rule)
4. Click **Simulate delay**
5. Check **Claims → Parametric auto** for the auto-settled claim
6. Or use **Poll live flight delay** if `AVIATIONSTACK_API_KEY` is configured

### H. Admin dashboard

Admin → **Dashboard** — live metrics from backend APIs (policies, claims, tokenization, chain observability)

---

## 8. Daily commands

| Action | Command |
|--------|---------|
| Start everything | `local-dev.cmd start` |
| Check status | `local-dev.cmd status` |
| Stop everything | `local-dev.cmd stop` |
| Backends only | `local-dev.cmd apis` |
| UIs only | `local-dev.cmd ui` |
| Point UI to local APIs | `local-dev.cmd target local` |
| Point UI to cloud APIs (no local Java) | `local-dev.cmd cloud` |

After changing API target, restart UIs: `local-dev.cmd ui`

---

## 9. Troubleshooting

### Port already in use

```cmd
local-dev.cmd stop
local-dev.cmd status
```

Force-start APIs: `local-dev.cmd apis force`

### Services still `down` after start

Wait 2–3 minutes, then run `local-dev.cmd status` again.  
Inspect `.local-dev\logs\<service>.log` for startup errors.

### Maven: `gcul-messaging` not found

```cmd
cd C:\projects\gcul\apps\libs\gcul-messaging
..\..\services\kyc-service\mvnw.cmd install -DskipTests
```

### UI loads but API calls fail

1. Confirm `local-dev.cmd status` — all Java rows should be `up`
2. Confirm `.local-dev\api-target.env` contains `VITE_API_TARGET=local`
3. Restart UIs: `local-dev.cmd stop ui` then `local-dev.cmd ui`

### Policy not showing in Manage tab after payment

1. Ensure you are logged in as the same user who paid
2. Link a wallet before or after payment
3. Wait ~10 seconds (UI polls after payment) or refresh the page
4. Restart **policy-service** if you recently pulled code fixes

### Canton / mint failures

```cmd
local-dev.cmd canton status
docker logs gcul-canton-sandbox
```

Ensure Docker Desktop is running.

### PowerShell script execution blocked

Use `local-dev.cmd` from **Command Prompt** — it passes `-ExecutionPolicy Bypass` automatically.

Or in PowerShell for the current session only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## 10. What to copy to another laptop

**Minimum (recommended):**

- Clone the full git repository (do not copy `node_modules/` or Maven `target/` folders)

**Optional (preserves local test data):**

- `apps\services\*\data\` — H2 database files from prior sessions
- `.local-dev\` — logs and API target configuration

**Do not commit or share:**

- `.env` files containing API keys, SMTP passwords, or Stripe secrets

---

## 11. Quick start summary

```cmd
git clone <repo-url> C:\projects\gcul
cd C:\projects\gcul
local-dev.cmd setup
local-dev.cmd start
local-dev.cmd status
```

Then open:

- **Customer:** http://localhost:5174
- **Admin:** http://localhost:5175

**Test flow:** Register → KYC → Wallet → Quote → Pay → Policies (Manage) → Claims / Parametric

**Demo password after register:** `ChangeMe123!`
