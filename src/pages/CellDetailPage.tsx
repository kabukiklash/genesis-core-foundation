import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCell, fetchCellHistory } from '@/services/genesisApi';
import { StateBadge } from '@/components/genesis/StateIndicator';
import { FrictionGauge } from '@/components/genesis/FrictionGauge';
import { RetentionBadge } from '@/components/genesis/RetentionBadge';
import { Timeline } from '@/components/genesis/Timeline';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

export default function CellDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cell } = useQuery({ queryKey: ['cell', id], queryFn: () => fetchCell(id!) });
  const { data: history = [] } = useQuery({ queryKey: ['cell-history', id], queryFn: () => fetchCellHistory(id!) });

  if (!cell) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <Link to="/cells" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to cells
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono">{cell.id}</h2>
          {cell.intent && <p className="text-muted-foreground">{cell.intent}</p>}
        </div>
        <StateBadge state={cell.state} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase">Friction</p>
          <FrictionGauge value={cell.friction} size="lg" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase">Retention</p>
          <RetentionBadge retention={cell.retention} />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase">Version</p>
          <p className="font-mono text-lg font-bold">v{cell.version}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Created</p>
          <p className="font-mono text-sm">{format(cell.created_at_ms, 'PPpp')}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase mb-1">Updated</p>
          <p className="font-mono text-sm">{format(cell.updated_at_ms, 'PPpp')}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">State History</h3>
        <Timeline transitions={history} />
      </div>
    </div>
  );
}
