import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/services/genesisApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Brain,
    Play,
    Terminal,
    FileText,
    Activity,
    Info,
    Clock,
    Layers,
    Database,
    X,
    Wifi,
    WifiOff,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface CognitiveResponse {
    ok: boolean;
    cql: {
        version: string;
        ast: any;
    };
    crm: {
        layers_used: string[];
        provenance: {
            cells: { source: string; count: number };
            events: { source: string; count: number; window?: string };
        };
    };
    result: {
        format: string;
        data: any;
        text: string;
    };
    error?: {
        code: string;
        message: string;
    };
}

export default function CognitivePage() {
    const [query, setQuery] = useState('FROM cells SELECT id, state INTERPRET INTERPRETIVE RENDER json');

    // Live Streaming State
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamConfig, setStreamConfig] = useState({
        mode: 'DESCRIPTIVE',
        window_s: '60',
        scope: 'global',
        sample_ms: '5000'
    });
    const [latestStreamResult, setLatestStreamResult] = useState<any>(null);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);

    const mutation = useMutation({
        mutationFn: async (cql: string) => {
            const response = await fetch(`${getApiBaseUrl()}/cognitive/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: cql,
                    context: {
                        timezone: 'America/Sao_Paulo',
                        locale: 'pt-BR',
                        now_ms: Date.now()
                    },
                    limits: {
                        max_cells: 5000,
                        max_events: 20000,
                        time_range_days: 90,
                        max_tokens: 1500
                    }
                }),
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data as CognitiveResponse;
        },
        onSuccess: () => {
            toast.success('Query cognitiva executada com sucesso');
        },
        onError: (error: any) => {
            toast.error(`Erro: ${error.error?.code || 'Falha na consulta'}`);
        }
    });

    const runQuery = () => {
        if (isStreaming) stopStream();
        mutation.mutate(query);
    };

    const startStream = () => {
        if (eventSource) eventSource.close();

        const url = new URL(`${getApiBaseUrl()}/cognitive/stream`);
        url.searchParams.set('mode', streamConfig.mode);
        url.searchParams.set('window_s', streamConfig.window_s);
        url.searchParams.set('scope', streamConfig.scope);
        url.searchParams.set('sample_ms', streamConfig.sample_ms);

        const es = new EventSource(url.toString());

        es.addEventListener('COGNITIVE_UPDATE', (event) => {
            try {
                const data = JSON.parse(event.data);
                setLatestStreamResult(data);
            } catch (e) {
                console.error('Failed to parse stream data', e);
            }
        });

        es.onerror = (err) => {
            console.error('SSE Error', err);
            toast.error('Erro na conexão do live stream');
            stopStream();
        };

        setEventSource(es);
        setIsStreaming(true);
        toast.info(`Live stream iniciado: ${streamConfig.mode}`);
    };

    const stopStream = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }
        setIsStreaming(false);
        toast.info('Live stream interrompido');
    };

    useEffect(() => {
        return () => {
            if (eventSource) eventSource.close();
        };
    }, []);

    // Unify display logic
    const activeResult = isStreaming ? latestStreamResult : mutation.data?.result;
    const activeCrm = isStreaming ? latestStreamResult?.crm : mutation.data?.crm;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cognitive Engine</h2>
                    <p className="text-muted-foreground">
                        Execute CQL ou monitore streams ao vivo para interpretar o estado do runtime.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" /> Fase 5.4 - Live
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                        Read-Only • EFÊMERO
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Side */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-primary/20 bg-card/50 backdrop-blur">
                        <CardHeader className="pb-3 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Terminal className="h-4 w-4" /> Modo de Operação
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="live-mode" className="text-[10px] uppercase font-bold text-muted-foreground">Static</Label>
                                    <Switch
                                        id="live-mode"
                                        checked={isStreaming}
                                        onCheckedChange={(checked) => checked ? startStream() : stopStream()}
                                    />
                                    <Label htmlFor="live-mode" className="text-[10px] uppercase font-bold text-primary">Live</Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {!isStreaming ? (
                                <>
                                    <Textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="FROM cells SELECT ..."
                                        className="font-mono h-[250px] bg-background/50 text-sm border-primary/10 transition-all focus:border-primary"
                                    />
                                    <Button
                                        onClick={runQuery}
                                        disabled={mutation.isPending}
                                        className="w-full gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    >
                                        <Play className="h-4 w-4" /> {mutation.isPending ? 'Executando...' : 'Rodar Query'}
                                    </Button>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-left duration-300">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Interpretation Mode</Label>
                                        <Select value={streamConfig.mode} onValueChange={(v) => setStreamConfig({ ...streamConfig, mode: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DESCRIPTIVE">DESCRIPTIVE (Raw + Filter)</SelectItem>
                                                <SelectItem value="INTERPRETIVE">INTERPRETIVE (Aggregates)</SelectItem>
                                                <SelectItem value="NARRATIVE">NARRATIVE (Storytelling)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Time Window</Label>
                                        <Select value={streamConfig.window_s} onValueChange={(v) => setStreamConfig({ ...streamConfig, window_s: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 seconds</SelectItem>
                                                <SelectItem value="60">60 seconds</SelectItem>
                                                <SelectItem value="120">120 seconds</SelectItem>
                                                <SelectItem value="300">300 seconds</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Observation Scope</Label>
                                        <Select value={streamConfig.scope} onValueChange={(v) => setStreamConfig({ ...streamConfig, scope: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="global">Global</SelectItem>
                                                <SelectItem value="cells">Cells Only</SelectItem>
                                                <SelectItem value="events">Events Only</SelectItem>
                                                <SelectItem value="metrics">Metrics Snapshot</SelectItem>
                                                <SelectItem value="workflow:ControleFinanceiroPessoal">Workflow: Finanças</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={startStream}
                                        className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                                    >
                                        <Activity className="h-4 w-4" /> Atualizar Stream
                                    </Button>
                                    <div className="p-3 rounded bg-primary/5 border border-primary/10 text-[10px] text-primary/70 italic">
                                        <Info className="h-3 w-3 inline mr-1 mb-0.5" />
                                        Os dados não são persistidos. A janela é mantida apenas enquanto o stream estiver aberto.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {isStreaming && (
                        <Card className="border-primary/10 bg-primary/5 animate-pulse">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wifi className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Streaming</span>
                                </div>
                                <span className="flex h-2 w-2 rounded-full bg-primary" />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results Side */}
                <Card className="lg:col-span-2 border-primary/20 overflow-hidden">
                    <CardHeader className="pb-3 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4" /> {isStreaming ? 'Live Read Model (CRM)' : 'Static Read Model (CRM)'}
                            </CardTitle>
                            {activeCrm && (
                                <div className="flex gap-2">
                                    {activeCrm.layers_used.map(layer => (
                                        <Badge key={layer} variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                            {layer}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs defaultValue="text" className="w-full">
                            <div className="px-4 border-b bg-card">
                                <TabsList className="bg-transparent h-12 gap-4">
                                    <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                        <FileText className="h-4 w-4" /> Narrativa
                                    </TabsTrigger>
                                    <TabsTrigger value="json" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                        <Layers className="h-4 w-4" /> JSON Data
                                    </TabsTrigger>
                                    <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                        <Clock className="h-4 w-4" /> Live Timeline
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="p-4 h-[440px] overflow-auto">
                                <TabsContent value="text" className="m-0 focus-visible:ring-0">
                                    {activeResult ? (
                                        <div className="space-y-4">
                                            <div className="p-6 bg-muted/20 border-l-4 border-primary rounded-r-lg">
                                                <p className="text-lg italic leading-relaxed text-foreground/90">
                                                    "{activeResult.text || 'Sem narrativa disponível para esta amostra.'}"
                                                </p>
                                            </div>

                                            {activeCrm?.provenance && (
                                                <div className="grid grid-cols-2 gap-4 mt-8">
                                                    {activeCrm.provenance.cells && (
                                                        <div className="p-4 rounded-lg border bg-card/30 flex items-center gap-3">
                                                            <Database className="h-5 w-5 text-primary" />
                                                            <div>
                                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Fonte de Células</p>
                                                                <p className="text-sm font-medium">{activeCrm.provenance.cells.count} registros em {activeCrm.provenance.cells.source}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="p-4 rounded-lg border bg-card/30 flex items-center gap-3">
                                                        <Activity className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Fluxo SSE Core</p>
                                                            <p className="text-sm font-medium">
                                                                {activeCrm.provenance.events.count} eventos em {activeCrm.provenance.events.window ? activeCrm.provenance.events.window : 'live'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-4 border-2 border-dashed rounded-lg bg-muted/5 h-full">
                                            {isStreaming ? (
                                                <>
                                                    <WifiOff className="h-8 w-8 opacity-20" />
                                                    <p>Aguardando primeiro evento da janela ({streamConfig.window_s}s)...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Info className="h-8 w-8 opacity-20" />
                                                    <p>{mutation.isError ? 'Erro ao processar consulta cognitiva.' : 'Nenhum resultado gerado. Escreva sua query CQL e aperte o play.'}</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="json" className="m-0 focus-visible:ring-0">
                                    {activeResult ? (
                                        <pre className="p-4 bg-muted/50 rounded-lg text-xs font-mono border whitespace-pre-wrap">
                                            {JSON.stringify(activeResult.data, null, 2)}
                                        </pre>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground italic">Aguardando dados...</div>
                                    )}
                                </TabsContent>

                                <TabsContent value="timeline" className="m-0 focus-visible:ring-0">
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                        {isStreaming ? (
                                            <div className="w-full space-y-2">
                                                <div className="flex items-center gap-2 mb-4 p-2 bg-primary/5 rounded border border-primary/20">
                                                    <Activity className="h-4 w-4 animate-pulse text-primary" />
                                                    <span className="text-xs font-bold font-mono">LIVE_STREAM_BUFFER: ENABLED</span>
                                                </div>
                                                <div className="p-4 border rounded bg-card/50 text-[10px] font-mono whitespace-pre text-primary/80">
                                                    {isStreaming && latestStreamResult ? (
                                                        `[LATEST_EVENT] ${new Date().toLocaleTimeString()}\n` +
                                                        `TYPE: ${latestStreamResult.data.type || 'AGGREGATE'}\n` +
                                                        `SCOPE: ${streamConfig.scope}\n` +
                                                        `WINDOW: ${streamConfig.window_s}s`
                                                    ) : 'Aguardando atividade...'}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Clock className="h-8 w-8 opacity-20" />
                                                <p className="text-sm">Static Timeline View — Em breve (Fase 6)</p>
                                                <p className="text-[10px] opacity-70 italic font-mono uppercase">Use live mode for streaming events</p>
                                            </>
                                        )}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {mutation.error && !isStreaming && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <X className="h-5 w-5 text-destructive" />
                        <div>
                            <p className="text-sm font-bold text-destructive">{(mutation.error as any).error?.code}</p>
                            <p className="text-xs text-destructive/80">{(mutation.error as any).error?.message}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
