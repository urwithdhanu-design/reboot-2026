import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api/auth': 'http://127.0.0.1:8081',
      '/api/kyc': 'http://127.0.0.1:8081',
      '/api/wallet': 'http://127.0.0.1:8081',
      '/api/assistant': 'http://127.0.0.1:8081',
      '/api/products': 'http://127.0.0.1:8082',
      '/api/policies': 'http://127.0.0.1:8082',
      '/api/quotes': 'http://127.0.0.1:8082',
      '/api/payments': 'http://127.0.0.1:8082',
      '/api/vendors': 'http://127.0.0.1:8082',
      '/api/vendor-portal': 'http://127.0.0.1:8082',
      '/api/payment-ledger': 'http://127.0.0.1:8083',
      '/api/notifications': 'http://127.0.0.1:8084',
      '/api/claims': 'http://127.0.0.1:8085',
      '/api/parametric': 'http://127.0.0.1:8086',
      '/api/premium-deposits': 'http://127.0.0.1:8087',
      '/api/blockchain': 'http://127.0.0.1:8088',
      '/api/chatbot': 'http://127.0.0.1:8090',
    },
  },
})
