import { readFileSync } from "node:fs";
import { join } from "node:path";

const LOCAL = {
  kyc: "http://127.0.0.1:8081",
  wallet: "http://127.0.0.1:8089",
  policy: "http://127.0.0.1:8082",
  payment: "http://127.0.0.1:8083",
  notification: "http://127.0.0.1:8084",
  claims: "http://127.0.0.1:8085",
  parametric: "http://127.0.0.1:8086",
  premiumDeposit: "http://127.0.0.1:8087",
  blockchain: "http://127.0.0.1:8088",
  chatbot: "http://127.0.0.1:8090",
};

/** @param {string} target */
export function proxyEntry(target) {
  return { target, changeOrigin: true, secure: true };
}

/** @param {string} repoRoot */
export function loadCloudApiTargets(repoRoot) {
  const path = join(repoRoot, "deploy/cloud-api.targets.json");
  const raw = readFileSync(path, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

/**
 * @param {Record<string, string>} targets
 * @param {{ admin?: boolean }} [options]
 */
export function buildApiProxyMap(targets, options = {}) {
  const s = targets;
  const kyc = s.kyc || LOCAL.kyc;
  const policy = s.policy || LOCAL.policy;
  // Wallet before other /api/* prefixes (Vite matches first registered rule).
  const map = {
    "/api/wallet": proxyEntry(s.wallet || LOCAL.wallet),
    "/api/auth": proxyEntry(kyc),
    "/api/kyc": proxyEntry(kyc),
    "/api/assistant": proxyEntry(kyc),
    "/api/products": proxyEntry(policy),
    "/api/policies": proxyEntry(policy),
    "/api/quotes": proxyEntry(policy),
    "/api/payments": proxyEntry(policy),
    "/api/payment-ledger": proxyEntry(s.payment || LOCAL.payment),
    "/api/notifications": proxyEntry(s.notification || LOCAL.notification),
    "/api/claims": proxyEntry(s.claims || LOCAL.claims),
    "/api/parametric": proxyEntry(s.parametric || LOCAL.parametric),
    "/api/premium-deposits": proxyEntry(s.premiumDeposit || LOCAL.premiumDeposit),
    "/api/blockchain": proxyEntry(s.blockchain || LOCAL.blockchain),
    "/api/chatbot": proxyEntry(s.chatbot || LOCAL.chatbot),
  };
  if (options.admin) {
    map["/api/admin/customers"] = proxyEntry(kyc);
    map["/api/admin/kyc-queue"] = proxyEntry(kyc);
    map["/api/admin/customer-stats"] = proxyEntry(kyc);
    map["/api/admin/policies"] = proxyEntry(policy);
    map["/api/admin/policy-stats"] = proxyEntry(policy);
    map["/api/vendors"] = proxyEntry(policy);
    map["/api/vendor-portal"] = proxyEntry(policy);
  }
  return map;
}

/** @param {{ admin?: boolean }} [options] */
export function buildLocalApiProxyMap(options = {}) {
  return buildApiProxyMap(LOCAL, options);
}
