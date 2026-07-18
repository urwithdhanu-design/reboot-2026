import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, DataTable, Badge, Button } from '../components/ui';
import { adminClaims, formatGBP } from '../data/adminMockData';

const statusBadge = {
  pending: 'warning', processing: 'info', approved: 'success', rejected: 'error', auto_approved: 'success',
} as const;

export function ClaimsPage() {
  const manual = adminClaims.filter((c) => c.workflow === 'manual');
  const automated = adminClaims.filter((c) => c.workflow === 'automated');

  return (
    <AdminLayout>
      <PageHeader
        title="Claims Processing"
        subtitle="Automated and manual claim adjudication workflows"
        actions={
          <>
            <Button variant="outline" size="sm">Automated ({automated.length})</Button>
            <Button variant="outline" size="sm">Manual Queue ({manual.length})</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Total Open</p>
          <p className="text-2xl font-bold mt-1">{adminClaims.filter((c) => ['pending', 'processing'].includes(c.status)).length}</p>
        </Card>
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Auto-Approved Today</p>
          <p className="text-2xl font-bold text-lbg-green mt-1">12</p>
        </Card>
        <Card>
          <p className="text-xs text-lbg-gray-400 uppercase font-medium">Avg. Processing Time</p>
          <p className="text-2xl font-bold mt-1">4.2 hrs</p>
        </Card>
      </div>

      <Card padding={false}>
        <DataTable headers={['Claim ID', 'Customer', 'Policy', 'Amount', 'Status', 'Workflow', 'Claim Token', 'Payout Tx', 'Assignee', 'Submitted', 'Actions']}>
          {adminClaims.map((c) => (
            <tr key={c.id} className="hover:bg-lbg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{c.id}</td>
              <td className="py-3 px-4 font-semibold">{c.customerName}</td>
              <td className="py-3 px-4 text-sm">{c.policyTitle}</td>
              <td className="py-3 px-4 font-bold">{formatGBP(c.amount)}</td>
              <td className="py-3 px-4"><Badge variant={statusBadge[c.status]}>{c.status.replace('_', ' ')}</Badge></td>
              <td className="py-3 px-4">
                <Badge variant={c.workflow === 'automated' ? 'success' : 'warning'}>{c.workflow}</Badge>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-lbg-green">{c.claimTokenId ?? '—'}</td>
              <td className="py-3 px-4 font-mono text-xs text-lbg-gray-400">{c.payoutTx ?? '—'}</td>
              <td className="py-3 px-4 text-sm text-lbg-gray-400">{c.assignee ?? '—'}</td>
              <td className="py-3 px-4 text-lbg-gray-400">{c.submittedAt}</td>
              <td className="py-3 px-4">
                {c.status === 'pending' ? (
                  <div className="flex gap-1">
                    <Button size="sm">Approve</Button>
                    <Button variant="outline" size="sm">Review</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm">View</Button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </AdminLayout>
  );
}
