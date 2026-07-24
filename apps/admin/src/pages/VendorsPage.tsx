import { useEffect, useState } from 'react';
import { Building2, Mail, Rocket, Send } from 'lucide-react';
import { adminApi, type Vendor } from '../api';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge, Button, Card, ContentPanel, PageHeader, AlertBanner, PaginatedTable } from '../components/ui';

const emptyForm = {
  name: '',
  code: '',
  categories: 'Health',
  contact_email: '',
  contact_name: '',
  description: '',
  website_url: '',
};

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listVendors();
      setVendors(res.vendors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onboard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await adminApi.onboardVendor(form);
      setNotice(
        `Onboarded ${created.name}. Invite emailed to ${created.contact_email}` +
          (created.temp_password ? ` · temp password: ${created.temp_password}` : ''),
      );
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboard failed');
    } finally {
      setSaving(false);
    }
  }

  async function publish(vendor: Vendor) {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.publishVendor(vendor.id, {
        ui_deploy_url: `https://vendors.reboot2026.local/${vendor.code}`,
        ui_version: vendor.ui_version || '1.0.0',
      });
      setNotice(`Published ${updated.name} UI ${updated.ui_version} → ${updated.ui_deploy_url}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSaving(false);
    }
  }

  async function resend(vendor: Vendor) {
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi.resendVendorInvite(vendor.id);
      setNotice(`Invite resent to ${res.emailed_to} · temp password: ${res.temp_password}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        icon={Building2}
        title="Insurance vendors"
        subtitle="Onboard cover providers, publish partner UI, and manage credentials"
        metrics={[
          { label: 'Vendors', value: vendors.length },
          { label: 'Active', value: vendors.filter((v) => v.status === 'active').length, tone: 'success' },
          { label: 'Invited', value: vendors.filter((v) => v.status === 'invited').length, tone: 'warning' },
        ]}
        actions={
          <Button variant="hero" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Building2 className="w-4 h-4" />
            {showForm ? 'Close form' : 'Onboard vendor'}
          </Button>
        }
      />

      {notice ? <AlertBanner variant="success">{notice}</AlertBanner> : null}
      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {showForm ? (
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">Onboard a new vendor</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onboard}>
            {(
              [
                ['name', 'Vendor name', 'Vitality'],
                ['code', 'Vendor code', 'vitality'],
                ['categories', 'Categories', 'Health'],
                ['contact_name', 'Contact name', 'Partnerships lead'],
                ['contact_email', 'Contact email', 'partner@vendor.com'],
                ['website_url', 'Website', 'https://…'],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="text-sm font-medium text-lbg-gray-600">
                {label}
                <input
                  className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 text-lbg-black"
                  value={form[key]}
                  placeholder={placeholder}
                  required={key !== 'website_url'}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="text-sm font-medium text-lbg-gray-600 md:col-span-2">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-lbg-gray-200 px-3 py-2 text-lbg-black min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                <Mail className="w-4 h-4" />
                {saving ? 'Saving…' : 'Create + email credentials'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <ContentPanel title="Vendor directory" description="Partner insurers and their deployment status">
        {loading ? (
          <p className="p-6 text-sm text-lbg-gray-500">Loading vendors…</p>
        ) : (
          <PaginatedTable
            columns={[
              { key: 'name', label: 'Vendor', sortable: true },
              { key: 'categories', label: 'Categories', sortable: true },
              { key: 'status', label: 'Status', sortable: true },
              { key: 'ui_deploy_url', label: 'UI deploy', sortable: true },
              { key: '_actions', label: 'Actions', sortable: false },
            ]}
            rows={vendors}
            rowKey={(v) => v.id}
            defaultSortKey="name"
            defaultSortDir="asc"
            getSortValue={(row, key) => {
              if (key === 'ui_deploy_url') return row.ui_deploy_url ?? '';
              if (key === '_actions') return '';
              return (row as Record<string, string>)[key];
            }}
            emptyMessage="No vendors yet. Onboard Vitality or another partner to get started."
            renderRow={(vendor) => (
              <tr key={vendor.id} className="border-b border-lbg-gray-50 hover:bg-lbg-gray-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-lbg-black">{vendor.name}</p>
                  <p className="text-xs text-lbg-gray-400">
                    {vendor.code} · {vendor.contact_email}
                  </p>
                </td>
                <td className="px-5 py-4">{vendor.categories}</td>
                <td className="px-5 py-4">
                  <Badge
                    variant={
                      vendor.status === 'active'
                        ? 'success'
                        : vendor.status === 'invited'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {vendor.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs text-lbg-gray-600 max-w-[220px] truncate">
                  {vendor.ui_deploy_url || '—'}
                  {vendor.ui_version ? ` · v${vendor.ui_version}` : ''}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => void publish(vendor)}>
                      <Rocket className="w-3.5 h-3.5" />
                      Publish UI
                    </Button>
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => void resend(vendor)}>
                      <Send className="w-3.5 h-3.5" />
                      Resend invite
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </ContentPanel>
    </AdminLayout>
  );
}
