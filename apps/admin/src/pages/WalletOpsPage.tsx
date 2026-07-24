import { AdminLayout } from '../components/layout/AdminLayout';
import { PageHeader, ContentPanel, Badge, StatCard, PaginatedTable } from '../components/ui';
import { walletTransactions, formatGBP, dashboardStats } from '../data/adminMockData';
import { Wallet, ArrowDownLeft, ArrowUpRight, Link2 } from 'lucide-react';

export function WalletOpsPage() {
  return (
    <AdminLayout>
      <PageHeader
        icon={Wallet}
        title="Wallet operations"
        subtitle="Monitor blockchain wallet transactions and treasury flows"
        metrics={[
          { label: 'Volume', value: formatGBP(dashboardStats.walletVolume) },
          { label: 'Pending deposits', value: '3', tone: 'warning' },
          { label: 'Claim payouts', value: formatGBP(dashboardStats.claimPayouts), tone: 'success' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Wallet Volume" value={formatGBP(dashboardStats.walletVolume)} change="+12% this quarter" icon={Wallet} trend="up" />
        <StatCard label="Pending Deposits" value="3" change="£340 awaiting" icon={ArrowDownLeft} trend="neutral" />
        <StatCard label="Claim Payouts (MTD)" value={formatGBP(dashboardStats.claimPayouts)} icon={ArrowUpRight} trend="down" />
      </div>

      <ContentPanel title="Recent transactions" description="On-chain and ledger movements">
        <PaginatedTable
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { key: 'customerName', label: 'Customer', sortable: true },
            { key: 'type', label: 'Type', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true },
            { key: 'method', label: 'Method', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
            { key: 'blockchainTx', label: 'Blockchain', sortable: true },
            { key: 'date', label: 'Date', sortable: true },
          ]}
          rows={walletTransactions}
          rowKey={(tx) => tx.id}
          defaultSortKey="date"
          defaultSortDir="desc"
          getSortValue={(row, key) => {
            if (key === 'amount') return row.amount;
            if (key === 'blockchainTx') return row.blockchainTx ?? '';
            return (row as unknown as Record<string, string | number>)[key];
          }}
          renderRow={(tx) => (
            <tr key={tx.id} className="hover:bg-lbg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{tx.id}</td>
              <td className="py-3 px-4 font-semibold">{tx.customerName}</td>
              <td className="py-3 px-4"><Badge variant={tx.type === 'claim' ? 'success' : tx.type === 'premium' ? 'warning' : 'info'}>{tx.type}</Badge></td>
              <td className={`py-3 px-4 font-bold ${tx.amount > 0 ? 'text-lbg-green' : ''}`}>
                {tx.amount > 0 ? '+' : ''}{formatGBP(tx.amount)}
              </td>
              <td className="py-3 px-4 text-sm">{tx.method}</td>
              <td className="py-3 px-4"><Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}>{tx.status}</Badge></td>
              <td className="py-3 px-4">
                {tx.blockchainTx ? (
                  <span className="flex items-center gap-1 text-xs font-mono text-lbg-gray-400">
                    <Link2 className="w-3 h-3 text-lbg-green" />{tx.blockchainTx}
                  </span>
                ) : '—'}
              </td>
              <td className="py-3 px-4 text-lbg-gray-400">{tx.date}</td>
            </tr>
          )}
        />
      </ContentPanel>
    </AdminLayout>
  );
}
