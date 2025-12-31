import { cn } from '@/lib/utils';
import type { RetentionType } from '@/types/genesis';
import { Clock, Database } from 'lucide-react';

interface RetentionBadgeProps {
  retention: RetentionType;
  className?: string;
}

const retentionConfig: Record<RetentionType, { label: string; icon: typeof Clock; className: string }> = {
  EPHEMERAL: {
    label: 'Ephemeral',
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  },
  LONG: {
    label: 'Long-term',
    icon: Database,
    className: 'bg-primary/10 text-primary',
  },
};

export function RetentionBadge({ retention, className }: RetentionBadgeProps) {
  const config = retentionConfig[retention];
  const Icon = config.icon;
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
