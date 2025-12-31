import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationStatus } from '@/types/vibecode';

interface StatusBadgeProps {
  status: ValidationStatus;
}

const statusConfig = {
  VALID: {
    icon: CheckCircle,
    label: 'VÁLIDO',
    className: 'bg-cell-done/20 text-cell-done border-cell-done/50',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'AVISOS',
    className: 'bg-cell-running/20 text-cell-running border-cell-running/50',
  },
  ERROR: {
    icon: XCircle,
    label: 'INVÁLIDO',
    className: 'bg-destructive/20 text-destructive border-destructive/50',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center justify-center gap-2 py-3 px-4 rounded-lg border',
      config.className
    )}>
      <Icon className="h-5 w-5" />
      <span className="font-semibold">{config.label}</span>
    </div>
  );
}
