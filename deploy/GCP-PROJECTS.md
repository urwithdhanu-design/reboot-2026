# Which GCP project?

**Primary project (Firebase + Cloud Run + Cloud SQL + Pub/Sub):** **`insure360-83a36`**

| Console | URL |
|---------|-----|
| Firebase | https://console.firebase.google.com/project/insure360-83a36 |
| Google Cloud | https://console.cloud.google.com/welcome?project=insure360-83a36 |
| Cloud Run | https://console.cloud.google.com/run?project=insure360-83a36 |
| Cloud SQL | https://console.cloud.google.com/sql/instances?project=insure360-83a36 |

## Live URLs

| App | URL |
|-----|-----|
| Customer (Hosting) | https://insure360-83a36.web.app |
| Admin (Hosting) | https://insure360-83a36-admin.firebaseapp.com |

See [`docs/HOSTING-ACCESS.md`](../docs/HOSTING-ACCESS.md) for login credentials.

---

## Other project ids in history

| Project ID | Role |
|------------|------|
| **`insure360-83a36`** | **Current** — Firebase Hosting, Firestore, Cloud Run `gcul-*`, Cloud SQL `gcul-pg`, Pub/Sub, Artifact Registry |
| `community-hub-6fb1b` | **Legacy** — previous Cloud Run + SQL deploy target (superseded) |
| `community-hub-482291` | Console name “Community Hub” — not used by this repo |

---

## One project end-to-end

Always set:

```cmd
set GCP_PROJECT=insure360-83a36
set GCUL_FIREBASE_PROJECT=insure360-83a36
```

Full migrate / redeploy:

```cmd
deploy\migrate-to-insure360.cmd
```

Or step by step:

```cmd
deploy\setup-gcp-project.cmd
deploy\setup-cloud-sql.cmd
deploy\setup-pubsub.cmd
deploy\setup-firestore.cmd
set GCUL_USE_CLOUD_SQL=true
set GCUL_USE_PUBSUB=true
deploy\deploy-cloud-run.cmd
deploy\deploy-firebase.cmd
```
