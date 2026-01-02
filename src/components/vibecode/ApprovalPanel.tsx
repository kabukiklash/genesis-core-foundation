import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Send, 
  Sparkles,
  FileCode,
  Clock,
  Shield
} from 'lucide-react';
import { ValidationResult, SimulatedCell } from '@/types/vibecode';
import { cn } from '@/lib/utils';

interface ApprovalPanelProps {
  isOpen: boolean;
  generatedCode: string;
  validation: ValidationResult;
  intent?: string;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

export function ApprovalPanel({
  isOpen,
  generatedCode,
  validation,
  intent,
  onApprove,
  onReject,
  onEdit,
  isSubmitting = false,
}: ApprovalPanelProps) {
  const [showFullCode, setShowFullCode] = useState(false);
  
  if (!isOpen) return null;

  const canApprove = validation.status !== 'ERROR';
  const hasWarnings = validation.status === 'WARNING';
  const simulatedCell = validation.simulatedCell;

  const codeLines = generatedCode.split('\n');
  const previewLines = showFullCode ? codeLines : codeLines.slice(0, 10);
  const hasMoreLines = codeLines.length > 10;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Revisão de Código Gerado por IA</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Filosofia PER: Passive, Explained, Reviewable
                </p>
              </div>
            </div>
            <Badge 
              variant={validation.status === 'VALID' ? 'default' : validation.status === 'WARNING' ? 'secondary' : 'destructive'}
              className="gap-1"
            >
              {validation.status === 'VALID' && <CheckCircle2 className="h-3 w-3" />}
              {validation.status === 'WARNING' && <AlertTriangle className="h-3 w-3" />}
              {validation.status === 'ERROR' && <XCircle className="h-3 w-3" />}
              {validation.status}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <ScrollArea className="flex-1 min-h-0">
          <CardContent className="pt-4 space-y-4">
            {/* Intent Section */}
            {intent && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  Intent Original
                </div>
                <p className="text-sm text-muted-foreground italic">"{intent}"</p>
              </div>
            )}

            {/* Generated Code Preview */}
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-sm font-medium">Código VibeCode Gerado</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFullCode(!showFullCode)}
                  className="h-7 text-xs gap-1"
                >
                  <Eye className="h-3 w-3" />
                  {showFullCode ? 'Recolher' : `Ver tudo (${codeLines.length} linhas)`}
                </Button>
              </div>
              <pre className="p-3 text-sm font-mono overflow-x-auto">
                {previewLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="w-8 text-muted-foreground text-right pr-3 select-none">
                      {i + 1}
                    </span>
                    <code>{line}</code>
                  </div>
                ))}
                {!showFullCode && hasMoreLines && (
                  <div className="text-muted-foreground text-center mt-2">
                    ... mais {codeLines.length - 10} linhas
                  </div>
                )}
              </pre>
            </div>

            {/* Validation Issues */}
            {validation.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Problemas Detectados ({validation.issues.length})
                </h4>
                <div className="space-y-1">
                  {validation.issues.map((issue, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "text-sm px-3 py-2 rounded-md flex items-start gap-2",
                        issue.level === 'error' 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      )}
                    >
                      {issue.level === 'error' ? (
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">Linha {issue.line}:</span>{' '}
                        {issue.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Cell Preview */}
            {simulatedCell && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  GenesisCell Simulada
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{' '}
                    <Badge variant="outline">{simulatedCell.type}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado Final:</span>{' '}
                    <Badge variant="outline">{simulatedCell.state}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fricção:</span>{' '}
                    <span className="font-mono">{simulatedCell.friction}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retenção:</span>{' '}
                    <Badge variant="outline">{simulatedCell.retention}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* PER Compliance Notice */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-primary">Conformidade PER</span>
                  <p className="text-muted-foreground mt-1">
                    Este código foi gerado seguindo as Passive Execution Rules. 
                    Ele apenas define estados e fricção — não executa lógica ativa.
                    Sua aprovação é necessária antes do envio ao GenesisCore.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </ScrollArea>

        <Separator />

        <CardFooter className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={onReject}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={onEdit}
              disabled={isSubmitting}
            >
              <Eye className="h-4 w-4 mr-2" />
              Editar Manualmente
            </Button>
            <Button 
              onClick={onApprove}
              disabled={!canApprove || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Aprovar e Enviar
                </>
              )}
            </Button>
          </div>
        </CardFooter>

        {/* Warning for issues */}
        {hasWarnings && canApprove && (
          <div className="px-6 pb-4">
            <p className="text-xs text-center text-muted-foreground">
              ⚠️ Existem avisos. Você pode aprovar, mas considere revisar.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
