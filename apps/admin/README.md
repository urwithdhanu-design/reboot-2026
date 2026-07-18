# GCUL / Reboot 2026 — Admin console

Extracted from `blockchain-insurance/admin` and adapted for GCUL.

## Run

```bash
cd apps/admin
npm install
npm run dev
```

Open http://localhost:5174

Requires **policy-service** on `:8082` for Vendors / Vendor portal APIs.

## Logins

| Portal | URL | Credentials |
|--------|-----|-------------|
| Platform admin | `/login` | any email / any password (local demo auth) |
| Vendor portal | `/vendor/login` | `vendor.vitality@example.com` / `VendorDemo123!` |

## What’s live vs mock

| Area | Status |
|------|--------|
| Vendors onboard / publish / invite email | **Wired** to policy-service |
| Vendor portal (customers, claims, products) | **Wired** (demo customer/claim rows + real linked products) |
| Dashboard, KYC, policies, blockchain pages | Still mock UI — wire services one by one next |

## Next wiring order

1. Customers + KYC → `kyc-service`
2. Products → `policy-service` `/api/products`
3. Policies / quotes → `policy-service`
4. Payments → Stripe session APIs
5. Claims → new claims API (when added)
