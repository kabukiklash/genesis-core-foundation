import { cn } from '@/lib/utils';
import type { CellState } from '@/types/genesis';

interface StateIndicatorProps {
  state: CellState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const stateConfig: Record<CellState, { label: string; colorClass: string; bgClass: string }> = {
  CANDIDATE: {
    label: 'Candidate',
    colorClass: 'text-state-candidate',
    bgClass: 'bg-state-candidate/10',
  },
  RUNNING: {
    label: 'Running',
    colorClass: 'text-state-running',
    bgClass: 'bg-state-running/10',
  },
  COOLING: {
    label: 'Cooling',
    colorClass: 'text-state-cooling',
    bgClass: 'bg-state-cooling/10',
  },
  DONE: {
    label: 'Done',
    colorClass: 'text-state-done',
    bgClass: 'bg-state-done/10',
  },
  ERROR: {
    label: 'Error',
    colorClass: 'text-state-error',
    bgClass: 'bg-state-error/10',
  },
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StateIndicator({ 
  state, 
  size = 'md', 
  showLabel = true,
  className 
}: StateIndicatorProps) {
  const config = stateConfig[state];
  const isAnimated = state === 'RUNNING';
  
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span 
        className={cn(
          'rounded-full',
          sizeClasses[size],
          config.colorClass,
          'bg-current',
          isAnimated && 'animate-pulse-slow'
        )}
      />
      {showLabel && (
        <span 
          className={cn(
            'font-medium',
            textSizeClasses[size],
            config.colorClass
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}

interface StateBadgeProps {
  state: CellState;
  className?: string;
}

export function StateBadge({ state, className }: StateBadgeProps) {
  const config = stateConfig[state];
  const isAnimated = state === 'RUNNING';
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-medium',
        config.bgClass,
        config.colorClass,
        className
      )}
    >
      <span 
        className={cn(
          'h-1.5 w-1.5 rounded-full bg-current',
          isAnimated && 'animate-pulse-slow'
        )}
      />
      {state}
    </span>
  );
}
