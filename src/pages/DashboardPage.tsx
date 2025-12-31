import { useQuery } from '@tanstack/react-query';
import { fetchCells, fetchRuntimeMetrics, fetchRecentTransitions } from '@/services/genesisApi';
import { getStateStats } from '@/services/mockData';
import { MetricCard } from '@/components/genesis/MetricCard';
import { CellCard } from '@/components/genesis/CellCard';
import { CompactTimeline } from '@/components/genesis/Timeline';
import { Activity, Cpu, HardDrive, Zap, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data: cells = [] } = useQuery({ queryKey: ['cells'], queryFn: () => fetchCells() });
  const { data: metrics } = useQuery({ queryKey: ['runtime-metrics'], queryFn: fetchRuntimeMetrics });
  const { data: transitions = [] } = useQuery({ queryKey: ['recent-transitions'], queryFn: () => fetchRecentTransitions(5) });

  const stats = getStateStats();
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">GenesisCore runtime overview — read-only</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="WASM Executions" value={metrics?.wasm_executions_total.toLocaleString() ?? '—'} subtitle="Last hour: ${metrics?.wasm_executions_last_hour ?? 0}" icon={Zap} />
        <MetricCard title="Avg Exec Time" value={`${metrics?.avg_execution_time_ms.toFixed(1) ?? '—'}ms`} icon={Activity} />
        <MetricCard title="Memory Usage" value={`${metrics?.memory_usage_mb.toFixed(0) ?? '—'} MB`} icon={HardDrive} />
        <MetricCard title="Uptime" value={metrics ? formatUptime(metrics.uptime_seconds) : '—'} icon={Clock} />
      </div>

      {/* State Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        {(['CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR'] as const).map(state => (
          <div key={state} className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold font-mono">{stats[state]}</p>
            <p className="text-xs text-muted-foreground uppercase">{state}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cells */}
        <div className="space-y-3">
          <h3 className="font-semibold">Recent GenesisCells</h3>
          <div className="grid gap-3">
            {cells.slice(0, 4).map(cell => <CellCard key={cell.id} cell={cell} />)}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="font-semibold">Recent Activity</h3>
          <CompactTimeline transitions={transitions} />
        </div>
      </div>
    </div>
  );
}
