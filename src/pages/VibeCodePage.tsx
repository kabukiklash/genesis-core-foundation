import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { RulesPanel } from '@/components/vibecode/RulesPanel';
import { VibeCodeEditor } from '@/components/vibecode/VibeCodeEditor';
import { GenesisFeedbackPanel } from '@/components/vibecode/GenesisFeedbackPanel';
import { useVibeValidation } from '@/hooks/useVibeValidation';
import { getViolatedRules } from '@/lib/vibecode/validator';
import { ValidationIssue } from '@/types/vibecode';

const INITIAL_CODE = `workflow OrderProcessing

type ORDER
retention LONG

on CREATED {
  set state = CANDIDATE
  set friction = 5
}

on PROCESSING_STARTED {
  set state = RUNNING
  increase friction by 20
}

on COMPLETED {
  set state = COOLING
}

on CLOSED {
  set state = DONE
}`;

export default function VibeCodePage() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [highlightedRule, setHighlightedRule] = useState<string | null>(null);

  const validation = useVibeValidation(code);
  const violatedRules = getViolatedRules(validation.issues);

  const handleIssueClick = useCallback((issue: ValidationIssue) => {
    setHighlightedLine(issue.line);
    setHighlightedRule(issue.ruleId);
    setTimeout(() => {
      setHighlightedLine(null);
      setHighlightedRule(null);
    }, 2000);
  }, []);

  const handleRuleClick = useCallback((ruleId: string) => {
    const relatedIssue = validation.issues.find(i => i.ruleId === ruleId);
    if (relatedIssue) {
      setHighlightedLine(relatedIssue.line);
    }
    setHighlightedRule(ruleId);
    setTimeout(() => {
      setHighlightedLine(null);
      setHighlightedRule(null);
    }, 2000);
  }, [validation.issues]);

  const canSubmit = validation.status !== 'ERROR';

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">VibeCode Framework</h1>
          <p className="text-sm text-muted-foreground">
            Editor DSL com validação PER em tempo real
          </p>
        </div>
        <Button disabled={!canSubmit} className="gap-2">
          <Send className="h-4 w-4" />
          Enviar para GenesisCore
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-4 min-h-0">
        {/* Left Column: Rules */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <RulesPanel
            violatedRules={violatedRules}
            highlightedRule={highlightedRule}
            onRuleClick={handleRuleClick}
          />
        </div>

        {/* Center Column: Editor */}
        <div className="min-h-[400px] lg:min-h-0">
          <VibeCodeEditor
            code={code}
            onChange={setCode}
            issues={validation.issues}
            highlightedLine={highlightedLine}
          />
        </div>

        {/* Right Column: Feedback */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <GenesisFeedbackPanel
            validation={validation}
            onIssueClick={handleIssueClick}
          />
        </div>
      </div>
    </div>
  );
}
