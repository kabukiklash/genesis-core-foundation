import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VibeRule } from '@/types/vibecode';

interface RuleCardProps {
  rule: VibeRule;
  isViolated: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export function RuleCard({ rule, isViolated, isHighlighted, onClick }: RuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:bg-accent/50',
        isViolated
          ? 'border-destructive/50 bg-destructive/10'
          : 'border-cell-done/50 bg-cell-done/10',
        isHighlighted && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-2">
        {isViolated ? (
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="h-4 w-4 text-cell-done shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium',
            isViolated ? 'text-destructive' : 'text-cell-done'
          )}>
            {rule.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rule.description}
          </p>
          <code className="text-xs text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded mt-1.5 inline-block font-mono">
            {rule.example}
          </code>
        </div>
      </div>
    </button>
  );
}
