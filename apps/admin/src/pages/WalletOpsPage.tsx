import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, StatCard } from '../components/ui';
import { walletTransactions, formatGBP, dashboardStats } from '../data/adminMockData';
import { Wallet, ArrowDownLeft, ArrowUpRight, Link2 } from 'lucide-react';

export function WalletOpsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Wallet Operations" subtitle="Monitor blockchain wallet transactions and treasury" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Wallet Volume" value={formatGBP(dashboardStats.walletVolume)} change="+12% this quarter" icon={Wallet} trend="up" />
        <StatCard label="Pending Deposits" value="3" change="£340 awaiting" icon={ArrowDownLeft} trend="neutral" />
        <StatCard label="Claim Payouts (MTD)" value={formatGBP(dashboardStats.claimPayouts)} icon={ArrowUpRight} trend="down" />
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-lbg-gray-100">
          <h3 className="font-bold">Recent Transactions</h3>
        </div>
        <DataTable headers={['ID', 'Customer', 'Type', 'Amount', 'Method', 'Status', 'Blockchain', 'Date']}>
          {walletTransactions.map((tx) => (
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
          ))}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
