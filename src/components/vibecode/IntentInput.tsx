import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntentInputProps {
  onGenerate: (intent: string) => void;
  isGenerating?: boolean;
  className?: string;
}

const EXAMPLE_INTENTS = [
  'Workflow para processar pedidos de e-commerce',
  'Célula para rastrear tickets de suporte',
  'Processo de onboarding de novo usuário',
  'Ciclo de vida de uma transação financeira',
];

export function IntentInput({ onGenerate, isGenerating = false, className }: IntentInputProps) {
  const [intent, setIntent] = useState('');

  const handleSubmit = () => {
    if (intent.trim() && !isGenerating) {
      onGenerate(intent.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setIntent(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Gerar VibeCode com IA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Descreva seu workflow em linguagem natural
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Ex: Um workflow para gerenciar ciclo de vida de pedidos, com estados para processamento, envio e entrega..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter para gerar
          </p>
        </div>

        {/* Example Intents */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Exemplos:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_INTENTS.map((example, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!intent.trim() || isGenerating}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando VibeCode...
            </>
          ) : (
            <>
              Gerar VibeCode
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* PER Notice */}
        <p className="text-xs text-center text-muted-foreground">
          O código gerado seguirá as Passive Execution Rules (PER) e será validado antes do envio.
        </p>
      </CardContent>
    </Card>
  );
}
