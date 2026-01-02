import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, PanelLeft, PanelRight } from 'lucide-react';
import { RulesPanel } from '@/components/vibecode/RulesPanel';
import { VibeCodeEditor } from '@/components/vibecode/VibeCodeEditor';
import { GenesisFeedbackPanel } from '@/components/vibecode/GenesisFeedbackPanel';
import { useVibeValidation } from '@/hooks/useVibeValidation';
import { getViolatedRules } from '@/lib/vibecode/validator';
import { ValidationIssue } from '@/types/vibecode';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const STORAGE_KEY = 'vibecode-layout';

interface LayoutState {
  leftVisible: boolean;
  rightVisible: boolean;
  leftSize: number;
  rightSize: number;
}

const DEFAULT_LAYOUT: LayoutState = {
  leftVisible: true,
  rightVisible: true,
  leftSize: 20,
  rightSize: 25,
};

function loadLayout(): LayoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_LAYOUT, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load layout:', e);
  }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: LayoutState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Failed to save layout:', e);
  }
}

export default function VibeCodePage() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [highlightedRule, setHighlightedRule] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutState>(loadLayout);

  const validation = useVibeValidation(code);
  const violatedRules = getViolatedRules(validation.issues);

  // Persist layout changes
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

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

  const toggleLeft = useCallback(() => {
    setLayout(prev => ({ ...prev, leftVisible: !prev.leftVisible }));
  }, []);

  const toggleRight = useCallback(() => {
    setLayout(prev => ({ ...prev, rightVisible: !prev.rightVisible }));
  }, []);

  const handleLayoutChange = useCallback((sizes: number[]) => {
    const [left, , right] = sizes;
    if (layout.leftVisible && left !== undefined) {
      setLayout(prev => ({ ...prev, leftSize: left }));
    }
    if (layout.rightVisible && right !== undefined) {
      setLayout(prev => ({ ...prev, rightSize: right }));
    }
  }, [layout.leftVisible, layout.rightVisible]);

  const canSubmit = validation.status !== 'ERROR';

  // Calculate panel sizes based on visibility
  const getPanelSizes = () => {
    if (layout.leftVisible && layout.rightVisible) {
      return [layout.leftSize, 100 - layout.leftSize - layout.rightSize, layout.rightSize];
    } else if (layout.leftVisible) {
      return [layout.leftSize, 100 - layout.leftSize, 0];
    } else if (layout.rightVisible) {
      return [0, 100 - layout.rightSize, layout.rightSize];
    }
    return [0, 100, 0];
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Left panel toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout.leftVisible ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleLeft}
                aria-label={layout.leftVisible ? 'Ocultar painel de regras' : 'Mostrar painel de regras'}
                aria-pressed={layout.leftVisible}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {layout.leftVisible ? 'Ocultar Regras' : 'Mostrar Regras'}
            </TooltipContent>
          </Tooltip>

          <div>
            <h1 className="text-lg font-semibold">VibeCode Framework</h1>
            <p className="text-xs text-muted-foreground">
              Editor DSL com validação PER em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button disabled={!canSubmit} size="sm" className="gap-2">
            <Send className="h-3.5 w-3.5" />
            Enviar para GenesisCore
          </Button>

          {/* Right panel toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={layout.rightVisible ? "secondary" : "ghost"}
                size="icon"
                onClick={toggleRight}
                aria-label={layout.rightVisible ? 'Ocultar painel de feedback' : 'Mostrar painel de feedback'}
                aria-pressed={layout.rightVisible}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {layout.rightVisible ? 'Ocultar Feedback' : 'Mostrar Feedback'}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main IDE Layout */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
          onLayout={handleLayoutChange}
        >
          {/* Left Panel: Rules */}
          <ResizablePanel
            defaultSize={layout.leftVisible ? layout.leftSize : 0}
            minSize={layout.leftVisible ? 15 : 0}
            maxSize={layout.leftVisible ? 35 : 0}
            collapsible
            collapsedSize={0}
            className={cn(
              'transition-all duration-300 ease-in-out',
              !layout.leftVisible && 'hidden'
            )}
          >
            <div className="h-full border-r bg-card/30">
              <ScrollArea className="h-full">
                <RulesPanel
                  violatedRules={violatedRules}
                  highlightedRule={highlightedRule}
                  onRuleClick={handleRuleClick}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>

          {layout.leftVisible && (
            <ResizableHandle 
              withHandle 
              className="bg-border/50 hover:bg-primary/20 transition-colors"
            />
          )}

          {/* Center Panel: Editor */}
          <ResizablePanel
            defaultSize={getPanelSizes()[1]}
            minSize={30}
            className="transition-all duration-300 ease-in-out"
          >
            <div className="h-full bg-background">
              <VibeCodeEditor
                code={code}
                onChange={setCode}
                issues={validation.issues}
                highlightedLine={highlightedLine}
              />
            </div>
          </ResizablePanel>

          {layout.rightVisible && (
            <ResizableHandle 
              withHandle 
              className="bg-border/50 hover:bg-primary/20 transition-colors"
            />
          )}

          {/* Right Panel: Feedback */}
          <ResizablePanel
            defaultSize={layout.rightVisible ? layout.rightSize : 0}
            minSize={layout.rightVisible ? 15 : 0}
            maxSize={layout.rightVisible ? 40 : 0}
            collapsible
            collapsedSize={0}
            className={cn(
              'transition-all duration-300 ease-in-out',
              !layout.rightVisible && 'hidden'
            )}
          >
            <div className="h-full border-l bg-card/30">
              <ScrollArea className="h-full">
                <GenesisFeedbackPanel
                  validation={validation}
                  onIssueClick={handleIssueClick}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
