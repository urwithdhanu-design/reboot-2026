import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, ContentPanel, AlertBanner, Badge, Button, TablePagination, usePaginatedList } from '../components/ui';
import { adminApi, type AdminProduct } from '../api';
import { RefreshCw, Pencil, Package } from 'lucide-react';

const CATEGORIES = ['Health', 'Vehicle', 'Pet', 'Property', 'Life', 'Travel'];

function formatPrice(amount: number, unit: string) {
  return `£${amount.toFixed(2)}/${unit}`;
}

export function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<Partial<AdminProduct>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listProducts()
      .then((res) => {
        setProducts(res.products);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productList = usePaginatedList(products, {
    defaultSortKey: 'title',
    defaultSortDir: 'asc',
    pageSize: 9,
    getSortValue: (row, key) => {
      if (key === 'price_from') return row.price_from;
      if (key === 'rating') return row.rating;
      if (key === 'review_count') return row.review_count;
      return (row as unknown as Record<string, string | number | boolean>)[key] as string | number;
    },
  });

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({ ...product, bullets: product.bullets ?? [] });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateProduct(editing.id, {
        title: form.title,
        description: form.description,
        tagline: form.tagline,
        cta_label: form.cta_label,
        category: form.category,
        price_from: form.price_from,
        price_unit: form.price_unit,
        currency: form.currency,
        rating: form.rating,
        review_count: form.review_count,
        best_seller: form.best_seller,
        icon: form.icon,
        bullets: form.bullets,
      });
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const syncFirestore = async () => {
    setSyncing(true);
    try {
      await adminApi.refreshProductCache();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Firestore sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        icon={Package}
        title="Insurance products"
        subtitle="Marketplace catalogue — edits sync to Cloud SQL and Firestore"
        metrics={[
          { label: 'Products', value: products.length },
          { label: 'Best sellers', value: products.filter((p) => p.best_seller).length, tone: 'success' },
          { label: 'Categories', value: new Set(products.map((p) => p.category)).size },
        ]}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="hero" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="hero" onClick={() => void syncFirestore()} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync Firestore'}
            </Button>
          </div>
        }
      />

      {error ? <AlertBanner>{error}</AlertBanner> : null}

      {loading && products.length === 0 ? (
        <p className="text-sm text-lbg-gray-500">Loading products…</p>
      ) : null}

      <ContentPanel title="Product catalogue" description="Customer-facing marketplace cards" padding>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm text-lbg-gray-600 flex items-center gap-2">
            Sort by
            <select
              value={`${productList.sortKey}:${productList.sortDir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split(':') as [string, 'asc' | 'desc'];
                productList.setSort(key, dir);
              }}
              className="rounded-lg border border-lbg-gray-200 bg-white px-3 py-1.5 text-sm font-medium"
            >
              <option value="title:asc">Title A–Z</option>
              <option value="title:desc">Title Z–A</option>
              <option value="category:asc">Category</option>
              <option value="price_from:asc">Price low–high</option>
              <option value="price_from:desc">Price high–low</option>
              <option value="rating:desc">Rating</option>
            </select>
          </label>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {productList.pageItems.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-lbg-gray-400 font-mono">{p.id}</p>
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-lbg-green font-semibold">
                  From {formatPrice(p.price_from, p.price_unit)}
                </p>
                <p className="text-xs text-lbg-gray-500 mt-1">{p.category}</p>
              </div>
              <Badge variant={p.best_seller ? 'success' : 'neutral'}>
                {p.best_seller ? 'Best seller' : 'Active'}
              </Badge>
            </div>
            <p className="text-sm text-lbg-gray-600 mb-3 line-clamp-2">{p.tagline || p.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-lbg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-lbg-gray-400">Rating</p>
                <p className="text-lg font-bold">{p.rating.toFixed(1)}</p>
              </div>
              <div className="bg-lbg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-lbg-gray-400">Reviews</p>
                <p className="text-lg font-bold">{p.review_count}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(p)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit product
            </Button>
          </Card>
        ))}
      </div>

      {products.length > 0 ? (
          <TablePagination
            page={productList.page}
            pageSize={productList.pageSize}
            totalItems={productList.totalItems}
            totalPages={productList.totalPages}
            onPageChange={productList.setPage}
            onPageSizeChange={productList.setPageSize}
            pageSizeOptions={[9, 18, 36]}
          />
      ) : null}
      </ContentPanel>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-1">Edit {editing.title}</h3>
            <p className="text-xs text-lbg-gray-400 mb-4 font-mono">{editing.id}</p>
            <div className="space-y-3">
              <label className="block text-sm">
                Title
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.title ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                Tagline
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.tagline ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  Price from
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={form.price_from ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price_from: Number(e.target.value) }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  Category
                  <select
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={form.category ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                CTA label
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.cta_label ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.best_seller)}
                  onChange={(e) => setForm((f) => ({ ...f, best_seller: e.target.checked }))}
                />
                Best seller badge
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <Button className="flex-1" disabled={saving} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save & sync marketplace'}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
