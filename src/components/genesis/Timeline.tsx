import { cn } from '@/lib/utils';
import type { StateTransition, CellState } from '@/types/genesis';
import { formatDistanceToNow, format } from 'date-fns';

interface TimelineProps {
  transitions: StateTransition[];
  className?: string;
}

const stateColors: Record<CellState, string> = {
  CANDIDATE: 'bg-state-candidate',
  RUNNING: 'bg-state-running',
  COOLING: 'bg-state-cooling',
  DONE: 'bg-state-done',
  ERROR: 'bg-state-error',
};

const stateTextColors: Record<CellState, string> = {
  CANDIDATE: 'text-state-candidate',
  RUNNING: 'text-state-running',
  COOLING: 'text-state-cooling',
  DONE: 'text-state-done',
  ERROR: 'text-state-error',
};

export function Timeline({ transitions, className }: TimelineProps) {
  if (transitions.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No state transitions recorded
      </div>
    );
  }

  // Sort by timestamp descending (most recent first)
  const sortedTransitions = [...transitions].sort(
    (a, b) => b.timestamp_ms - a.timestamp_ms
  );

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {sortedTransitions.map((transition, index) => (
          <TimelineItem
            key={transition.id}
            transition={transition}
            isFirst={index === 0}
            isLast={index === sortedTransitions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  transition: StateTransition;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineItem({ transition, isFirst }: TimelineItemProps) {
  const timeAgo = formatDistanceToNow(transition.timestamp_ms, { addSuffix: true });
  const fullTime = format(transition.timestamp_ms, 'MMM d, yyyy HH:mm:ss');

  return (
    <div className="relative flex items-start gap-4 pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-2.5 h-3 w-3 rounded-full border-2 border-background',
          stateColors[transition.to_state],
          isFirst && 'ring-4 ring-primary/20'
        )}
      />

      <div className="flex-1 rounded-lg border bg-card p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {transition.from_state ? (
                <>
                  <span className={cn('font-mono text-sm', stateTextColors[transition.from_state])}>
                    {transition.from_state}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn('font-mono text-sm font-medium', stateTextColors[transition.to_state])}>
                    {transition.to_state}
                  </span>
                </>
              ) : (
                <span className={cn('font-mono text-sm font-medium', stateTextColors[transition.to_state])}>
                  Created as {transition.to_state}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Friction at transition: <span className="font-mono">{transition.friction_at_transition}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{timeAgo}</p>
            <p className="text-xs text-muted-foreground font-mono">{fullTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CompactTimelineProps {
  transitions: StateTransition[];
  maxItems?: number;
  className?: string;
}

export function CompactTimeline({ transitions, maxItems = 5, className }: CompactTimelineProps) {
  const sortedTransitions = [...transitions]
    .sort((a, b) => b.timestamp_ms - a.timestamp_ms)
    .slice(0, maxItems);

  return (
    <div className={cn('space-y-2', className)}>
      {sortedTransitions.map((transition) => (
        <div
          key={transition.id}
          className="flex items-center justify-between p-2 rounded border bg-card/50 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', stateColors[transition.to_state])} />
            <span className="font-mono text-muted-foreground">
              {transition.cell_id.slice(0, 12)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={cn('font-mono font-medium', stateTextColors[transition.to_state])}>
              {transition.to_state}
            </span>
          </div>
          <span className="text-muted-foreground">
            {formatDistanceToNow(transition.timestamp_ms, { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
