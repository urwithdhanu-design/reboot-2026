import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // KYC microservice (register, login, KYC, wallet, assistant)
      "/api/auth": "http://127.0.0.1:8081",
      "/api/kyc": "http://127.0.0.1:8081",
      "/api/wallet": "http://127.0.0.1:8081",
      "/api/assistant": "http://127.0.0.1:8081",
      // Policy microservice (insurance plans by category)
      "/api/products": "http://127.0.0.1:8082",
      "/api/policies": "http://127.0.0.1:8082",
      "/api/quotes": "http://127.0.0.1:8082",
      "/api/payments": "http://127.0.0.1:8082",
      // Platform microservices
      "/api/payment-ledger": "http://127.0.0.1:8083",
      "/api/notifications": "http://127.0.0.1:8084",
      "/api/claims": "http://127.0.0.1:8085",
      "/api/parametric": "http://127.0.0.1:8086",
      "/api/premium-deposits": "http://127.0.0.1:8087",
      "/api/blockchain": "http://127.0.0.1:8088",
      "/api/chatbot": "http://127.0.0.1:8090",
    },
  },
});
