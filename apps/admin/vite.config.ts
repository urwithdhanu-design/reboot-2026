import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(rootDir, '../..')

type CloudTargets = {
  services: Record<string, string>
}

function loadCloudTargets(): CloudTargets {
  return JSON.parse(
    readFileSync(join(repoRoot, 'deploy/cloud-api.targets.json'), 'utf-8'),
  ) as CloudTargets
}

function proxyEntry(target: string): ProxyOptions {
  return { target, changeOrigin: true, secure: true }
}

function buildApiProxy(s: Record<string, string>, admin = false): Record<string, ProxyOptions> {
  const L = {
    kyc: 'http://127.0.0.1:8081',
    policy: 'http://127.0.0.1:8082',
    payment: 'http://127.0.0.1:8083',
    notification: 'http://127.0.0.1:8084',
    claims: 'http://127.0.0.1:8085',
    parametric: 'http://127.0.0.1:8086',
    premiumDeposit: 'http://127.0.0.1:8087',
    blockchain: 'http://127.0.0.1:8088',
    chatbot: 'http://127.0.0.1:8090',
  }
  const map: Record<string, ProxyOptions> = {
    '/api/auth': proxyEntry(s.kyc || L.kyc),
    '/api/kyc': proxyEntry(s.kyc || L.kyc),
    '/api/wallet': proxyEntry(s.kyc || L.kyc),
    '/api/assistant': proxyEntry(s.kyc || L.kyc),
    '/api/products': proxyEntry(s.policy || L.policy),
    '/api/policies': proxyEntry(s.policy || L.policy),
    '/api/quotes': proxyEntry(s.policy || L.policy),
    '/api/payments': proxyEntry(s.policy || L.policy),
    '/api/payment-ledger': proxyEntry(s.payment || L.payment),
    '/api/notifications': proxyEntry(s.notification || L.notification),
    '/api/claims': proxyEntry(s.claims || L.claims),
    '/api/parametric': proxyEntry(s.parametric || L.parametric),
    '/api/premium-deposits': proxyEntry(s.premiumDeposit || L.premiumDeposit),
    '/api/blockchain': proxyEntry(s.blockchain || L.blockchain),
    '/api/chatbot': proxyEntry(s.chatbot || L.chatbot),
  }
  if (admin) {
    map['/api/vendors'] = proxyEntry(s.policy || L.policy)
    map['/api/vendor-portal'] = proxyEntry(s.policy || L.policy)
  }
  return map
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const useCloud = env.VITE_API_PROXY === 'cloud'
  const proxy = useCloud
    ? buildApiProxy(loadCloudTargets().services, true)
    : buildApiProxy({}, true)

  console.log(
    useCloud
      ? '[vite] API proxy: Cloud Run (deploy/cloud-api.targets.json)'
      : '[vite] API proxy: local (set VITE_API_PROXY=cloud for Cloud Run)',
  )

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5174, proxy },
  }
})
