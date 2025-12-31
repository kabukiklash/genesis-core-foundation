import { SimulatedCell } from '@/types/vibecode';
import { StateBadge } from '@/components/genesis/StateIndicator';
import { FrictionGauge } from '@/components/genesis/FrictionGauge';
import { RetentionBadge } from '@/components/genesis/RetentionBadge';

interface CellPreviewProps {
  cell: SimulatedCell | null;
}

export function CellPreview({ cell }: CellPreviewProps) {
  if (!cell) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Corrija os erros para ver o preview
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">cell_id:</span>
          <code className="ml-1 font-mono text-xs">{cell.cell_id}</code>
        </div>
        <div>
          <span className="text-muted-foreground">type:</span>
          <span className="ml-1 font-medium">{cell.type}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StateBadge state={cell.state} />
        <RetentionBadge retention={cell.retention} />
      </div>

      <div>
        <span className="text-sm text-muted-foreground">Fricção:</span>
        <FrictionGauge value={cell.friction} showValue />
      </div>

      {cell.timeline.length > 0 && (
        <div>
          <span className="text-sm text-muted-foreground block mb-2">Timeline:</span>
          <div className="space-y-1">
            {cell.timeline.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1 rounded"
              >
                <span className="font-mono">{entry.event}</span>
                <div className="flex items-center gap-2">
                  <StateBadge state={entry.state} />
                  {entry.friction !== undefined && (
                    <span className="text-muted-foreground">
                      F:{entry.friction}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
