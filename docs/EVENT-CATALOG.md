# GCUL event catalog (Pub/Sub)

Domain events for the insurance platform. **Topic names on GCP:** `{topicPrefix}.{suffix}` → e.g. `gcul.customer-events` (see [`deploy/pubsub.json`](../deploy/pubsub.json)).

**Status:** Java publishers/subscribers in `apps/libs/gcul-messaging` and per-service `messaging` packages. Enable with `GCUL_PUBSUB_ENABLED=true`, `GCUL_PUBSUB_PROJECT`, and `deploy/setup-pubsub.ps1`. Local: run `scripts/install-gcul-messaging.cmd` before Maven builds.

---

## Service name mapping (requirements → this repo)

| Requirement name | Cloud Run / service folder |
|------------------|----------------------------|
| Customer Service | `gcul-kyc` (`kyc-service`) |
| Identity Service | `gcul-kyc` (auth + KYC) |
| Wallet Service | `gcul-wallet` (`wallet-service`) |
| Payment Service | `gcul-payment` (+ Stripe checkout on `gcul-policy`) |
| Policy Service | `gcul-policy` |
| Blockchain Service | `gcul-blockchain-orchestrator` |
| Claim Service | `gcul-claims` |
| Fraud Detection Service | `gcul-parametric` (parametric rules; extend later) |
| Notification Service | `gcul-notification` |
| Audit Service | **`gcul-audit`** (planned; subscriptions reserved in Pub/Sub) |

---

## Pub/Sub topics

| Topic (suffix) | Published by | Consumers |
|----------------|--------------|-----------|
| `customer-events` | Customer Service (`gcul-kyc`) | Wallet, Notification, Audit |
| `wallet-events` | Wallet Service (`gcul-wallet`) | Policy, Notification, Audit |
| `payment-events` | Payment Service (`gcul-payment`, `gcul-policy` for Stripe) | Policy, Audit |
| `policy-events` | Policy Service (`gcul-policy`) | Blockchain, Notification, Audit |
| `blockchain-events` | Blockchain Service (`gcul-blockchain-orchestrator`) | Policy, Notification, Audit |
| `claim-events` | Claim Service (`gcul-claims`) | Fraud Detection (`gcul-parametric`), Payment, Notification |
| `notification-events` | Notification Service | Audit |
| `audit-events` | All services (optional fan-in) | Audit Service |

---

## Envelope (all messages)

Every message body should be JSON with at least:

```json
{
  "eventId": "evt-unique-id",
  "eventType": "CustomerRegistered",
  "timestamp": "2026-07-18T10:00:00Z",
  "correlationId": "optional-trace-id"
}
```

Type-specific fields are documented below. Samples: [`deploy/events/samples/`](../deploy/events/samples/).

---

## Event definitions

### 1. CustomerRegistered

**Topic:** `customer-events`

```json
{
  "eventId": "evt-1001",
  "eventType": "CustomerRegistered",
  "timestamp": "2026-07-18T10:00:00Z",
  "customerId": "C10001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@email.com",
  "mobile": "9876543210",
  "status": "REGISTERED"
}
```

**Consumers:** Identity (`gcul-kyc`), Notification, Audit

---

### 2. CustomerVerified

**Topic:** `customer-events`

```json
{
  "eventId": "evt-1002",
  "eventType": "CustomerVerified",
  "timestamp": "2026-07-18T11:00:00Z",
  "customerId": "C10001",
  "kycStatus": "VERIFIED"
}
```

**Consumers:** Wallet, Audit

---

### 3. WalletLinked

**Topic:** `wallet-events`

```json
{
  "eventId": "evt-2001",
  "eventType": "WalletLinked",
  "timestamp": "2026-07-18T12:00:00Z",
  "customerId": "C10001",
  "walletAddress": "0xABCD12345",
  "network": "Ethereum Sepolia",
  "status": "SUCCESS"
}
```

**Consumers:** Policy, Notification, Audit (optional)

---

### 4. PremiumPaid

**Topic:** `payment-events`

```json
{
  "eventId": "evt-3001",
  "eventType": "PremiumPaid",
  "timestamp": "2026-07-18T13:00:00Z",
  "paymentId": "PAY1001",
  "policyNumber": "INS10001",
  "customerId": "C10001",
  "amount": 2500,
  "currency": "INR",
  "status": "SUCCESS"
}
```

**Consumers:** Policy, Audit (optional)

---

### 5. PolicyCreated

**Topic:** `policy-events`  
After policy creation, downstream mint is triggered (insurer-only — see [`BLOCKCHAIN-INSURER-MINT.md`](BLOCKCHAIN-INSURER-MINT.md)).

```json
{
  "eventId": "evt-4001",
  "eventType": "PolicyCreated",
  "timestamp": "2026-07-18T14:00:00Z",
  "policyNumber": "INS10001",
  "customerId": "C10001",
  "walletAddress": "0xABCD12345",
  "policyType": "Health",
  "coverageAmount": 500000,
  "premium": 2500
}
```

**Consumers:** Blockchain, Notification, Audit

---

### 6. PolicyMintRequested

**Topic:** `policy-events`

```json
{
  "eventId": "evt-4002",
  "eventType": "PolicyMintRequested",
  "timestamp": "2026-07-18T14:01:00Z",
  "policyNumber": "INS10001",
  "walletAddress": "0xABCD12345"
}
```

**Consumer:** Blockchain Service (insurer mint)

---

### 7. PolicyMinted

**Topic:** `blockchain-events`

```json
{
  "eventId": "evt-5001",
  "eventType": "PolicyMinted",
  "timestamp": "2026-07-18T14:05:00Z",
  "policyNumber": "INS10001",
  "tokenId": "101",
  "walletAddress": "0xABCD12345",
  "contractAddress": "0x987654",
  "transactionHash": "0xABC123",
  "blockNumber": 8452345
}
```

**Consumers:** Policy, Notification, Audit

---

### 8. PolicyActivated

**Topic:** `policy-events`

```json
{
  "eventId": "evt-4003",
  "eventType": "PolicyActivated",
  "timestamp": "2026-07-18T14:06:00Z",
  "policyNumber": "INS10001",
  "tokenId": "101",
  "status": "ACTIVE"
}
```

**Consumers:** Notification, Audit

---

### 9. ClaimRequested

**Topic:** `claim-events`

```json
{
  "eventId": "evt-6001",
  "eventType": "ClaimRequested",
  "timestamp": "2026-07-19T09:00:00Z",
  "claimNumber": "CLM1001",
  "policyNumber": "INS10001",
  "claimAmount": 100000
}
```

**Consumers:** Fraud Detection (`gcul-parametric`), Audit

---

### 10. ClaimValidated

**Topic:** `claim-events`

```json
{
  "eventId": "evt-6002",
  "eventType": "ClaimValidated",
  "timestamp": "2026-07-19T10:00:00Z",
  "claimNumber": "CLM1001",
  "fraudScore": 8,
  "status": "PASSED"
}
```

**Consumers:** Claim approval workflow (`gcul-claims`)

---

### 11. ClaimApproved

**Topic:** `claim-events`

```json
{
  "eventId": "evt-6003",
  "eventType": "ClaimApproved",
  "timestamp": "2026-07-19T11:00:00Z",
  "claimNumber": "CLM1001",
  "approvedAmount": 95000
}
```

**Consumers:** Payment, Notification

---

### 12. ClaimPaid

**Topic:** `payment-events`

```json
{
  "eventId": "evt-3002",
  "eventType": "ClaimPaid",
  "timestamp": "2026-07-19T12:00:00Z",
  "claimNumber": "CLM1001",
  "transactionId": "TXN987654",
  "amount": 95000
}
```

**Consumers:** Notification, Audit

---

## End-to-end flow (payment → mint → active)

```text
PremiumPaid (payment-events)
    → Policy Service creates policy
PolicyCreated + PolicyMintRequested (policy-events)
    → Blockchain Service (insurer only)
PolicyMinted (blockchain-events)
    → Policy Service stores tokenId / txHash
PolicyActivated (policy-events)
    → Notification
```

---

## Provision topics in GCP

```cmd
set GCP_PROJECT=community-hub-6fb1b
powershell -File deploy\setup-pubsub.ps1
powershell -File deploy\setup-pubsub.ps1 -CreateSubscriptions
set GCUL_USE_PUBSUB=true
deploy\deploy-cloud-run.cmd
```

See [`deploy/README.md`](../deploy/README.md).
