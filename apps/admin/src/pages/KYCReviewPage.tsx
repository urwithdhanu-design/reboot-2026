import { useState } from 'react';
import { Check, X, Eye, FileText } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { kycQueue } from '../data/adminMockData';

export function KYCReviewPage() {
  const [selected, setSelected] = useState(kycQueue[0]?.id);
  const item = kycQueue.find((k) => k.id === selected);

  return (
    <AdminLayout>
      <PageHeader
        title="KYC Review"
        subtitle="Manual compliance review queue for customer onboarding"
        actions={<Badge variant="warning">{kycQueue.length} in queue</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {kycQueue.map((k) => (
            <Card
              key={k.id}
              className={`cursor-pointer transition-colors ${selected === k.id ? 'border-lbg-green ring-1 ring-lbg-green/20' : 'hover:border-lbg-gray-200'}`}
              padding
            >
              <button onClick={() => setSelected(k.id)} className="w-full text-left">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{k.customerName}</p>
                  <Badge variant={k.riskScore > 20 ? 'warning' : 'success'}>{k.riskScore} risk</Badge>
                </div>
                <p className="text-xs text-lbg-gray-400 mt-1">{k.step}</p>
                <p className="text-[10px] text-lbg-gray-400 mt-2">{k.submittedAt}</p>
              </button>
            </Card>
          ))}
        </div>

        {item && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{item.customerName}</h3>
                  <p className="text-sm text-lbg-gray-400">{item.email}</p>
                </div>
                <Badge variant="warning">{item.status.replace('_', ' ')}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { l: 'Current Step', v: item.step },
                  { l: 'Risk Score', v: String(item.riskScore) },
                  { l: 'Submitted', v: item.submittedAt },
                  { l: 'Documents', v: String(item.documents.length) },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-lbg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-lbg-gray-400 uppercase font-medium">{l}</p>
                    <p className="text-sm font-semibold mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-bold mb-3">Uploaded Documents</h4>
              <div className="space-y-2 mb-6">
                {item.documents.map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 bg-lbg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-lbg-green" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /> Preview</Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button className="flex-1"><Check className="w-4 h-4" /> Approve KYC</Button>
                <Button variant="danger" className="flex-1"><X className="w-4 h-4" /> Reject</Button>
                <Button variant="outline">Request More Info</Button>
              </div>
            </Card>

            <Card>
              <h4 className="text-sm font-bold mb-3">Workflow: Manual KYC Review</h4>
              <div className="flex items-center gap-2">
                {['Document Scan', 'AML Check', 'Compliance Review', 'Approved'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < 2 ? 'bg-lbg-green text-white' : i === 2 ? 'bg-amber-500 text-white' : 'bg-lbg-gray-100 text-lbg-gray-400'
                    }`}>{i + 1}</div>
                    {i < 3 && <div className={`flex-1 h-0.5 ${i < 2 ? 'bg-lbg-green' : 'bg-lbg-gray-200'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-lbg-gray-400">
                <span>Auto</span><span>Auto</span><span className="text-amber-600 font-semibold">Manual</span><span>Pending</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
