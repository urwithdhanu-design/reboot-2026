import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  Layers,
  Link2,
  RefreshCw,
  Server,
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  ContentPanel,
  FilterTabs,
  PageHeader,
  PaginatedTable,
  StatCard,
} from '../components/ui';
import {
  adminApi,
  type CantonPolicyRecord,
  type CantonStatus,
  type ChainObservabilityResponse,
  type TokenizationView,
} from '../api';
import { formatNumber } from '../data/adminMockData';

const REFRESH_MS = 15_000;

type Tab = 'contracts' | 'registry' | 'canton' | 'activity';

const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success',
  deployed: 'success',
  verified: 'success',
  minted: 'success',
  connected: 'success',
  paused: 'warning',
  pending: 'warning',
  in_progress: 'warning',
  offline: 'error',
  failed: 'error',
};

function formatWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function shortId(value?: string | null, len = 10) {
  if (!value) return '—';
  if (value.length <= len + 3) return value;
  return `${value.slice(0, len)}…`;
}

function liveBadge(live?: boolean) {
  return live ? 'success' : 'warning';
}

export function SmartContractsPage() {
  const [tab, setTab] = useState<Tab>('contracts');
  const [observability, setObservability] = useState<ChainObservabilityResponse | null>(null);
  const [tokenization, setTokenization] = useState<TokenizationView | null>(null);
  const [cantonStatus, setCantonStatus] = useState<CantonStatus | null>(null);
  const [cantonPolicies, setCantonPolicies] = useState<CantonPolicyRecord[]>([]);
  const [sidecarHealth, setSidecarHealth] = useState<Record<string, unknown> | null>(null);
  const [ledgerTxs, setLedgerTxs] = useState<Awaited<ReturnType<typeof adminApi.listBlockchainTransactions>>['transactions']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    void Promise.allSettled([
      adminApi.chainObservability(),
      adminApi.tokenizationView(),
      adminApi.cantonStatus(),
      adminApi.cantonPolicies(),
      adminApi.gculSidecarHealth(),
      adminApi.listBlockchainTransactions(),
    ])
      .then((results) => {
        const [obs, tok, canton, policies, sidecar, txs] = results;
        if (obs.status === 'fulfilled') setObservability(obs.value);
        if (tok.status === 'fulfilled') setTokenization(tok.value);
        if (canton.status === 'fulfilled') setCantonStatus(canton.value);
        if (policies.status === 'fulfilled') setCantonPolicies(policies.value.records ?? []);
        if (sidecar.status === 'fulfilled') setSidecarHealth(sidecar.value);
        if (txs.status === 'fulfilled') setLedgerTxs(txs.value.transactions ?? []);

        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length === results.length) {
          const reason = failed[0].status === 'rejected' ? failed[0].reason : null;
          setError(reason instanceof Error ? reason.message : 'Failed to load smart contract data');
        } else if (failed.length > 0) {
          setError('Some contract data sources are unavailable — showing partial results.');
        } else {
          setError(null);
        }
        setLastUpdated(new Date().toISOString());
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => load(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [live, load]);

  const blockchain = tokenization?.blockchain;
  const stats = tokenization?.stats;
  const registry = tokenization?.registry ?? [];
  const standards = tokenization?.standards ?? [];
  const contracts = observability?.smart_contracts ?? [];
  const traces = observability?.transaction_traces ?? [];

  const totalInvocations = useMemo(
    () => contracts.reduce((sum, c) => sum + (c.invocations ?? 0), 0),
    [contracts],
  );

  const isCanton =
    cantonStatus?.ledgerBackend === 'canton' ||
    blockchain?.ledger_type === 'canton' ||
    (blockchain?.mode?.includes('canton') ?? false);

  const networkLabel = blockchain?.network_name ?? cantonStatus?.network ?? observability?.network?.network_name ?? '—';

  const copyText = (value: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const contractRows = useMemo(() => {
    const byName = new Map(contracts.map((c) => [c.name, c]));
    for (const std of standards) {
      const existing = byName.get(std.name);
      byName.set(std.name, {
        name: std.name,
        standard: std.standard,
        status: std.enabled ? 'active' : 'paused',
        description: std.description,
        invocations: existing?.invocations ?? std.circulating ?? 0,
        network: networkLabel,
        contract_address: std.contract_address,
        total_supply: std.total_supply,
        circulating: std.circulating,
      } as (typeof contracts)[number] & {
        contract_address?: string;
        total_supply?: number;
        circulating?: number;
      });
    }
    return Array.from(byName.values());
  }, [contracts, standards, networkLabel]);

  return (
    <AdminLayout>
      <PageHeader
        icon={FileCode2}
        title="Smart contracts"
        subtitle="Live ledger templates, policy NFT contracts, Canton mints, and on-chain activity"
        metrics={[
          { label: 'Policy NFTs', value: stats?.policy_nfts ?? registry.length, tone: 'success' },
          { label: 'Invocations', value: formatNumber(totalInvocations) },
          { label: 'Pending mints', value: stats?.pending_mints ?? 0, tone: 'warning' },
          {
            label: 'Chain',
            value: observability?.dashboard?.chain_valid ? 'Valid' : 'Check',
            tone: observability?.dashboard?.chain_valid ? 'success' : 'warning',
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant={live ? 'hero' : 'outline'} onClick={() => setLive((v) => !v)}>
              <Activity className={`w-4 h-4 ${live ? 'animate-pulse' : ''}`} />
              {live ? `Live · ${REFRESH_MS / 1000}s` : 'Paused'}
            </Button>
            <Button size="sm" variant="hero" onClick={() => load(false)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {lastUpdated ? (
        <p className="text-xs text-lbg-gray-400 mb-4">
          Last updated {formatWhen(lastUpdated)}
          {loading ? ' · refreshing…' : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={isCanton ? 'Canton ledger' : 'Ethereum network'}
          value={networkLabel}
          change={isCanton ? (cantonStatus?.live ? 'Live minting' : 'Offline / simulated') : blockchain?.mode ?? '—'}
          icon={Layers}
          trend={cantonStatus?.live || blockchain?.live ? 'up' : 'neutral'}
        />
        <StatCard
          label="Template / contract"
          value={shortId(cantonStatus?.templateId ?? blockchain?.contract_address ?? standards[0]?.contract_address, 14)}
          change={`Chain ${blockchain?.chain_id ?? cantonStatus?.chainId ?? '—'}`}
          icon={FileCode2}
        />
        <StatCard
          label="GCUL sidecar"
          value={String(sidecarHealth?.status ?? sidecarHealth?.mode ?? 'unknown')}
          change={String(sidecarHealth?.live_ready ?? sidecarHealth?.message ?? 'Bridge status')}
          icon={Link2}
          trend={sidecarHealth?.live_ready ? 'up' : 'neutral'}
        />
        <StatCard
          label="Insurance chain"
          value={String(observability?.dashboard?.block_height ?? '—')}
          change={`${observability?.dashboard?.total_transactions ?? 0} total txs`}
          icon={Server}
          trend="neutral"
        />
      </div>

      <Card className="mb-6">
        <h3 className="font-bold mb-3">Infrastructure status</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Ledger backend</dt>
            <dd className="font-semibold mt-1">{blockchain?.ledger_type ?? cantonStatus?.ledgerBackend ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Canton reachable</dt>
            <dd className="mt-1">
              <Badge variant={liveBadge(cantonStatus?.reachable)}>{cantonStatus?.reachable ? 'Yes' : 'No'}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Canton JSON API</dt>
            <dd className="font-mono text-xs mt-1 break-all">{cantonStatus?.jsonApiUrl ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Insurer party</dt>
            <dd className="font-mono text-xs mt-1">{cantonStatus?.insurerPartyHint ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Mint queue</dt>
            <dd className="font-semibold mt-1">
              {stats?.pending_mints ?? 0} pending · {stats?.failed_mints ?? 0} failed
            </dd>
          </div>
          <div>
            <dt className="text-lbg-gray-400 text-xs uppercase">Orchestrator txs</dt>
            <dd className="font-semibold mt-1">{ledgerTxs.length} recorded</dd>
          </div>
        </dl>
      </Card>

      <FilterTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'contracts', label: `Contracts (${contractRows.length})` },
          { value: 'registry', label: `Minted policies (${registry.length})` },
          { value: 'canton', label: `Canton (${cantonPolicies.length})` },
          { value: 'activity', label: `Activity (${traces.length})` },
        ]}
      />

      {tab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {contractRows.length === 0 ? (
            <Card>
              <p className="text-sm text-lbg-gray-500">No smart contract activity recorded yet.</p>
            </Card>
          ) : (
            contractRows.map((sc) => {
              const address =
                (sc as { contract_address?: string }).contract_address ??
                cantonStatus?.templateId ??
                blockchain?.contract_address;
              return (
                <Card key={sc.name}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-lbg-green-light flex items-center justify-center">
                        <FileCode2 className="w-5 h-5 text-lbg-green" />
                      </div>
                      <div>
                        <p className="font-bold">{sc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="info">{sc.standard}</Badge>
                          <Badge variant={statusBadge[sc.status] ?? 'neutral'}>{sc.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-lbg-gray-600 mb-4">{sc.description}</p>

                  {address ? (
                    <button
                      type="button"
                      onClick={() => copyText(address)}
                      className="flex items-center gap-2 font-mono text-xs text-lbg-green bg-lbg-green-light/50 px-3 py-2 rounded-lg w-full hover:bg-lbg-green-light transition-colors mb-4 text-left"
                    >
                      <span className="truncate">{address}</span>
                      {copied === address ? (
                        <Check className="w-3 h-3 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 shrink-0" />
                      )}
                    </button>
                  ) : null}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-lbg-gray-400">Invocations</p>
                      <p className="font-bold text-sm">{formatNumber(sc.invocations)}</p>
                    </div>
                    <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-lbg-gray-400">Circulating</p>
                      <p className="font-bold text-sm">
                        {formatNumber((sc as { circulating?: number }).circulating ?? sc.invocations)}
                      </p>
                    </div>
                    <div className="bg-lbg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-lbg-gray-400">Network</p>
                      <p className="font-bold text-xs mt-1">{sc.network}</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === 'registry' && (
        <ContentPanel title="Minted policy NFT registry" className="mt-4">
          <PaginatedTable
            columns={[
              { key: 'token_id', label: 'Token', sortable: true },
              { key: 'name', label: 'Policy', sortable: true },
              { key: 'owner', label: 'Owner', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'minted_at', label: 'Minted', sortable: true },
            ]}
            rows={registry}
            rowKey={(row) => row.id}
            defaultSortKey="minted_at"
            defaultSortDir="desc"
            pageSize={8}
            getSortValue={(row, key) => {
              if (key === 'minted_at') return row.minted_at ?? '';
              return (row as unknown as Record<string, string | number | undefined>)[key] ?? '';
            }}
            emptyMessage="No minted policy NFTs yet. Approve mints from Tokenization after customer payment."
            renderRow={(row) => (
              <tr key={row.id} className="hover:bg-lbg-green-light/30">
                <td className="py-3 px-4 font-mono text-xs">{row.token_id ?? '—'}</td>
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-lbg-gray-400">{row.policy_number}</div>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{shortId(row.wallet_address ?? row.owner, 12)}</td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[row.status] ?? 'neutral'}>{row.status}</Badge>
                </td>
                <td className="py-3 px-4 text-xs text-lbg-gray-500 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {formatWhen(row.minted_at)}
                    {row.explorer_url ? (
                      <a
                        href={row.explorer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lbg-green hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          />
        </ContentPanel>
      )}

      {tab === 'canton' && (
        <ContentPanel title="Canton policy contracts" className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={liveBadge(cantonStatus?.live)}>{cantonStatus?.live ? 'Canton live' : 'Canton offline'}</Badge>
            <Badge variant="info">{cantonPolicies.length} on-ledger records</Badge>
          </div>
          <PaginatedTable
            columns={[
              { key: 'policyNumber', label: 'Policy', sortable: true },
              { key: 'contractId', label: 'Contract ID', sortable: true },
              { key: 'updateId', label: 'Update', sortable: true },
              { key: 'walletAddress', label: 'Wallet', sortable: true },
              { key: 'mintStatus', label: 'Status', sortable: true },
              { key: 'mintedAt', label: 'Minted', sortable: true },
            ]}
            rows={cantonPolicies}
            rowKey={(row) => row.policyId}
            defaultSortKey="mintedAt"
            defaultSortDir="desc"
            pageSize={8}
            getSortValue={(row, key) => (row as Record<string, string | undefined>)[key] ?? ''}
            emptyMessage="No Canton policy contracts minted yet."
            renderRow={(row) => (
              <tr key={row.policyId} className="hover:bg-lbg-green-light/30">
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium">{row.policyNumber ?? row.policyId}</div>
                  <div className="text-xs text-lbg-gray-400 font-mono">{shortId(row.policyId, 12)}</div>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{shortId(row.contractId ?? row.tokenId, 14)}</td>
                <td className="py-3 px-4 font-mono text-xs">{shortId(row.updateId, 14)}</td>
                <td className="py-3 px-4 font-mono text-xs">{shortId(row.walletAddress, 12)}</td>
                <td className="py-3 px-4">
                  <Badge variant={statusBadge[row.mintStatus ?? 'pending'] ?? 'neutral'}>
                    {row.mintStatus ?? 'unknown'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-xs text-lbg-gray-500 whitespace-nowrap">{formatWhen(row.mintedAt)}</td>
              </tr>
            )}
          />
        </ContentPanel>
      )}

      {tab === 'activity' && (
        <div className="space-y-4 mt-4">
          <ContentPanel title="Insurance chain transaction traces">
            <PaginatedTable
              columns={[
                { key: 'trace_id', label: 'Trace', sortable: true },
                { key: 'type', label: 'Type', sortable: true },
                { key: 'ledger', label: 'Ledger', sortable: true },
                { key: 'status', label: 'Status', sortable: true },
                { key: 'block_height', label: 'Block', sortable: true },
                { key: 'created_at', label: 'When', sortable: true },
              ]}
              rows={traces}
              rowKey={(t) => t.trace_id}
              defaultSortKey="created_at"
              defaultSortDir="desc"
              pageSize={8}
              getSortValue={(row, key) => {
                if (key === 'block_height') return row.block_height ?? 0;
                return (row as Record<string, string | number | null | undefined>)[key] ?? '';
              }}
              emptyMessage="No on-chain traces yet."
              renderRow={(t) => (
                <tr key={t.trace_id} className="hover:bg-lbg-green-light/30">
                  <td className="py-3 px-4 font-mono text-xs">{shortId(t.trace_id, 8)}</td>
                  <td className="py-3 px-4 text-sm font-medium">{t.type.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{t.ledger}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={t.status === 'confirmed' ? 'success' : 'warning'}>{t.status}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{t.block_height ?? 'pending'}</td>
                  <td className="py-3 px-4 text-xs text-lbg-gray-400 whitespace-nowrap">{formatWhen(t.created_at)}</td>
                </tr>
              )}
            />
          </ContentPanel>

          <ContentPanel title="Orchestrator ledger transfers">
            <PaginatedTable
              columns={[
                { key: 'id', label: 'ID', sortable: true },
                { key: 'type', label: 'Type', sortable: true },
                { key: 'from_wallet', label: 'From', sortable: true },
                { key: 'to_wallet', label: 'To', sortable: true },
                { key: 'amount', label: 'Amount', sortable: true },
                { key: 'status', label: 'Status', sortable: true },
              ]}
              rows={ledgerTxs}
              rowKey={(tx) => tx.id}
              defaultSortKey="created_at"
              defaultSortDir="desc"
              pageSize={8}
              getSortValue={(row, key) => {
                if (key === 'amount') return row.amount ?? 0;
                return (row as Record<string, string | number | undefined>)[key] ?? '';
              }}
              emptyMessage="No orchestrator ledger transactions yet."
              renderRow={(tx) => (
                <tr key={tx.id} className="hover:bg-lbg-green-light/30">
                  <td className="py-3 px-4 font-mono text-xs">{shortId(tx.id, 10)}</td>
                  <td className="py-3 px-4 text-sm">{tx.type ?? 'transfer'}</td>
                  <td className="py-3 px-4 font-mono text-xs">{shortId(tx.from_wallet, 10)}</td>
                  <td className="py-3 px-4 font-mono text-xs">{shortId(tx.to_wallet, 10)}</td>
                  <td className="py-3 px-4 text-sm">
                    {tx.amount != null ? `${tx.amount} ${tx.asset ?? ''}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadge[tx.status ?? 'pending'] ?? 'neutral'}>{tx.status ?? '—'}</Badge>
                  </td>
                </tr>
              )}
            />
          </ContentPanel>
        </div>
      )}
    </AdminLayout>
  );
}
