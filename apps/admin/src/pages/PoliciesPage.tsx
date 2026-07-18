import { Link2 } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button } from '../components/ui';
import { adminPolicies, formatGBP } from '../data/adminMockData';

const statusBadge = { active: 'success', expiring: 'warning', expired: 'error', cancelled: 'neutral' } as const;

export function PoliciesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Policy Management"
        subtitle="Blockchain-tokenized policies with on-chain verification"
        actions={<Button size="sm">Mint New Policy Token</Button>}
      />

      <Card padding={false}>
        <DataTable headers={['Policy', 'Customer', 'Category', 'Premium', 'Coverage', 'Token ID', 'Standard', 'Status', 'On-Chain', 'Expires']}>
          {adminPolicies.map((p) => (
            <tr key={p.id} className="hover:bg-lbg-gray-50">
              <td className="py-3 px-4">
                <p className="font-semibold text-sm">{p.policyNumber}</p>
              </td>
              <td className="py-3 px-4">{p.customerName}</td>
              <td className="py-3 px-4"><Badge variant="info">{p.category}</Badge></td>
              <td className="py-3 px-4 font-semibold">{formatGBP(p.premium)}/mo</td>
              <td className="py-3 px-4">{formatGBP(p.coverage)}</td>
              <td className="py-3 px-4 font-mono text-sm text-lbg-green font-semibold">{p.tokenId ?? '—'}</td>
              <td className="py-3 px-4"><Badge variant="purple">{p.tokenStandard ?? '—'}</Badge></td>
              <td className="py-3 px-4"><Badge variant={statusBadge[p.status]}>{p.status}</Badge></td>
              <td className="py-3 px-4">
                <span className="flex items-center gap-1 text-xs font-mono text-lbg-gray-400">
                  <Link2 className="w-3 h-3 text-lbg-green" />{p.blockchainTx}
                </span>
              </td>
              <td className="py-3 px-4 text-lbg-gray-400">{p.endDate}</td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
