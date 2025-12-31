import { useQuery } from '@tanstack/react-query';
import { fetchRuntimeMetrics, fetchRuntimeTrends } from '@/services/genesisApi';
import { MetricCard, StatusIndicator } from '@/components/genesis/MetricCard';
import { Activity, Cpu, HardDrive, Zap, Clock, Code } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function RuntimePage() {
  const { data: metrics } = useQuery({ queryKey: ['runtime-metrics'], queryFn: fetchRuntimeMetrics });
  const { data: trends = [] } = useQuery({ queryKey: ['runtime-trends'], queryFn: () => fetchRuntimeTrends(24) });

  const chartData = trends.map(t => ({
    time: format(t.timestamp_ms, 'HH:mm'),
    executions: t.executions,
    avgTime: Math.round(t.avg_time_ms),
    memory: Math.round(t.memory_mb),
  }));

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Runtime Metrics</h2>
          <p className="text-muted-foreground">WASM execution and system health</p>
        </div>
        <StatusIndicator status={metrics?.status || 'offline'} label={metrics?.status === 'online' ? 'Online' : 'Offline'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Total Executions" value={metrics?.wasm_executions_total.toLocaleString() ?? '—'} icon={Zap} />
        <MetricCard title="Last Hour" value={metrics?.wasm_executions_last_hour ?? '—'} icon={Activity} />
        <MetricCard title="Avg Time" value={`${metrics?.avg_execution_time_ms.toFixed(1) ?? '—'}ms`} icon={Clock} />
        <MetricCard title="Memory" value={`${metrics?.memory_usage_mb.toFixed(0) ?? '—'} MB`} icon={HardDrive} />
        <MetricCard title="Active Scripts" value={metrics?.active_scripts ?? '—'} icon={Code} />
        <MetricCard title="Uptime" value={metrics ? formatUptime(metrics.uptime_seconds) : '—'} icon={Cpu} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Executions (24h)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="executions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
