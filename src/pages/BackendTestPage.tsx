import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, Database, FileText, Heart, Send, AlertCircle, CheckCircle2, Loader2, InfoIcon } from 'lucide-react';
import { isUsingMock, isInLovablePreview } from '@/services/genesisApi';

// Dynamic BASE_URL - uses origin for Lovable preview
const getBaseUrl = () => `${window.location.origin}/v1`;

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  statusCode?: number;
  data?: unknown;
  error?: string;
  duration?: number;
}

export default function BackendTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [lastCellId, setLastCellId] = useState<string | null>(null);
  
  // Ingest form state
  const [ingestType, setIngestType] = useState('ORDER');
  const [ingestRetention, setIngestRetention] = useState('LONG');
  const [ingestIntent, setIngestIntent] = useState('Teste via BackendTest');
  
  const BASE_URL = getBaseUrl();
  
  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };
  
  const runTest = async (
    name: string,
    endpoint: string,
    options?: RequestInit
  ) => {
    const startTime = Date.now();
    addResult({ endpoint: name, status: 'loading' });
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      // Extract cell_id from ingest response
      if (name === 'POST /gpp/ingest' && data.cell_ids?.[0]) {
        setLastCellId(data.cell_ids[0]);
      }
      
      addResult({
        endpoint: name,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data,
        duration,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      addResult({
        endpoint: name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        duration,
      });
    }
  };
  
  const testHealth = () => runTest('GET /health', '/health');
  
  const testIngest = () => runTest(
    'POST /gpp/ingest',
    '/gpp/ingest',
    {
      method: 'POST',
      body: JSON.stringify({
        type: ingestType,
        retention: ingestRetention,
        intent: ingestIntent,
      }),
    }
  );
  
  const testCells = () => runTest('GET /cells', '/cells?limit=10');
  
  const testLog = () => runTest(
    'GET /log?type=state_changed',
    '/log?type=state_changed&per_page=20&page=1'
  );
  
  const testMetrics = () => runTest('GET /metrics', '/metrics');
  
  const testCellDetail = () => {
    if (lastCellId) {
      runTest(`GET /cells/${lastCellId.slice(0, 8)}...`, `/cells/${lastCellId}`);
    }
  };
  
  const runAllTests = async () => {
    await testHealth();
    await testIngest();
    await testCells();
    await testLog();
    await testMetrics();
  };
  
  return (
    <div className="space-y-6">
      {/* Mode Indicator */}
      <Alert variant="default" className="border-blue-500/50 bg-blue-500/10">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertTitle className="flex items-center gap-2">
          🔒 Backend Offline - Usando Dados Simulados
          <Badge variant="secondary">MOCK</Badge>
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            O backend Express (<code className="bg-muted px-1 rounded">server/</code>) <strong>não roda no ambiente Lovable</strong> (preview ou publicado).
            Apenas o frontend React é servido.
          </p>
          <p className="text-sm text-muted-foreground">
            Para testar integração real com o backend, execute localmente:
          </p>
          <pre className="bg-muted p-2 rounded text-xs mt-1">
            cd server && npm install && npm run dev
          </pre>
          <p className="text-sm text-muted-foreground mt-2">
            Os botões abaixo funcionam apenas em ambiente local com o backend rodando.
          </p>
        </AlertDescription>
      </Alert>
      
      <div>
        <h1 className="text-2xl font-bold">Backend Test Console</h1>
        <p className="text-muted-foreground">
          Validação dos endpoints GenesisCore Runtime
        </p>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="font-mono text-xs">
            Base URL: {BASE_URL}
          </Badge>
          {isInLovablePreview && (
            <Badge variant="secondary" className="text-xs">
              Lovable Preview
            </Badge>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Endpoints
            </CardTitle>
            <CardDescription>
              Clique para testar cada endpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={testHealth} variant="outline" size="sm">
                <Heart className="mr-2 h-4 w-4" />
                Health
              </Button>
              <Button onClick={testCells} variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Cells
              </Button>
              <Button onClick={testLog} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Log (state_changed)
              </Button>
              <Button onClick={testMetrics} variant="outline" size="sm">
                <Activity className="mr-2 h-4 w-4" />
                Metrics
              </Button>
            </div>
            
            <Separator />
            
            {/* Ingest Form */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">POST /gpp/ingest</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={ingestType} onValueChange={setIngestType}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDER">ORDER</SelectItem>
                      <SelectItem value="PIPELINE">PIPELINE</SelectItem>
                      <SelectItem value="TASK">TASK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Retention</Label>
                  <Select value={ingestRetention} onValueChange={setIngestRetention}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LONG">LONG</SelectItem>
                      <SelectItem value="EPHEMERAL">EPHEMERAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Intent</Label>
                <Input
                  value={ingestIntent}
                  onChange={(e) => setIngestIntent(e.target.value)}
                  placeholder="Descrição do intent"
                  className="h-8"
                />
              </div>
              <Button onClick={testIngest} className="w-full" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Ingest GPP
              </Button>
            </div>
            
            {lastCellId && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Última Cell Criada
                  </Label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      {lastCellId}
                    </code>
                    <Button onClick={testCellDetail} variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <Separator />
            
            <Button onClick={runAllTests} variant="default" className="w-full">
              Rodar Todos os Testes
            </Button>
          </CardContent>
        </Card>
        
        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados</span>
              {results.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResults([])}
                  className="text-xs"
                >
                  Limpar
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Respostas JSON dos endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum teste executado ainda
              </p>
            ) : (
              results.map((result, i) => (
                <div
                  key={`${result.endpoint}-${i}`}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                    <div className="flex items-center gap-2">
                      {result.status === 'loading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {result.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-mono text-sm">{result.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.statusCode && (
                        <Badge
                          variant={result.statusCode < 400 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {result.statusCode}
                        </Badge>
                      )}
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                  {result.status !== 'loading' && (
                    <pre className="p-3 text-xs font-mono overflow-x-auto bg-card max-h-48 overflow-y-auto">
                      {result.error
                        ? `Error: ${result.error}`
                        : JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação Rápida</CardTitle>
          <CardDescription>
            Exemplos de chamadas para os endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Health Check</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`GET ${BASE_URL}/health`}
              </pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Listar Cells</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`GET ${BASE_URL}/cells`}
              </pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Ingest GPP</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`POST ${BASE_URL}/gpp/ingest
Content-Type: application/json

{
  "type": "ORDER",
  "retention": "LONG",
  "intent": "..."
}`}
              </pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Logs (State Changed)</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`GET ${BASE_URL}/log?type=state_changed`}
              </pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Métricas</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`GET ${BASE_URL}/metrics`}
              </pre>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Trends</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`GET ${BASE_URL}/metrics/trends?hours=24`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
