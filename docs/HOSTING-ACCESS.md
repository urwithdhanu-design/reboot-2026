# GCUL hosted apps — URLs, login, and Cloud Run

Quick reference for the **live Firebase Hosting** deployment on project **`insure360-83a36`**.

---

## Live URLs

| App | Primary URL | Also works |
|-----|-------------|------------|
| **Customer (web)** | https://insure360-83a36.web.app | https://insure360-83a36.firebaseapp.com |
| **Admin console** | https://insure360-83a36-admin.firebaseapp.com | https://insure360-83a36-admin.web.app |

### Customer — key pages

| Page | URL |
|------|-----|
| Home | https://insure360-83a36.web.app/ |
| **Register** | https://insure360-83a36.web.app/register |
| **Login** | https://insure360-83a36.web.app/login |
| Marketplace | https://insure360-83a36.web.app/marketplace |
| KYC | https://insure360-83a36.web.app/kyc (after sign-in) |

### Admin — key pages

| Page | URL |
|------|-----|
| **Admin login** | https://insure360-83a36-admin.firebaseapp.com/login |
| Dashboard (after login) | https://insure360-83a36-admin.firebaseapp.com/ |

---

## How to sign in

### Customer (public app)

There is **no shared demo customer account**. Each user creates their own account:

1. Open **https://insure360-83a36.web.app/register**
2. Enter full name, email, mobile, and password (minimum **8 characters**)
3. Accept terms and submit
4. After registration you are signed in and redirected to **KYC** (`/kyc`)
5. Complete KYC, then use **Marketplace** to browse products

**Returning users:** https://insure360-83a36.web.app/login — use the email and password you registered with.

**Forgot password:** https://insure360-83a36.web.app/login → forgot-password flow (Gmail SMTP on `gcul-kyc`).

**Welcome email:** Sent on registration when SMTP is configured (`EMAIL_USER` / `EMAIL_PASS` on Cloud Run, or `apps/services/kyc-service/.env` locally). Check spam if missing.

---

### Admin (platform console)

A **platform admin** account is created automatically when `gcul-kyc` starts (seeded on first run).

| Field | Value |
|-------|--------|
| **Login URL** | https://insure360-83a36-admin.firebaseapp.com/login |
| **Email** | `admin@reboot2026.local` |
| **Password** | `Reboot2026!Admin` |

These defaults come from `gcul-kyc` config (`GCUL_ADMIN_EMAIL` / `GCUL_ADMIN_PASSWORD`). If someone changed them on Cloud Run, use the updated values from the GCP console.

**After login** you can use: Customers, KYC review, Products, Policies, Payments, and other admin screens.

---

## Do these URLs connect to Cloud Run?

### How it is **designed** to work

```text
Browser  →  Firebase Hosting (insure360-83a36)
              │
              ├─ /, /register, /login, …  →  static React app (apps/web or apps/admin)
              │
              └─ /api/*                   →  Cloud Run (same GCP project)
                    ├─ /api/auth/*, /api/kyc/*     →  gcul-kyc
                    ├─ /api/products/*, …          →  gcul-policy
                    ├─ /api/claims/*             →  gcul-claims
                    └─ …                           →  other gcul-* services
```

So **yes — when fully configured**, pages like:

- https://insure360-83a36.web.app/register  
- https://insure360-83a36-admin.firebaseapp.com/login  

load the UI from **Firebase Hosting**, and login/register API calls go to **`/api/...` on the same host**, which Firebase **rewrites** to the right **Cloud Run** service.

**Yes — live now.** `/api/*` on your Hosting URLs is rewritten to Cloud Run in **`insure360-83a36`** (same project as Firebase).

---

## GCP stack (single project)

| Resource | Details |
|----------|---------|
| **Project** | `insure360-83a36` |
| **Cloud Run** | 11 `gcul-*` microservices |
| **Cloud SQL** | `gcul-pg` + 8 service databases |
| **Pub/Sub** | `gcul.*` topics |
| **Firestore** | `gcul_cache/*` admin/marketplace cache |

Console: https://console.cloud.google.com/home/dashboard?project=insure360-83a36

`community-hub-6fb1b` is **legacy** — no longer used by Hosting.

---

## Redeploy after UI changes

```cmd
cd apps\web
npm run build

cd ..\admin
npm run build

cd ..\..
deploy\deploy-firebase-hosting.cmd -SkipBuild
```

Full stack (Hosting + API rewrites + Firestore rules) after Cloud Run is in `insure360-83a36`:

```cmd
set GCP_PROJECT=insure360-83a36
deploy\deploy-firebase.cmd
```

See [`deploy/GCP-PROJECTS.md`](GCP-PROJECTS.md) and [`deploy/migrate-to-insure360.cmd`](../deploy/migrate-to-insure360.cmd).

---

## Security notes

- Change the default admin password (`Reboot2026!Admin`) in production via `GCUL_ADMIN_PASSWORD` on `gcul-kyc`.
- Do not commit real passwords to git.
- Customer passwords are chosen at registration and stored hashed in the KYC service database.

---

## Related docs

- [`deploy/README.md`](README.md) — cloud deployment
- [`deploy/firebase-project.json`](firebase-project.json) — hosting site IDs and URLs
- [`apps/services/LOCAL-DEV.md`](../apps/services/LOCAL-DEV.md) — local development
