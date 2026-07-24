# Which GCP project?

You may see **two** similarly named projects in Google Cloud Console:

| Console name | Project ID | Project number | GCUL usage |
|--------------|------------|----------------|------------|
| **Community Hub** | **`community-hub-482291`** | 607353221835 | **No** GCUL Cloud Run / Cloud SQL in this repo’s deploy history |
| **community-hub** (lowercase id) | **`community-hub-6fb1b`** | 573487116918 | **Yes** — all `gcul-*` Cloud Run services, `gcul-pg` Cloud SQL, Artifact Registry `gcul` |

Other ids in the repo:

| Project ID | Role |
|------------|------|
| `insure360-83a36` | **Firebase** — Hosting, Firestore (`gcul_cache/*`), client `firebaseCredentials.js` |
| `community-hub-6fb1b` | **Cloud Run + Cloud SQL** — all `gcul-*` backends (Firestore writes target `insure360-83a36` via `GCUL_FIRESTORE_PROJECT`) |

## Console links (Cloud Run)

- **GCUL backends (live deploy target):**  
  https://console.cloud.google.com/run?project=community-hub-6fb1b  
- **Community Hub (482291) — empty unless you deploy there:**  
  https://console.cloud.google.com/run?project=community-hub-482291  

## Use one project end-to-end

Firebase Hosting `/api` rewrites must target Cloud Run in the **same** project as Hosting.

To deploy everything into **Community Hub (`community-hub-482291`)**:

```cmd
set GCP_PROJECT=community-hub-482291
powershell -File deploy\setup-gcp-project.ps1
powershell -File deploy\setup-cloud-sql.ps1
deploy\deploy-cloud-run.cmd
deploy\deploy-firebase.cmd
```

Then update `deploy/cloud-api.targets.json` and Firebase project to match.

To keep the current stack, always set:

```cmd
set GCP_PROJECT=community-hub-6fb1b
```

when running deploy scripts, even if the console default is **Community Hub (482291)**.
