import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync } from 'node:fs'
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
    wallet: 'http://127.0.0.1:8089',
    policy: 'http://127.0.0.1:8082',
    payment: 'http://127.0.0.1:8083',
    notification: 'http://127.0.0.1:8084',
    claims: 'http://127.0.0.1:8085',
    parametric: 'http://127.0.0.1:8086',
    premiumDeposit: 'http://127.0.0.1:8087',
    blockchain: 'http://127.0.0.1:8088',
    chatbot: 'http://127.0.0.1:8090',
  }
  const walletTarget = s.wallet || L.wallet
  const kycTarget = s.kyc || L.kyc
  const map: Record<string, ProxyOptions> = {
    '/api/wallet': proxyEntry(walletTarget),
    '/api/auth': proxyEntry(kycTarget),
    '/api/kyc': proxyEntry(kycTarget),
    '/api/assistant': proxyEntry(kycTarget),
    '/api/admin/customers': proxyEntry(s.kyc || L.kyc),
    '/api/admin/kyc-queue': proxyEntry(s.kyc || L.kyc),
    '/api/admin/customer-stats': proxyEntry(s.kyc || L.kyc),
    '/api/admin/policies': proxyEntry(s.policy || L.policy),
    '/api/admin/policy-stats': proxyEntry(s.policy || L.policy),
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

function resolveApiTarget(
  mode: string,
  appDir: string,
  repoRoot: string,
): 'local' | 'cloud' {
  const appEnv = loadEnv(mode, appDir, '')
  const sharedFile = join(repoRoot, '.local-dev', 'api-target.env')
  let sharedTarget: string | undefined
  if (existsSync(sharedFile)) {
    const text = readFileSync(sharedFile, 'utf-8')
    const m = text.match(/^\s*VITE_API_TARGET\s*=\s*(\w+)/m)
    if (m) sharedTarget = m[1]
  }
  const raw =
    appEnv.VITE_API_TARGET ||
    sharedTarget ||
    (appEnv.VITE_API_PROXY === 'local' ? 'local' : 'cloud')
  return raw === 'local' ? 'local' : 'cloud'
}

export default defineConfig(({ mode }) => {
  const apiTarget = resolveApiTarget(mode, rootDir, repoRoot)
  const useCloud = apiTarget === 'cloud'
  const proxy = useCloud
    ? buildApiProxy(loadCloudTargets().services, true)
    : buildApiProxy({}, true)

  console.log(
    useCloud
      ? '[vite] API target: cloud (deploy/cloud-api.targets.json)'
      : '[vite] API target: local (127.0.0.1:8081-8089) — scripts\\start-local-apis.cmd',
  )

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5175, proxy },
  }
})
