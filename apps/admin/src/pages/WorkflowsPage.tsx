import { useState } from 'react';
import { Zap, User, GitMerge, Play, Pause, Settings } from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card, PageHeader, Badge, Button } from '../components/ui';
import { workflows, workflowRuns } from '../data/adminMockData';

const typeIcon = { automated: Zap, manual: User, hybrid: GitMerge };
const typeBadge = { automated: 'success', manual: 'warning', hybrid: 'purple' } as const;
const statusBadge = {
  running: 'info', completed: 'success', failed: 'error', awaiting_review: 'warning', paused: 'neutral',
} as const;

export function WorkflowsPage() {
  const [tab, setTab] = useState<'definitions' | 'runs'>('definitions');

  return (
    <AdminLayout>
      <PageHeader
        title="Workflow Engine"
        subtitle="Automated and manual process orchestration"
        actions={<Button size="sm"><Settings className="w-4 h-4" /> Configure</Button>}
      />

      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'definitions' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('definitions')}>
          Workflow Definitions
        </Button>
        <Button variant={tab === 'runs' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('runs')}>
          Active Runs ({workflowRuns.filter((r) => r.status !== 'completed').length})
        </Button>
      </div>

      {tab === 'definitions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => {
            const Icon = typeIcon[wf.type];
            return (
              <Card key={wf.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      wf.type === 'automated' ? 'bg-lbg-green-light' : wf.type === 'manual' ? 'bg-amber-50' : 'bg-purple-50'
                    }`}>
                      <Icon className={`w-5 h-5 ${wf.type === 'automated' ? 'text-lbg-green' : wf.type === 'manual' ? 'text-amber-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{wf.name}</p>
                      <Badge variant={typeBadge[wf.type]}>{wf.type}</Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={wf.enabled}
                    aria-label={`${wf.enabled ? 'Disable' : 'Enable'} ${wf.name}`}
                    className={`w-10 h-5 rounded-full transition-colors ${wf.enabled ? 'bg-lbg-green' : 'bg-lbg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${wf.enabled ? 'translate-x-5' : ''}`} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-sm text-lbg-gray-600 mb-4">{wf.description}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { l: 'Trigger', v: wf.trigger },
                    { l: 'Steps', v: String(wf.steps) },
                    { l: 'Active', v: String(wf.activeRuns) },
                    { l: 'Success', v: `${wf.successRate}%` },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-lbg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-lbg-gray-400">{l}</p>
                      <p className="text-xs font-semibold mt-0.5 truncate" title={v}>{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-lbg-gray-400 mt-3">Last run: {wf.lastRun}</p>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {workflowRuns.map((run) => (
            <Card key={run.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                run.status === 'awaiting_review' ? 'bg-amber-500' :
                run.status === 'completed' ? 'bg-lbg-green' : 'bg-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{run.workflowName}</p>
                  <Badge variant={typeBadge[run.type]}>{run.type}</Badge>
                  <Badge variant={statusBadge[run.status]}>{run.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-lbg-gray-400 mt-1">
                  {run.customerName} · Step: {run.currentStep}
                  {run.assignee && ` · Assigned: ${run.assignee}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-lbg-gray-400">Started {run.startedAt}</p>
                {run.completedAt && <p className="text-xs text-lbg-green">Completed {run.completedAt}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {run.status === 'awaiting_review' && <Button size="sm">Take Action</Button>}
                {run.status === 'running' && <Button variant="outline" size="sm"><Pause className="w-3 h-3" /></Button>}
                {run.status === 'failed' && <Button size="sm"><Play className="w-3 h-3" /> Retry</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
