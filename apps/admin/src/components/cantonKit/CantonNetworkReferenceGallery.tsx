import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Badge, Card } from '../ui';
import { CANTON_NETWORK_REFERENCE_DIAGRAMS, type CantonNetworkReferenceDiagram } from '../../data/cantonKitBlueprint';

const DIAGRAM_COUNT = CANTON_NETWORK_REFERENCE_DIAGRAMS.length;

function ReferenceCard({
  diagram,
  index,
  showIndex,
  onExpand,
}: {
  diagram: CantonNetworkReferenceDiagram;
  index: number;
  showIndex: boolean;
  onExpand: () => void;
}) {
  const isDark = diagram.theme === 'dark';

  return (
    <Card className={`kit-reference-card overflow-hidden ${isDark ? 'kit-reference-card--dark' : ''}`}>
      <div className="kit-reference-card-head">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {showIndex ? (
              <Badge variant="neutral">Diagram {index + 1} of {DIAGRAM_COUNT}</Badge>
            ) : null}
            <h3 className="font-bold text-sm sm:text-base">{diagram.title}</h3>
          </div>
          <p className="text-xs sm:text-sm mt-1 kit-reference-caption">{diagram.caption}</p>
        </div>
        <button
          type="button"
          className="kit-reference-expand-btn"
          onClick={onExpand}
          aria-label={`Expand ${diagram.title}`}
        >
          <Maximize2 className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <button type="button" className="kit-reference-img-btn" onClick={onExpand} aria-label={`View ${diagram.title}`}>
        <img src={diagram.imagePath} alt={diagram.title} className="kit-reference-img" loading="lazy" />
      </button>
    </Card>
  );
}

export function CantonNetworkReferenceGallery({ showIndex = false }: { showIndex?: boolean }) {
  const [expanded, setExpanded] = useState<CantonNetworkReferenceDiagram | null>(null);

  return (
    <section className="kit-reference-gallery" aria-labelledby="canton-reference-heading">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="canton-reference-heading" className="font-bold text-lbg-black text-lg">
            Canton network reference
          </h2>
          <Badge variant="success">{DIAGRAM_COUNT} diagrams</Badge>
        </div>
        <p className="text-sm text-lbg-gray-600 mt-1">
          All {DIAGRAM_COUNT} reference architecture views: interoperability backbone, virtual shared system of record
          (participant nodes and domain model), multi-provider trading, and network-of-networks topology.
        </p>
      </div>

      <div className="kit-reference-grid">
        {CANTON_NETWORK_REFERENCE_DIAGRAMS.map((diagram, index) => (
          <ReferenceCard
            key={diagram.id}
            diagram={diagram}
            index={index}
            showIndex={showIndex}
            onExpand={() => setExpanded(diagram)}
          />
        ))}
      </div>

      {expanded ? (
        <div
          className="kit-reference-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={expanded.title}
          onClick={() => setExpanded(null)}
        >
          <div className="kit-reference-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="kit-reference-lightbox-head">
              <div>
                <p className="font-bold">{expanded.title}</p>
                <p className="text-sm text-lbg-gray-500 mt-0.5">{expanded.caption}</p>
              </div>
              <button
                type="button"
                className="kit-reference-expand-btn"
                onClick={() => setExpanded(null)}
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <img
              src={expanded.imagePath}
              alt={expanded.title}
              className={`kit-reference-lightbox-img ${expanded.theme === 'dark' ? 'kit-reference-lightbox-img--dark' : ''}`}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
