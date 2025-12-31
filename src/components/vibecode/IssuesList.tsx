import { AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationIssue } from '@/types/vibecode';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IssuesListProps {
  issues: ValidationIssue[];
  onIssueClick: (issue: ValidationIssue) => void;
}

export function IssuesList({ issues, onIssueClick }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Nenhum problema encontrado
      </div>
    );
  }

  const sortedIssues = [...issues].sort((a, b) => {
    if (a.level === 'error' && b.level !== 'error') return -1;
    if (a.level !== 'error' && b.level === 'error') return 1;
    return a.line - b.line;
  });

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {sortedIssues.map((issue, idx) => (
          <button
            key={`${issue.ruleId}-${issue.line}-${idx}`}
            onClick={() => onIssueClick(issue)}
            className={cn(
              'w-full text-left p-2 rounded border transition-colors',
              'hover:bg-accent/50',
              issue.level === 'error'
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-cell-running/30 bg-cell-running/5'
            )}
          >
            <div className="flex items-start gap-2">
              {issue.level === 'error' ? (
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-cell-running shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-1 rounded font-mono">
                    L{issue.line}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {issue.ruleId}
                  </span>
                </div>
                <p className="text-sm mt-0.5 truncate">
                  {issue.message}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
