import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-state-done' : 'text-state-error'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last hour</span>
        </div>
      )}
    </div>
  );
}

interface StatusIndicatorProps {
  status: 'online' | 'offline';
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const isOnline = status === 'online';
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'relative flex h-3 w-3',
        )}
      >
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex h-3 w-3 rounded-full',
            isOnline ? 'bg-status-online' : 'bg-status-offline'
          )}
        />
      </span>
      {label && (
        <span
          className={cn(
            'text-sm font-medium',
            isOnline ? 'text-status-online' : 'text-status-offline'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
