import { ScrollArea } from '@/components/ui/scroll-area';
import { RuleCard } from './RuleCard';
import { PER_RULES } from '@/lib/vibecode/rules';

interface RulesPanelProps {
  violatedRules: Set<string>;
  highlightedRule: string | null;
  onRuleClick: (ruleId: string) => void;
}

export function RulesPanel({ violatedRules, highlightedRule, onRuleClick }: RulesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Regras VibeCode</h2>
        <p className="text-xs text-muted-foreground mt-1">
          PER - Passive Execution Rules
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {PER_RULES.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isViolated={violatedRules.has(rule.id)}
              isHighlighted={highlightedRule === rule.id}
              onClick={() => onRuleClick(rule.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
