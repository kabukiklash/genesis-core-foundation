import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StateBadge } from './StateIndicator';
import { FrictionGauge } from './FrictionGauge';
import { RetentionBadge } from './RetentionBadge';
import type { GenesisCell } from '@/types/genesis';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';

interface CellCardProps {
  cell: GenesisCell;
  className?: string;
}

export function CellCard({ cell, className }: CellCardProps) {
  const updatedAgo = formatDistanceToNow(cell.updated_at_ms, { addSuffix: true });
  const createdAgo = formatDistanceToNow(cell.created_at_ms, { addSuffix: true });
  
  return (
    <Link to={`/cells/${cell.id}`}>
      <Card 
        className={cn(
          'group transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer',
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-mono text-sm font-medium text-foreground">
                {cell.id}
              </p>
              {cell.intent && (
                <p className="text-xs text-muted-foreground">
                  {cell.intent}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <StateBadge state={cell.state} />
            <RetentionBadge retention={cell.retention} />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Friction</span>
              <span className="font-mono">{cell.friction}/100</span>
            </div>
            <FrictionGauge value={cell.friction} size="sm" showValue={false} />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span>v{cell.version}</span>
            <span title={`Created ${createdAgo}`}>Updated {updatedAgo}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface CellListItemProps {
  cell: GenesisCell;
  className?: string;
}

export function CellListItem({ cell, className }: CellListItemProps) {
  const updatedAgo = formatDistanceToNow(cell.updated_at_ms, { addSuffix: true });
  
  return (
    <Link to={`/cells/${cell.id}`}>
      <div 
        className={cn(
          'group flex items-center justify-between p-3 rounded-lg border bg-card',
          'transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 cursor-pointer',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <StateBadge state={cell.state} />
          <div>
            <p className="font-mono text-sm font-medium">{cell.id}</p>
            {cell.intent && (
              <p className="text-xs text-muted-foreground">{cell.intent}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <FrictionGauge value={cell.friction} size="sm" />
          <RetentionBadge retention={cell.retention} />
          <span className="text-xs text-muted-foreground w-24 text-right">
            {updatedAgo}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
