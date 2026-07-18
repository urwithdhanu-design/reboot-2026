import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Server } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge, Button, Card, PageHeader } from '../components/ui';

export type PlatformService = {
  id: string;
  name: string;
  port: number;
  api: string;
  description: string;
};

export const PLATFORM_SERVICES: PlatformService[] = [
  { id: 'kyc-service', name: 'KYC Service', port: 8081, api: '/api/auth, /api/kyc, /api/wallet', description: 'Register, login, KYC, digital wallet' },
  { id: 'policy-service', name: 'Policy Service', port: 8082, api: '/api/products, /api/quotes, /api/payments', description: 'Products, quotes, Stripe checkout, vendors' },
  { id: 'payment-service', name: 'Payment Service', port: 8083, api: '/api/payment-ledger', description: 'Payment ledger and settlement records' },
  { id: 'notification-service', name: 'Notification Service', port: 8084, api: '/api/notifications', description: 'Email and in-app notifications' },
  { id: 'claims-service', name: 'Claims Service', port: 8085, api: '/api/claims', description: 'Claim intake and status workflow' },
  { id: 'parametric-claim-service', name: 'Parametric Claim Service', port: 8086, api: '/api/parametric', description: 'Parametric rules and auto claim triggers' },
  { id: 'premium-deposit-service', name: 'Premium Deposit Service', port: 8087, api: '/api/premium-deposits', description: 'Premium deposits, holds, and release' },
  { id: 'blockchain-orchestrator-service', name: 'Blockchain Orchestrator', port: 8088, api: '/api/blockchain', description: 'GCUL ledger orchestration for payouts and settlements' },
  { id: 'chatbot-assistance-service', name: 'Chatbot Assistance', port: 8090, api: '/api/chatbot', description: 'RAG insurance chatbot (FAISS / Pinecone)' },
  { id: 'gcul-sidecar', name: 'GCUL Sidecar', port: 8091, api: '/api/gcul', description: 'Python bridge to packages/gcul-sdk' },
];

type HealthState = 'checking' | 'up' | 'down';

export function PlatformServicesPage() {
  const [health, setHealth] = useState<Record<string, HealthState>>({});

  const refresh = useCallback(async () => {
    const next: Record<string, HealthState> = {};
    for (const svc of PLATFORM_SERVICES) {
      next[svc.id] = 'checking';
    }
    setHealth(next);

    await Promise.all(
      PLATFORM_SERVICES.map(async (svc) => {
        try {
          const res = await fetch(`http://127.0.0.1:${svc.port}/health`, {
            signal: AbortSignal.timeout(2500),
          });
          const data = (await res.json().catch(() => ({}))) as { status?: string };
          setHealth((prev) => ({
            ...prev,
            [svc.id]: res.ok && data.status === 'ok' ? 'up' : 'down',
          }));
        } catch {
          setHealth((prev) => ({ ...prev, [svc.id]: 'down' }));
        }
      }),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upCount = Object.values(health).filter((s) => s === 'up').length;

  return (
    <AdminLayout>
      <PageHeader
        title="Platform services"
        subtitle="Premium deposit, blockchain orchestrator, parametric claims, claims, payment, and notification microservices"
        actions={
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="w-4 h-4" />
            Refresh health
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-lbg-green" />
            <div>
              <p className="text-xs text-lbg-gray-500 font-semibold uppercase tracking-wide">Services</p>
              <p className="text-2xl font-bold text-lbg-black">{PLATFORM_SERVICES.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-lbg-green" />
            <div>
              <p className="text-xs text-lbg-gray-500 font-semibold uppercase tracking-wide">Healthy</p>
              <p className="text-2xl font-bold text-lbg-black">
                {upCount}/{PLATFORM_SERVICES.length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-lbg-gray-600">
            Start each service with <code className="text-xs bg-lbg-gray-100 px-1.5 py-0.5 rounded">mvnw spring-boot:run</code> from its folder under <code className="text-xs bg-lbg-gray-100 px-1.5 py-0.5 rounded">apps/services</code>.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PLATFORM_SERVICES.map((svc) => {
          const state = health[svc.id] ?? 'checking';
          return (
            <Card key={svc.id}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-lbg-black">{svc.name}</h3>
                  <p className="text-xs text-lbg-gray-500 mt-0.5">{svc.id}</p>
                </div>
                <Badge
                  variant={
                    state === 'up' ? 'success' : state === 'down' ? 'error' : 'neutral'
                  }
                >
                  {state === 'up' ? 'Online' : state === 'down' ? 'Offline' : 'Checking…'}
                </Badge>
              </div>
              <p className="text-sm text-lbg-gray-600 mb-3">{svc.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-lbg-gray-500">Port</dt>
                  <dd className="font-semibold">{svc.port}</dd>
                </div>
                <div>
                  <dt className="text-xs text-lbg-gray-500">Health</dt>
                  <dd className="font-mono text-xs">:{svc.port}/health</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-lbg-gray-500">API</dt>
                  <dd className="font-mono text-xs break-all">{svc.api}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
