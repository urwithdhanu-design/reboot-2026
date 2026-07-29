import type { FutureFlowDiagramDef, FutureFlowStep } from '../data/futureIntegrations';
import { Card } from './ui';

function stepClass(kind: FutureFlowStep['kind']) {
  switch (kind) {
    case 'external':
      return 'future-flow-box future-flow-box--external';
    case 'decision':
      return 'future-flow-box future-flow-box--decision';
    case 'outcome':
      return 'future-flow-box future-flow-box--outcome';
    case 'data':
      return 'future-flow-box future-flow-box--data';
    default:
      return 'future-flow-box future-flow-box--platform';
  }
}

function FlowPipeline({ steps }: { steps: FutureFlowStep[] }) {
  return (
    <div className="flow-pipeline future-flow-pipeline">
      {steps.map((step, i) => (
        <span key={`${step.label}-${i}`} className="contents">
          <span className={stepClass(step.kind)}>{step.label}</span>
          {i < steps.length - 1 ? <span className="flow-arrow" aria-hidden>→</span> : null}
        </span>
      ))}
    </div>
  );
}

export function FutureFlowDiagram({ diagram }: { diagram: FutureFlowDiagramDef }) {
  return (
    <Card className="p-4 mb-4 bg-white">
      <h4 className="font-bold text-sm text-lbg-black">{diagram.title}</h4>
      <p className="text-xs text-lbg-gray-500 mt-1 mb-3">{diagram.description}</p>

      {diagram.type === 'pipeline' && diagram.steps ? (
        <FlowPipeline steps={diagram.steps} />
      ) : null}

      {diagram.type === 'lanes' && diagram.lanes ? (
        <div className="future-flow-swimlanes">
          {diagram.lanes.map((lane, laneIdx) => (
            <div key={lane.laneLabel} className="future-flow-lane">
              <p className="future-flow-lane-label">{lane.laneLabel}</p>
              <FlowPipeline steps={lane.steps} />
              {laneIdx < diagram.lanes!.length - 1 ? (
                <div className="future-flow-lane-bridge" aria-hidden>
                  <span className="future-flow-lane-bridge-line" />
                  <span className="future-flow-lane-bridge-text">feeds</span>
                  <span className="future-flow-lane-bridge-line" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
