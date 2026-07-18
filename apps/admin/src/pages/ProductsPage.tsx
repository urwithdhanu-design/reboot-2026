import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { formatGBP } from '../data/adminMockData';

const products = [
  { id: 'home', name: 'Home Insurance', icon: '🏠', from: 18.99, active: 8420, features: 3 },
  { id: 'vehicle', name: 'Motor Insurance', icon: '🚗', from: 32.5, active: 11250, features: 3 },
  { id: 'pet', name: 'Pet Insurance', icon: '🐾', from: 12.99, active: 5680, features: 3 },
  { id: 'travel', name: 'Travel Insurance', icon: '✈️', from: 8.5, active: 4210, features: 3 },
  { id: 'life', name: 'Life Insurance', icon: '🛡️', from: 9.99, active: 2890, features: 3 },
  { id: 'health', name: 'Private Health', icon: '❤️', from: 24.99, active: 1841, features: 3 },
];

export function ProductsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Insurance Products"
        subtitle="Configure product catalogue and pricing"
        actions={<Button size="sm">Add Product</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-lbg-green font-semibold">From {formatGBP(p.from)}/mo</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-lbg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-lbg-gray-400">Active Policies</p>
                <p className="text-lg font-bold">{p.active.toLocaleString()}</p>
              </div>
              <div className="bg-lbg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-lbg-gray-400">Features</p>
                <p className="text-lg font-bold">{p.features}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              <Button variant="ghost" size="sm" className="flex-1">Quote Rules</Button>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
