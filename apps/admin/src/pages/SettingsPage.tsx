import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Button } from '../components/ui';
import { Bell, Lock, Users, GitBranch, Globe, Database, Coins } from 'lucide-react';

const sections = [
  {
    title: 'Team & Access',
    icon: Users,
    items: [
      { label: 'Admin Users', desc: '12 active administrators', action: 'Manage' },
      { label: 'Role Permissions', desc: 'Operations, Compliance, Finance roles', action: 'Configure' },
    ],
  },
  {
    title: 'Workflow Configuration',
    icon: GitBranch,
    items: [
      { label: 'Automation Thresholds', desc: 'Auto-claim limit: £500', action: 'Edit' },
      { label: 'KYC Risk Scoring', desc: 'Manual review above score 25', action: 'Edit' },
    ],
  },
  {
    title: 'Security',
    icon: Lock,
    items: [
      { label: 'SSO / SAML', desc: 'Reboot 2026 corporate identity provider', action: 'Configure' },
      { label: 'Audit Logging', desc: 'All actions logged for 7 years', action: 'View Logs' },
    ],
  },
  {
    title: 'Blockchain & Tokenization',
    icon: Coins,
    items: [
      { label: 'Network Configuration', desc: 'GCUL L2 · Chain ID 88421', action: 'Configure' },
      { label: 'Token Minting Rules', desc: 'Auto-mint ERC-721 on policy purchase', action: 'Edit' },
      { label: 'Gas Price Limits', desc: 'Max 50 gwei per transaction', action: 'Edit' },
      { label: 'IPFS Metadata Gateway', desc: 'Pinata · policy metadata storage', action: 'Configure' },
    ],
  },
  {
    title: 'Integrations',
    icon: Globe,
    items: [
      { label: 'Blockchain Node', desc: 'Ethereum L2 – Connected · 99.97% uptime', action: 'Status' },
      { label: 'Smart Contract Registry', desc: '6 contracts deployed · 1 paused', action: 'Manage' },
      { label: 'Stripe / PayPal', desc: 'UK payment gateways active', action: 'Configure' },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Alert Rules', desc: 'Fraud, KYC, high-value claims', action: 'Manage' },
      { label: 'Email Templates', desc: 'Customer & admin notifications', action: 'Edit' },
    ],
  },
  {
    title: 'Data & Compliance',
    icon: Database,
    items: [
      { label: 'GDPR Retention', desc: '7-year policy data retention', action: 'Configure' },
      { label: 'Data Export', desc: 'Subject access request handling', action: 'Manage' },
    ],
  },
];

export function SettingsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Settings" subtitle="Enterprise configuration and integrations" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map(({ title, icon: Icon, items }) => (
          <Card key={title}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-lbg-green" />
              <h3 className="font-bold">{title}</h3>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-lbg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-lbg-gray-400">{item.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">{item.action}</Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
