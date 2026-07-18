import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Button } from '../components/ui';
import { chartData, formatGBP } from '../data/adminMockData';

export function ReportsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Enterprise insights and regulatory reporting"
        actions={
          <>
            <Button variant="outline" size="sm">Last 30 days</Button>
            <Button size="sm">Export Report</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-bold mb-4">Premium Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.premiums}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatGBP(Number(v))} />
              <Line type="monotone" dataKey="value" stroke="#00864f" strokeWidth={2} dot={{ fill: '#00864f' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">Claims Processing Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.claims}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="automated" name="Automated" fill="#00864f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="manual" name="Manual" fill="#b8e0cc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'FCA Regulatory Report', desc: 'Quarterly compliance submission', period: 'Q3 2024' },
          { title: 'Claims Loss Ratio', desc: 'Combined ratio analysis', period: 'Sep 2024' },
          { title: 'KYC Compliance Audit', desc: 'AML/KYC adherence report', period: 'Oct 2024' },
          { title: 'Blockchain Ledger Audit', desc: 'On-chain policy verification', period: 'Oct 2024' },
        ].map((r) => (
          <Card key={r.title}>
            <p className="font-bold text-sm">{r.title}</p>
            <p className="text-xs text-lbg-gray-400 mt-1">{r.desc}</p>
            <p className="text-xs text-lbg-green font-semibold mt-3">{r.period}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">Download PDF</Button>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
