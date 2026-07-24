import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(rootDir, '../..')

type CloudTargets = {
  project?: string
  services: Record<string, string>
}

function loadCloudTargets(): CloudTargets {
  const raw = readFileSync(join(repoRoot, 'deploy/cloud-api.targets.json'), 'utf-8').replace(
    /^\uFEFF/,
    '',
  )
  return JSON.parse(raw) as CloudTargets
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
  const policyTarget = s.policy || L.policy
  const map: Record<string, ProxyOptions> = {
    '/api/wallet': proxyEntry(walletTarget),
    '/api/auth': proxyEntry(kycTarget),
    '/api/kyc': proxyEntry(kycTarget),
    '/api/assistant': proxyEntry(kycTarget),
    '/api/admin/customers': proxyEntry(kycTarget),
    '/api/admin/kyc-queue': proxyEntry(kycTarget),
    '/api/admin/kyc-settings': proxyEntry(kycTarget),
    '/api/admin/refresh-cache': proxyEntry(kycTarget),
    '/api/admin/customer-stats': proxyEntry(kycTarget),
    '/api/admin/policies': proxyEntry(policyTarget),
    '/api/admin/products': proxyEntry(policyTarget),
    '/api/admin/policy-stats': proxyEntry(policyTarget),
    '/api/products': proxyEntry(policyTarget),
    '/api/policies': proxyEntry(policyTarget),
    '/api/quotes': proxyEntry(policyTarget),
    '/api/payments': proxyEntry(policyTarget),
    '/api/payment-ledger': proxyEntry(s.payment || L.payment),
    '/api/notifications': proxyEntry(s.notification || L.notification),
    '/api/claims': proxyEntry(s.claims || L.claims),
    '/api/parametric': proxyEntry(s.parametric || L.parametric),
    '/api/premium-deposits': proxyEntry(s.premiumDeposit || L.premiumDeposit),
    '/api/blockchain': proxyEntry(s.blockchain || L.blockchain),
    '/api/chatbot': proxyEntry(s.chatbot || L.chatbot),
  }
  if (admin) {
    map['/api/vendors'] = proxyEntry(policyTarget)
    map['/api/vendor-portal'] = proxyEntry(policyTarget)
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
  const cloud = loadCloudTargets()
  const proxy = useCloud
    ? buildApiProxy(cloud.services, true)
    : buildApiProxy({}, true)

  console.log(
    useCloud
      ? `[vite] API target: cloud (${cloud.project ?? 'community-hub-6fb1b'} → deploy/cloud-api.targets.json)`
      : '[vite] API target: local (127.0.0.1:8081-8090) — scripts\\start-local-apis.cmd',
  )

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5175, proxy },
    optimizeDeps: {
      include: ['firebase/app', 'firebase/firestore'],
    },
  }
})
