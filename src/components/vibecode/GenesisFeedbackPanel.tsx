import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from './StatusBadge';
import { IssuesList } from './IssuesList';
import { CellPreview } from './CellPreview';
import { SimulatedLogTabs } from './SimulatedLogTabs';
import { ValidationResult, ValidationIssue } from '@/types/vibecode';

interface GenesisFeedbackPanelProps {
  validation: ValidationResult;
  onIssueClick: (issue: ValidationIssue) => void;
}

export function GenesisFeedbackPanel({ validation, onIssueClick }: GenesisFeedbackPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">GenesisCore Feedback</h2>
          <StatusBadge status={validation.status} />
        </div>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              Issues ({validation.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <IssuesList issues={validation.issues} onIssueClick={onIssueClick} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Preview GenesisCell</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CellPreview cell={validation.simulatedCell} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Log Simulado</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SimulatedLogTabs
              logs={validation.simulatedLog}
              cell={validation.simulatedCell}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
