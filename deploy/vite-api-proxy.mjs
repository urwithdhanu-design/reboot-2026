import { readFileSync } from "node:fs";
import { join } from "node:path";

const LOCAL = {
  kyc: "http://127.0.0.1:8081",
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
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * @param {Record<string, string>} targets
 * @param {{ admin?: boolean }} [options]
 */
export function buildApiProxyMap(targets, options = {}) {
  const s = targets;
  const map = {
    "/api/auth": proxyEntry(s.kyc || LOCAL.kyc),
    "/api/kyc": proxyEntry(s.kyc || LOCAL.kyc),
    "/api/wallet": proxyEntry(s.kyc || LOCAL.kyc),
    "/api/assistant": proxyEntry(s.kyc || LOCAL.kyc),
    "/api/products": proxyEntry(s.policy || LOCAL.policy),
    "/api/policies": proxyEntry(s.policy || LOCAL.policy),
    "/api/quotes": proxyEntry(s.policy || LOCAL.policy),
    "/api/payments": proxyEntry(s.policy || LOCAL.policy),
    "/api/payment-ledger": proxyEntry(s.payment || LOCAL.payment),
    "/api/notifications": proxyEntry(s.notification || LOCAL.notification),
    "/api/claims": proxyEntry(s.claims || LOCAL.claims),
    "/api/parametric": proxyEntry(s.parametric || LOCAL.parametric),
    "/api/premium-deposits": proxyEntry(s.premiumDeposit || LOCAL.premiumDeposit),
    "/api/blockchain": proxyEntry(s.blockchain || LOCAL.blockchain),
    "/api/chatbot": proxyEntry(s.chatbot || LOCAL.chatbot),
  };
  if (options.admin) {
    map["/api/vendors"] = proxyEntry(s.policy || LOCAL.policy);
    map["/api/vendor-portal"] = proxyEntry(s.policy || LOCAL.policy);
  }
  return map;
}

/** @param {{ admin?: boolean }} [options] */
export function buildLocalApiProxyMap(options = {}) {
  return buildApiProxyMap(LOCAL, options);
}
