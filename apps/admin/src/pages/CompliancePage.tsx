import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, LockKeyhole, Plus, Scale, ScanSearch, ShieldCheck, X } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AlertBanner, Badge, Button, Card, PageHeader, StatCard } from '../components/ui';

type Rule = {
  id: string;
  title: string;
  source: string;
  category: 'Identity' | 'Sanctions' | 'Fraud' | 'Conduct';
  description: string;
  status: 'Active' | 'Draft';
};

const demoRules: Rule[] = [
  { id: 'UK-AML-01', title: 'Identity verification before mint', source: 'Money Laundering Regulations 2017', category: 'Identity', description: 'Require completed KYC and a verified customer identity before a policy certificate can be minted.', status: 'Active' },
  { id: 'UK-SAN-02', title: 'Sanctions screening', source: 'UK Sanctions List', category: 'Sanctions', description: 'Block minting when the insured party or beneficial owner has a sanctions-screening match.', status: 'Active' },
  { id: 'UK-FRD-03', title: 'Duplicate policy velocity check', source: 'Fraud prevention control', category: 'Fraud', description: 'Flag repeated quote, payment, wallet, or device combinations for investigator review.', status: 'Active' },
  { id: 'UK-COC-04', title: 'Fair value and product eligibility', source: 'FCA Consumer Duty', category: 'Conduct', description: 'Confirm the selected product remains suitable and the policy is eligible for issuance.', status: 'Active' },
];

const checks = [
  { label: 'Customer identity verified', detail: 'KYC status confirmed · UK-AML-01', status: 'Passed' },
  { label: 'Sanctions screening', detail: 'No matches found · UK-SAN-02', status: 'Passed' },
  { label: 'Fraud signal review', detail: 'Device, wallet and policy velocity within threshold · UK-FRD-03', status: 'Passed' },
  { label: 'Product eligibility', detail: 'Cover and payment validated · UK-COC-04', status: 'Passed' },
] as const;

const categoryStyle: Record<Rule['category'], 'success' | 'warning' | 'info' | 'purple'> = {
  Identity: 'success', Sanctions: 'warning', Fraud: 'info', Conduct: 'purple',
};

export function CompliancePage() {
  const [rules, setRules] = useState(demoRules);
  const [showAdd, setShowAdd] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', source: 'FCA Handbook', category: 'Conduct' as Rule['category'], description: '' });
  const activeRules = useMemo(() => rules.filter((rule) => rule.status === 'Active').length, [rules]);

  const addRule = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setRules((current) => [...current, {
      id: `UK-REG-${String(current.length + 1).padStart(2, '0')}`,
      title: form.title.trim(), source: form.source.trim() || 'UK regulatory control', category: form.category,
      description: form.description.trim(), status: 'Draft',
    }]);
    setNotice('Demo rule saved as Draft. Connect it to a review workflow before enforcing it in production.');
    setShowAdd(false);
    setForm({ title: '', source: 'FCA Handbook', category: 'Conduct', description: '' });
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={ShieldCheck}
        title="Compliance & fraud controls"
        subtitle="Demo controls evaluated before a policy certificate is minted on Canton."
        metrics={[
          { label: 'Active controls', value: activeRules, tone: 'success' },
          { label: 'Pre-mint checks', value: checks.length, tone: 'success' },
          { label: 'Escalations today', value: 0, tone: 'default' },
        ]}
        actions={<Button variant="hero" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add demo rule</Button>}
      />

      {notice ? <AlertBanner variant="success">{notice}</AlertBanner> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Checks passed" value="4 / 4" change="Latest mint-ready policy" icon={CheckCircle2} trend="up" />
        <StatCard label="Fraud cases" value="0" change="No blocks in demo queue" icon={ScanSearch} trend="neutral" />
        <StatCard label="Regulatory rules" value={String(activeRules)} change="UK demo control set" icon={Scale} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="xl:col-span-2">
          <Card className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-lbg-green">Mint gate</p>
                <h2 className="mt-1 text-lg font-bold">Pre-mint decision</h2>
                <p className="mt-1 text-sm text-lbg-gray-500">Policy POL-2026-0142 · Canton Local Sandbox</p>
              </div>
              <Badge variant="success">Ready to mint</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {checks.map((check) => (
                <div key={check.label} className="flex gap-3 rounded-lg border border-lbg-gray-100 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lbg-green" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{check.label}</p>
                    <p className="mt-0.5 text-xs text-lbg-gray-500">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-lbg-green-light p-3 text-sm text-lbg-green-dark">
              <span className="font-semibold">Canton mint enabled:</span> all mandatory demo controls passed.
            </div>
          </Card>
        </section>

        <section className="xl:col-span-3">
          <Card padding={false}>
            <div className="flex flex-col gap-3 border-b border-lbg-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-lbg-green">Rule library</p>
                <h2 className="mt-1 text-lg font-bold">UK compliance demo rules</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add rule</Button>
            </div>
            <div className="divide-y divide-lbg-gray-100">
              {rules.map((rule) => (
                <div key={rule.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{rule.title}</p>
                    <Badge variant={categoryStyle[rule.category]}>{rule.category}</Badge>
                    <Badge variant={rule.status === 'Active' ? 'success' : 'neutral'}>{rule.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium text-lbg-gray-400">{rule.id} · {rule.source}</p>
                  <p className="mt-2 text-sm text-lbg-gray-600">{rule.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      <Card className="mt-6 border-amber-100 bg-amber-50/40">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-900">Demo controls only</p>
            <p className="mt-1 text-sm text-amber-800">These rules are illustrative and do not constitute legal advice. Production controls need approved regulatory policy, data sources, audit evidence, and human review.</p>
          </div>
        </div>
      </Card>

      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-rule-title">
          <Card className="w-full max-w-lg shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-lbg-green">Demo configuration</p><h2 id="add-rule-title" className="mt-1 text-lg font-bold">Add compliance rule</h2></div>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} aria-label="Close add rule"><X className="w-4 h-4" /></Button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">Rule name<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 font-normal" placeholder="e.g. Vulnerable customer review" /></label>
              <label className="block text-sm font-semibold">UK regulatory source<input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="mt-1.5 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 font-normal" placeholder="e.g. FCA Consumer Duty" /></label>
              <label className="block text-sm font-semibold">Control category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Rule['category'] })} className="mt-1.5 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 font-normal"><option>Identity</option><option>Sanctions</option><option>Fraud</option><option>Conduct</option></select></label>
              <label className="block text-sm font-semibold">Rule behaviour<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 font-normal" placeholder="Describe when this control should flag or block a mint." /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addRule}><LockKeyhole className="w-4 h-4" /> Save draft</Button></div>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
