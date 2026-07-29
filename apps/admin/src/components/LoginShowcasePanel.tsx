import { useState } from 'react';
import { BarChart3, GitBranch } from 'lucide-react';
import { PlatformFlowHero } from './PlatformFlowHero';
import { UkMarketHeatmap } from './UkMarketHeatmap';

type ShowcaseTab = 'flows' | 'heatmap';

const TABS: { id: ShowcaseTab; label: string; icon: typeof GitBranch }[] = [
  { id: 'flows', label: 'Platform flows', icon: GitBranch },
  { id: 'heatmap', label: 'UK market heatmap', icon: BarChart3 },
];

export function LoginShowcasePanel({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<ShowcaseTab>('flows');

  return (
    <div className={`login-showcase${compact ? ' login-showcase--compact' : ''}`}>
      <div className="login-showcase-tabs" role="tablist" aria-label="Login showcase">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`login-showcase-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`login-showcase-panel-${id}`}
            className={`login-showcase-tab${tab === id ? ' login-showcase-tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {compact ? (id === 'flows' ? 'Flows' : 'Heatmap') : label}
          </button>
        ))}
      </div>

      <div className="login-showcase-body">
        {tab === 'flows' ? (
          <div
            id="login-showcase-panel-flows"
            role="tabpanel"
            aria-labelledby="login-showcase-tab-flows"
            className="login-showcase-panel"
          >
            <PlatformFlowHero compact={compact} />
          </div>
        ) : (
          <div
            id="login-showcase-panel-heatmap"
            role="tabpanel"
            aria-labelledby="login-showcase-tab-heatmap"
            className="login-showcase-panel"
          >
            <UkMarketHeatmap compact={compact} />
          </div>
        )}
      </div>
    </div>
  );
}
