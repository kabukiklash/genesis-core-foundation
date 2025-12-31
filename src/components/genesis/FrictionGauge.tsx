import { cn } from '@/lib/utils';

interface FrictionGaugeProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { height: 'h-1.5', width: 'w-16', text: 'text-xs' },
  md: { height: 'h-2', width: 'w-24', text: 'text-sm' },
  lg: { height: 'h-3', width: 'w-32', text: 'text-base' },
};

function getFrictionColor(value: number): string {
  if (value <= 33) return 'bg-friction-low';
  if (value <= 66) return 'bg-friction-medium';
  return 'bg-friction-high';
}

function getFrictionTextColor(value: number): string {
  if (value <= 33) return 'text-friction-low';
  if (value <= 66) return 'text-friction-medium';
  return 'text-friction-high';
}

export function FrictionGauge({ 
  value, 
  size = 'md', 
  showValue = true,
  className 
}: FrictionGaugeProps) {
  const config = sizeConfig[size];
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn(
          'relative overflow-hidden rounded-full bg-muted',
          config.height,
          config.width
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            getFrictionColor(normalizedValue)
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      {showValue && (
        <span 
          className={cn(
            'font-mono font-medium tabular-nums',
            config.text,
            getFrictionTextColor(normalizedValue)
          )}
        >
          {normalizedValue}
        </span>
      )}
    </div>
  );
}

interface FrictionBadgeProps {
  value: number;
  className?: string;
}

export function FrictionBadge({ value, className }: FrictionBadgeProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const level = normalizedValue <= 33 ? 'low' : normalizedValue <= 66 ? 'medium' : 'high';
  
  const levelConfig = {
    low: { bg: 'bg-friction-low/10', text: 'text-friction-low', label: 'Low' },
    medium: { bg: 'bg-friction-medium/10', text: 'text-friction-medium', label: 'Med' },
    high: { bg: 'bg-friction-high/10', text: 'text-friction-high', label: 'High' },
  };
  
  const config = levelConfig[level];
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs',
        config.bg,
        config.text,
        className
      )}
    >
      <span className="font-medium tabular-nums">{normalizedValue}</span>
      <span className="opacity-70">/ {config.label}</span>
    </span>
  );
}
