import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ValidationIssue } from '@/types/vibecode';

interface VibeCodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  issues: ValidationIssue[];
  highlightedLine: number | null;
}

const KEYWORDS = ['workflow', 'step', 'on', 'type', 'retention'];
const COMMANDS = ['set', 'increase', 'by'];
const STATES = ['CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR'];
const RETENTIONS = ['EPHEMERAL', 'LONG'];

export function VibeCodeEditor({ code, onChange, issues, highlightedLine }: VibeCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const errorLines = new Set(issues.filter(i => i.level === 'error').map(i => i.line));

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll);
      return () => textarea.removeEventListener('scroll', syncScroll);
    }
  }, [syncScroll]);

  const highlightCode = (text: string): string => {
    let result = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight keywords
    KEYWORDS.forEach(kw => {
      result = result.replace(
        new RegExp(`\\b(${kw})\\b`, 'g'),
        '<span class="text-syntax-keyword font-semibold">$1</span>'
      );
    });

    // Highlight commands
    COMMANDS.forEach(cmd => {
      result = result.replace(
        new RegExp(`\\b(${cmd})\\b`, 'g'),
        '<span class="text-syntax-command">$1</span>'
      );
    });

    // Highlight states
    STATES.forEach(state => {
      result = result.replace(
        new RegExp(`\\b(${state})\\b`, 'g'),
        '<span class="text-syntax-state font-medium">$1</span>'
      );
    });

    // Highlight retentions
    RETENTIONS.forEach(ret => {
      result = result.replace(
        new RegExp(`\\b(${ret})\\b`, 'g'),
        '<span class="text-syntax-retention">$1</span>'
      );
    });

    // Highlight numbers
    result = result.replace(
      /\b(\d+)\b/g,
      '<span class="text-syntax-number">$1</span>'
    );

    // Highlight comments
    result = result.replace(
      /(\/\/.*)/g,
      '<span class="text-syntax-comment italic">$1</span>'
    );

    return result;
  };

  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      <div className="px-4 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium">Editor VibeCode</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="w-10 bg-muted/50 border-r flex flex-col items-end py-2 px-2 text-xs font-mono text-muted-foreground select-none overflow-hidden">
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'leading-6 h-6',
                errorLines.has(idx + 1) && 'text-destructive font-bold',
                highlightedLine === idx + 1 && 'bg-primary/20 text-primary'
              )}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Editor area */}
        <div className="flex-1 relative">
          {/* Syntax highlighted display */}
          <div
            ref={highlightRef}
            className="absolute inset-0 p-2 font-mono text-sm leading-6 whitespace-pre overflow-auto pointer-events-none"
            aria-hidden="true"
          >
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-6',
                  errorLines.has(idx + 1) && 'bg-destructive/10 underline decoration-destructive decoration-wavy',
                  highlightedLine === idx + 1 && 'bg-primary/20'
                )}
                dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }}
              />
            ))}
          </div>

          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full p-2 font-mono text-sm leading-6 bg-transparent text-transparent caret-foreground resize-none focus:outline-none"
            spellCheck={false}
            placeholder="workflow MyWorkflow&#10;&#10;type ORDER&#10;retention LONG&#10;&#10;on CREATED {&#10;  set state = CANDIDATE&#10;}"
          />
        </div>
      </div>
    </div>
  );
}
