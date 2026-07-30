import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, Plus, Flame, Snowflake, Check, X, ExternalLink, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { PreMintChecksModal, type PreMintCheck } from '../components/PreMintChecksModal';
import { Card, PageHeader, Badge, Button, PaginatedTable, StatCard, TablePagination, usePaginatedList, AlertBanner } from '../components/ui';
import { adminApi, type TokenizationView } from '../api';
import { formatNumber } from '../data/adminMockData';
import { getSimAction, getSimParam } from '../simulation/simQuery';
import { highlightElement } from '../simulation/highlight';

const REFRESH_MS = 15_000;

const statusBadge = {
  active: 'success', minting: 'info', transferred: 'purple', burned: 'neutral', frozen: 'warning', redeemed: 'success',
  pending: 'warning', pending_wallet: 'warning', approved: 'info', completed: 'success', rejected: 'error', failed: 'error',
} as const;

const typeBadge = {
  policy_nft: 'success', premium_credit: 'info', claim_voucher: 'warning', coverage_certificate: 'purple',
} as const;

function formatWhen(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function queueLabel(status: string) {
  if (status === 'pending_wallet') return 'Awaiting wallet';
  if (status === 'failed') return 'Mint failed';
  return 'Pending mint';
}

type PreMintChecksTarget = {
  title: string;
  subtitle: string;
  checks: PreMintCheck[];
  policyId?: string;
  canApproveMint?: boolean;
};

export function TokenizationPage() {
  const [searchParams] = useSearchParams();
  const simMintRan = useRef(false);
  const [tab, setTab] = useState<'registry' | 'mint-queue' | 'failed-mints' | 'standards'>('registry');
  const [data, setData] = useState<TokenizationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionPolicyId, setActionPolicyId] = useState<string | null>(null);
  const [selectedChecks, setSelectedChecks] = useState<PreMintChecksTarget | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    adminApi
      .tokenizationView()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load tokenization data');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load(false);
    const timer = window.setInterval(() => load(true), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const registry = data?.registry ?? [];
  const mintQueueItems = data?.mint_queue ?? [];
  const failedMints = data?.failed_mints ?? [];
  const stats = data?.stats;
  const blockchain = data?.blockchain;
  const standards = data?.standards ?? [];

  const mintQueue = usePaginatedList(mintQueueItems, {
    defaultSortKey: 'requested_at',
    defaultSortDir: 'desc',
    pageSize: 5,
  });

  useEffect(() => {
    if (simMintRan.current || loading) return;
    if (getSimAction(searchParams.toString()) !== 'approve-mint') return;
    const policyId = getSimParam(searchParams.toString(), 'simPolicyId');
    if (!policyId) return;
    if (getSimParam(searchParams.toString(), 'simTab') === 'mint-queue') {
      setTab('mint-queue');
    }
    simMintRan.current = true;
    const timer = window.setTimeout(() => {
      const row = mintQueueItems.find((m) => m.id === policyId);
      if (!row) return;
      highlightElement(document.querySelector(`[data-sim-mint-row="${policyId}"]`));
      setSelectedChecks({
        title: row.product_title,
        subtitle: `${row.policy_number} · ${row.customer_name}`,
        checks: row.pre_mint_checks ?? [],
        policyId: row.id,
        canApproveMint: true,
      });
      window.setTimeout(() => {
        void handleApproveMint(row.id).then(() => setSelectedChecks(null));
      }, 2200);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [loading, searchParams, mintQueueItems]);

  const failedMintList = usePaginatedList(failedMints, {
    defaultSortKey: 'failed_at',
    defaultSortDir: 'desc',
    pageSize: 5,
  });

  const isCanton = blockchain?.ledger_type === 'canton' || (blockchain?.mode?.includes('canton') ?? false);
  const networkLabel = blockchain?.network_name ?? (isCanton ? 'Canton Local Sandbox' : 'Local simulation');
  const modeLabel = isCanton
    ? (blockchain?.live ? 'Live Canton minting' : 'Canton offline (simulated fallback)')
    : 'Simulated minting';

  const handleApproveMint = async (policyId: string) => {
    setActionPolicyId(policyId);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminApi.approvePolicyMint(policyId);
      setSuccess(
        result.token_id
          ? `Policy ${policyId} minted on Canton (token ${result.token_id}).`
          : `Policy ${policyId} mint approved.`,
      );
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint approval failed');
    } finally {
      setActionPolicyId(null);
    }
  };

  const handleRejectMint = async (policyId: string) => {
    setActionPolicyId(policyId);
    setError(null);
    try {
      await adminApi.rejectPolicyMint(policyId);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint rejection failed');
    } finally {
      setActionPolicyId(null);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={Coins}
        title="Tokenization"
        subtitle="Live policy NFT registry and mint queue from policy-service and blockchain orchestrator"
        metrics={[
          { label: 'Policy NFTs', value: formatNumber(stats?.policy_nfts ?? 0) },
          { label: 'Pending mints', value: String(stats?.pending_mints ?? 0), tone: 'warning' },
          { label: 'Network', value: isCanton ? (blockchain?.live ? 'Canton live' : 'Canton') : 'Simulated', tone: blockchain?.live ? 'success' : 'default' },
        ]}
        actions={
          <>
            <Button variant="hero" size="sm" onClick={() => load(false)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" disabled><Plus className="w-4 h-4" /> Mint Policy Token</Button>
          </>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}
      {success ? <AlertBanner variant="success">{success}</AlertBanner> : null}

      <Card className="mb-6 bg-gradient-to-r from-lbg-green to-lbg-sidebar text-white border-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-white/80 font-medium">
              {networkLabel} · {isCanton ? 'Daml ledger' : `Chain ID ${blockchain?.chain_id ?? 11155111}`}
            </p>
            <p className="text-2xl font-bold mt-1">{modeLabel}</p>
            <p className="text-xs text-white/70 mt-1">
              {isCanton ? 'Template' : 'Contract'} {blockchain?.contract_address || 'not configured'} · Auto-refresh every {REFRESH_MS / 1000}s
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Policy NFTs', v: formatNumber(stats?.policy_nfts ?? 0) },
              { l: 'Pending', v: String(stats?.pending_mints ?? 0) },
              { l: 'Awaiting wallet', v: String(stats?.pending_wallet ?? 0) },
              { l: 'Failed', v: String(stats?.failed_mints ?? 0) },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{v}</p>
                <p className="text-[10px] text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Minted policy certificates" value={formatNumber(stats?.policy_nfts ?? 0)} change={isCanton ? 'Daml on Canton' : 'Local simulation'} icon={Coins} trend="up" />
        <StatCard label="Issued policies" value={formatNumber(stats?.total_issued ?? 0)} change="All issuance records" icon={Coins} trend="neutral" />
        <StatCard label="Mint queue" value={String(stats?.pending_mints ?? 0)} change="Pending insurer mint" icon={Coins} trend="neutral" />
        <StatCard label="Failed mints" value={String(stats?.failed_mints ?? 0)} change="Needs investigation" icon={Coins} trend={stats?.failed_mints ? 'down' : 'neutral'} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['registry', 'mint-queue', 'failed-mints', 'standards'] as const).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'outline'} size="sm" onClick={() => setTab(t)}>
            {t === 'registry'
              ? `Token Registry (${registry.length})`
              : t === 'mint-queue'
                ? `Mint Queue (${mintQueueItems.length})`
                : t === 'failed-mints'
                  ? `Failed Mints (${failedMints.length})`
                  : 'Token Standards'}
          </Button>
        ))}
      </div>

      {loading && !data ? (
        <Card><p className="p-6 text-sm text-lbg-gray-500">Loading live tokenization data…</p></Card>
      ) : null}

      {tab === 'registry' && (
        <Card padding={false}>
          <PaginatedTable
            columns={[
              { key: 'token_id', label: 'Token ID', sortable: true },
              { key: 'name', label: 'Name', sortable: true },
              { key: 'standard', label: 'Standard', sortable: true },
              { key: 'type', label: 'Type', sortable: true },
              { key: 'owner', label: 'Owner', sortable: true },
              { key: 'coverage_summary', label: 'Coverage', sortable: true },
              { key: 'cover_expires_at', label: 'Expires', sortable: true },
              { key: 'wallet_address', label: 'Wallet', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'contract_address', label: 'Contract', sortable: true },
              { key: '_actions', label: 'Actions', sortable: false },
            ]}
            rows={registry}
            rowKey={(t) => t.id}
            defaultSortKey="token_id"
            defaultSortDir="desc"
            emptyMessage="No minted policy NFTs yet. Complete a customer payment with KYC and wallet linked."
            getSortValue={(row, key) => {
              if (key === '_actions') return '';
              return (row as unknown as Record<string, string | number>)[key];
            }}
            renderRow={(t) => (
              <tr key={t.id} className="hover:bg-lbg-gray-50">
                <td className="py-3 px-4 font-mono text-sm font-semibold">{t.token_id ?? '—'}</td>
                <td className="py-3 px-4">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-lbg-gray-400">{t.policy_number}</p>
                </td>
                <td className="py-3 px-4"><Badge variant="info">{t.standard}</Badge></td>
                <td className="py-3 px-4"><Badge variant={typeBadge[t.type]}>{t.type.replace('_', ' ')}</Badge></td>
                <td className="py-3 px-4 text-sm">{t.owner}</td>
                <td className="py-3 px-4 text-xs text-lbg-gray-600 max-w-[200px]">
                  <p className="line-clamp-2">{t.coverage_summary ?? '—'}</p>
                  {t.coverage_limit_gbp != null ? (
                    <p className="text-[10px] text-lbg-gray-400 mt-1">
                      £{Number(t.coverage_limit_gbp).toLocaleString('en-GB')} limit
                    </p>
                  ) : null}
                </td>
                <td className="py-3 px-4 text-xs text-lbg-gray-500">{formatWhen(t.cover_expires_at)}</td>
                <td className="py-3 px-4 font-mono text-xs text-lbg-gray-500">{t.wallet_address || '—'}</td>
                <td className="py-3 px-4"><Badge variant={statusBadge[t.status]}>{t.status}</Badge></td>
                <td className="py-3 px-4 font-mono text-xs text-lbg-gray-400">{t.contract_address || '—'}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChecks({
                        title: t.name,
                        subtitle: t.policy_number,
                        checks: t.pre_mint_checks ?? [],
                      })}
                      aria-label={`View pre-mint checks for ${t.name}`}
                      title="View pre-mint checks"
                    >
                      <Eye className="w-3 h-3" aria-hidden="true" />
                    </Button>
                    {t.explorer_url ? (
                      <a
                        href={t.explorer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-lbg-gray-500 hover:bg-lbg-gray-100 hover:text-lbg-green"
                        aria-label={`View ${t.name} on explorer`}
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <Button variant="ghost" size="sm" disabled aria-label="No explorer link">
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </Button>
                    )}
                    {t.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm" disabled aria-label={`Freeze ${t.name}`}>
                          <Snowflake className="w-3 h-3" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled aria-label={`Burn ${t.name}`}>
                          <Flame className="w-3 h-3" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {tab === 'mint-queue' && (
        <div className="space-y-3">
          {mintQueue.pageItems.length === 0 ? (
            <Card><p className="p-6 text-sm text-lbg-gray-500">No policies waiting to mint.</p></Card>
          ) : null}
          {mintQueue.pageItems.map((m) => (
            <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4" data-sim-mint-row={m.id}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{m.policy_number}</p>
                  <Badge variant="info">{m.standard}</Badge>
                  <Badge variant={statusBadge[m.status]}>{queueLabel(m.status)}</Badge>
                </div>
                <p className="text-sm text-lbg-gray-600 mt-1">
                  {m.customer_name} · {m.product_title}
                </p>
                {m.coverage_summary ? (
                  <p className="text-xs text-lbg-gray-500 mt-1">{m.coverage_summary}</p>
                ) : null}
                <p className="text-xs text-lbg-gray-400 mt-1">
                  Issued {formatWhen(m.requested_at)}
                  {m.cover_expires_at ? ` · Cover expires ${formatWhen(m.cover_expires_at)}` : ''}
                </p>
              </div>
              {m.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedChecks({
                      title: m.product_title,
                      subtitle: `${m.policy_number} · ${m.customer_name}`,
                      checks: m.pre_mint_checks ?? [],
                    })}
                  >
                    <Eye className="w-4 h-4" />
                    Pre-mint checks
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionPolicyId !== null}
                    onClick={() => setSelectedChecks({
                      title: m.product_title,
                      subtitle: `${m.policy_number} · ${m.customer_name}`,
                      checks: m.pre_mint_checks ?? [],
                      policyId: m.id,
                      canApproveMint: true,
                    })}
                  >
                    <Check className="w-4 h-4" />
                    Approve Mint
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={actionPolicyId !== null}
                    onClick={() => handleRejectMint(m.id)}
                  >
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
              {m.status === 'pending_wallet' && (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="warning">Customer must link wallet</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedChecks({
                      title: m.product_title,
                      subtitle: `${m.policy_number} · ${m.customer_name}`,
                      checks: m.pre_mint_checks ?? [],
                    })}
                  >
                    <Eye className="w-4 h-4" />
                    Pre-mint checks
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionPolicyId !== null}
                    onClick={() => handleApproveMint(m.id)}
                  >
                    {actionPolicyId === m.id ? 'Minting…' : 'Retry after wallet linked'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
          <TablePagination
            page={mintQueue.page}
            pageSize={mintQueue.pageSize}
            totalItems={mintQueue.totalItems}
            totalPages={mintQueue.totalPages}
            onPageChange={mintQueue.setPage}
            onPageSizeChange={mintQueue.setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      )}

      {tab === 'failed-mints' && (
        <div className="space-y-3">
          {failedMintList.pageItems.length === 0 ? (
            <Card><p className="p-6 text-sm text-lbg-gray-500">No failed or rejected mints. Failed mints are kept here for investigation and follow-up.</p></Card>
          ) : null}
          {failedMintList.pageItems.map((m) => (
            <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border-red-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold">{m.policy_number}</p>
                  <Badge variant="info">{m.standard}</Badge>
                  <Badge variant="error">{m.failure_reason?.toLowerCase().includes('rejected') ? 'Rejected' : 'Failed'}</Badge>
                </div>
                <p className="text-sm text-lbg-gray-600 mt-1">{m.customer_name} · {m.product_title}</p>
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Failure reason</p>
                  <p>{m.failure_reason || 'The mint did not return a reason. Check the blockchain orchestrator logs.'}</p>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-lbg-gray-600">
                  <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
                  <p><span className="font-semibold">Next action:</span> {m.next_action || 'Review the policy and retry when the issue is resolved.'}</p>
                </div>
                <p className="text-xs text-lbg-gray-400 mt-2">Failed {formatWhen(m.failed_at ?? m.requested_at)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedChecks({
                    title: m.product_title,
                    subtitle: `${m.policy_number} · ${m.customer_name}`,
                    checks: m.pre_mint_checks ?? [],
                  })}
                >
                  <Eye className="w-4 h-4" />
                  Pre-mint checks
                </Button>
                <Button size="sm" disabled={actionPolicyId !== null} onClick={() => handleApproveMint(m.id)}>
                  <RefreshCw className={`w-4 h-4 ${actionPolicyId === m.id ? 'animate-spin' : ''}`} />
                  {actionPolicyId === m.id ? 'Retrying…' : 'Retry mint'}
                </Button>
              </div>
            </Card>
          ))}
          <TablePagination
            page={failedMintList.page}
            pageSize={failedMintList.pageSize}
            totalItems={failedMintList.totalItems}
            totalPages={failedMintList.totalPages}
            onPageChange={failedMintList.setPage}
            onPageSizeChange={failedMintList.setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      )}

      {tab === 'standards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {standards.map((tc) => (
            <Card key={tc.standard}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant="info">{tc.standard}</Badge>
                  <p className="font-bold text-lg mt-2">{tc.name}</p>
                  <p className="text-sm text-lbg-gray-400">{tc.symbol}</p>
                </div>
                <div className={`w-10 h-5 rounded-full ${tc.enabled ? 'bg-lbg-green' : 'bg-lbg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 mt-0.5 transition-transform ${tc.enabled ? 'translate-x-5' : ''}`} />
                </div>
              </div>
              <p className="text-sm text-lbg-gray-600 mb-4">{tc.description}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400">Total Supply</p>
                  <p className="font-bold">{formatNumber(tc.total_supply)}</p>
                </div>
                <div className="bg-lbg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-lbg-gray-400">Circulating</p>
                  <p className="font-bold">{formatNumber(tc.circulating)}</p>
                </div>
              </div>
              <p className="font-mono text-xs text-lbg-gray-400 break-all">{tc.contract_address}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled>Configure</Button>
            </Card>
          ))}
        </div>
      )}

      <PreMintChecksModal
        open={selectedChecks !== null}
        title={selectedChecks?.title ?? ''}
        subtitle={selectedChecks?.subtitle ?? ''}
        checks={selectedChecks?.checks ?? []}
        minting={selectedChecks?.policyId != null && actionPolicyId === selectedChecks.policyId}
        canApproveMint={selectedChecks?.canApproveMint}
        onClose={() => setSelectedChecks(null)}
        onApproveMint={
          selectedChecks?.policyId && selectedChecks.canApproveMint
            ? () => {
                const policyId = selectedChecks.policyId!;
                void handleApproveMint(policyId).then(() => setSelectedChecks(null));
              }
            : undefined
        }
      />
    </AdminLayout>
  );
}
