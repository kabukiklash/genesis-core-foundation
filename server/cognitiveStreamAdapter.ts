import { eventBus } from './eventBus.js';

export interface CognitiveStreamMessage {
    t: number;
    mode: string;
    scope: string;
    crm: {
        layers_used: string[];
        provenance: {
            events: { source: string; count: number; window: string };
        };
    };
    data: any;
    text?: string;
}

export class CognitiveStreamAdapter {
    private events: any[] = [];
    private unsubscribe: (() => void) | null = null;
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private mode: 'DESCRIPTIVE' | 'INTERPRETIVE' | 'NARRATIVE',
        private window_s: number,
        private scope: string = 'global',
        private sample_ms: number = 5000,
        private onMessage: (msg: CognitiveStreamMessage) => void
    ) { }

    start() {
        // Direct event bus consumption - modular adapter pattern
        this.unsubscribe = eventBus.subscribe((event) => {
            this.handleEvent(event);
            return true;
        });

        // Periodic interpretation/narrative tick
        if (this.mode !== 'DESCRIPTIVE') {
            this.timer = setInterval(() => this.tick(), this.sample_ms);
        }
    }

    stop() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.timer) clearInterval(this.timer);
    }

    private handleEvent(event: any) {
        // 1. Filter by scope
        if (!this.matchesScope(event)) return;

        // 2. Add to internal circular buffer (ephemeral)
        this.events.push({ ...event, local_ts: Date.now() });

        // 3. Descriptive mode repasses events immediately
        if (this.mode === 'DESCRIPTIVE') {
            this.onMessage(this.buildDescriptiveMessage(event));
        }

        this.prune();
    }

    private matchesScope(event: any): boolean {
        if (this.scope === 'global') return true;
        if (this.scope === 'cells' && ['cell_created', 'state_changed'].includes(event.type)) return true;
        if (this.scope === 'events') return true;
        if (this.scope === 'metrics' && event.type === 'runtime_snapshot') return true;
        if (this.scope.startsWith('workflow:')) {
            const workflow = this.scope.split(':')[1];
            // Match against workflow name or cell type
            return event.details?.workflow === workflow || event.details?.type === workflow;
        }
        return false;
    }

    private prune() {
        const now = Date.now();
        const cutoff = now - (this.window_s * 1000);
        // Circular buffer cleanup by TTL
        this.events = this.events.filter(e => e.local_ts >= cutoff);
    }

    private tick() {
        this.prune();
        this.emitAggregatedMessage();
    }

    private emitAggregatedMessage() {
        const stats = this.calculateAggregates();
        const text = this.generateText(stats);

        const layers = ['RAW', 'AGGREGATE'];
        layers.push(this.mode);

        this.onMessage({
            t: Date.now(),
            mode: this.mode,
            scope: this.scope,
            crm: {
                layers_used: layers,
                provenance: {
                    events: {
                        source: '/v1/stream/events',
                        count: this.events.length,
                        window: `last_${this.window_s}s`
                    }
                }
            },
            data: stats,
            text
        });
    }

    private calculateAggregates() {
        const count = this.events.length;
        const dist: Record<string, number> = {};
        let totalFriction = 0;
        let frictionCount = 0;

        this.events.forEach(e => {
            dist[e.type] = (dist[e.type] || 0) + 1;
            const friction = e.details?.friction_at_transition ?? e.details?.friction;
            if (friction !== undefined) {
                totalFriction += Number(friction);
                frictionCount++;
            }
        });

        return {
            event_count: count,
            distribution: dist,
            avg_friction: frictionCount > 0 ? Number((totalFriction / frictionCount).toFixed(2)) : 0
        };
    }

    private generateText(stats: any): string {
        if (this.mode === 'INTERPRETIVE') {
            return `Interpretativo Live: Janela de ${this.window_s}s observa ${stats.event_count} eventos. Fricção média Z=${stats.avg_friction}. Padrão sugere atividade operacional estável.`;
        }
        if (this.mode === 'NARRATIVE') {
            if (stats.event_count === 0) return "Janela com baixa densidade de eventos observáveis.";
            const topEvent = Object.keys(stats.distribution)[0] || 'N/A';
            return `Narrativa Técnica Stream: O fluxo de dados capturado nos últimos ${this.window_s}s revela ${stats.event_count} pontos de atividade, predominantemente do tipo ${topEvent}. Processo flui sem anomalias críticas.`;
        }
        return '';
    }

    private buildDescriptiveMessage(event: any): CognitiveStreamMessage {
        return {
            t: Date.now(),
            mode: 'DESCRIPTIVE',
            scope: this.scope,
            crm: {
                layers_used: ['RAW'],
                provenance: {
                    events: {
                        source: '/v1/stream/events',
                        count: 1,
                        window: 'live'
                    }
                }
            },
            data: {
                type: event.type,
                cell_id: event.cell_id,
                workflow: event.details?.workflow || event.details?.type,
                state: event.details?.to_state || event.details?.state,
                friction: event.details?.friction_at_transition || event.details?.friction,
                timestamp: event.timestamp_ms
            }
        };
    }
}
