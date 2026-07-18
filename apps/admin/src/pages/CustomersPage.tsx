import { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button, SearchInput } from '../components/ui';
import { customers, formatGBP } from '../data/adminMockData';

const statusBadge = { active: 'success', pending_kyc: 'warning', suspended: 'error' } as const;
const kycBadge = { approved: 'success', in_review: 'warning', pending: 'neutral', rejected: 'error' } as const;

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Customer Management"
        subtitle="View and manage Reboot 2026 customer accounts"
        actions={<Button size="sm">Export CSV</Button>}
      />

      <Card padding={false}>
        <div className="p-4 border-b border-lbg-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">Active</Button>
            <Button variant="ghost" size="sm">Pending KYC</Button>
          </div>
        </div>
        <DataTable headers={['Customer', 'Contact', 'Status', 'KYC', 'Policies', 'Wallet', 'Joined', 'Actions']}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-lbg-gray-50">
              <td className="py-3 px-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-lbg-gray-400">{c.id}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm">{c.email}</p>
                <p className="text-xs text-lbg-gray-400">{c.phone}</p>
              </td>
              <td className="py-3 px-4"><Badge variant={statusBadge[c.status]}>{c.status.replace('_', ' ')}</Badge></td>
              <td className="py-3 px-4"><Badge variant={kycBadge[c.kycStatus]}>{c.kycStatus.replace('_', ' ')}</Badge></td>
              <td className="py-3 px-4 font-semibold">{c.policies}</td>
              <td className="py-3 px-4">{formatGBP(c.walletBalance)}</td>
              <td className="py-3 px-4 text-lbg-gray-400">{c.joined}</td>
              <td className="py-3 px-4">
                <Button variant="ghost" size="sm">View</Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
