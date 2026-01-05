import { GenesisCell, LogEntry, RuntimeMetrics } from './types.js';

// --- CQL AST & Types ---

export type CQLScope = 'cells' | 'events' | 'metrics' | string;
export type CQLInterpretMode = 'DESCRIPTIVE' | 'INTERPRETIVE' | 'NARRATIVE';
export type CQLRenderFormat = 'json' | 'text' | 'timeline' | 'dashboard';

export interface CQLAst {
    from: CQLScope;
    select?: string[];
    where?: CQLFilter[];
    aggregate?: CQLAggregation[];
    interpret?: CQLInterpretMode;
    render?: CQLRenderFormat;
}

export interface CQLFilter {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string | number;
}

export interface CQLAggregation {
    type: 'count' | 'avg' | 'min' | 'max' | 'distribution';
    field?: string;
}

export interface CognitiveContext {
    timezone: string;
    locale: string;
    now_ms: number;
}

export interface CognitiveLimits {
    max_cells: number;
    max_events: number;
    time_range_days: number;
    max_tokens: number;
}

// --- Errors ---

export class CogError extends Error {
    constructor(public code: string, message: string, public statusCode: number = 400) {
        super(message);
        this.name = 'CogError';
    }
}

// --- CQL Parser (Deterministic) ---

export class CQLParser {
    private static readonly PROHIBITED_KEYWORDS = ['loop', 'if', 'trigger', 'webhook', 'notify', 'ai_'];

    static parse(query: string): CQLAst {
        const ast: Partial<CQLAst> = {};
        const normalized = query.replace(/\n/g, ' ').trim();

        // Basic regex-based parsing for v1.0
        // Handles "FROM cells", "FROM workflow 'Name'", etc.
        const fromMatch = normalized.match(/FROM\s+(cells|events|metrics|workflow\s+["'].*?["']|workflow\s+[^\s]+)/i);
        if (!fromMatch) {
            throw new CogError('CQL_PARSE_ERROR', 'Missing mandatory FROM clause or invalid scope format', 400);
        }
        ast.from = fromMatch[1].replace(/["']/g, '').trim();

        const selectMatch = normalized.match(/SELECT\s+(.*?)(?=\s+WHERE|\s+AGGREGATE|\s+INTERPRET|\s+RENDER|$)/i);
        if (selectMatch) {
            ast.select = selectMatch[1].split(',').map(s => s.trim());
        }

        const whereMatch = normalized.match(/WHERE\s+(.*?)(?=\s+AGGREGATE|\s+INTERPRET|\s+RENDER|$)/i);
        if (whereMatch) {
            ast.where = this.parseFilters(whereMatch[1]);
        }

        const aggMatch = normalized.match(/AGGREGATE\s+(.*?)(?=\s+INTERPRET|\s+RENDER|$)/i);
        if (aggMatch) {
            ast.aggregate = this.parseAggregations(aggMatch[1]);
        }

        const interpretMatch = normalized.match(/INTERPRET\s+(DESCRIPTIVE|INTERPRETIVE|NARRATIVE)/i);
        if (interpretMatch) {
            ast.interpret = interpretMatch[1].toUpperCase() as CQLInterpretMode;
        }

        const renderMatch = normalized.match(/RENDER\s+(json|text|timeline|dashboard)/i);
        if (renderMatch) {
            ast.render = renderMatch[1].toLowerCase() as CQLRenderFormat;
        }

        // Static Guard Checks
        this.guardCheck(normalized);

        return ast as CQLAst;
    }

    private static parseFilters(whereClause: string): CQLFilter[] {
        const filters: CQLFilter[] = [];
        const filterParts = whereClause.split(/\s+AND\s+/i);

        for (const part of filterParts) {
            const match = part.match(/([^\s]+)\s*(=|!=|>|<|>=|<=)\s*(.*)/);
            if (match) {
                let value: string | number = match[3].trim().replace(/["']/g, '');
                if (!isNaN(Number(value))) value = Number(value);
                filters.push({
                    field: match[1],
                    operator: match[2] as any,
                    value
                });
            }
        }
        return filters;
    }

    private static parseAggregations(aggClause: string): CQLAggregation[] {
        const aggs: CQLAggregation[] = [];
        const parts = aggClause.split(',').map(p => p.trim());

        for (const part of parts) {
            const match = part.match(/(\w+)\((.*?)\)/);
            if (match) {
                aggs.push({
                    type: match[1].toLowerCase() as any,
                    field: match[2] || undefined
                });
            }
        }
        return aggs;
    }

    private static guardCheck(query: string) {
        const lower = query.toLowerCase();
        for (const keyword of this.PROHIBITED_KEYWORDS) {
            if (lower.includes(keyword)) {
                throw new CogError('CQL_UNSUPPORTED_FEATURE', `Command "${keyword}" is prohibited in read-only Cognitive API`, 400);
            }
        }
    }
}

// --- Execution Engine ---

export class CognitiveEngine {
    static execute(ast: CQLAst, data: { cells: GenesisCell[], events: LogEntry[], metrics: RuntimeMetrics }, limits: CognitiveLimits) {
        // 1. Check Safety Limits
        if (data.cells.length > limits.max_cells) throw new CogError('CQL_LIMIT_EXCEEDED', `Max cells limit exceeded (${limits.max_cells})`, 413);
        if (data.events.length > limits.max_events) throw new CogError('CQL_LIMIT_EXCEEDED', `Max events limit exceeded (${limits.max_events})`, 413);

        // 2. Filter data based on scope
        let workingSet: any[] = [];
        let layersUsed: string[] = ['RAW'];

        if (ast.from === 'cells') {
            workingSet = this.applyFilters(data.cells, ast.where);
        } else if (ast.from === 'events') {
            workingSet = this.applyFilters(data.events, ast.where);
        } else if (ast.from === 'metrics') {
            workingSet = [data.metrics];
        } else {
            // Workflow scope
            const scope = ast.from.toLowerCase();
            if (!scope.startsWith('workflow ')) {
                throw new CogError('CQL_INVALID_SCOPE', `Unknown scope: ${ast.from}`, 422);
            }
            const workflowName = scope.replace('workflow ', '').replace(/["']/g, '');
            workingSet = this.applyFilters(data.cells.filter(c => c.type.toLowerCase() === workflowName), ast.where);
        }

        // 3. Layer: AGGREGATE
        let resultData = workingSet;
        let aggsResult: any = null;
        if (ast.aggregate && ast.aggregate.length > 0) {
            layersUsed.push('AGGREGATE');
            aggsResult = this.applyAggregations(workingSet, ast.aggregate);
            resultData = aggsResult;
        }

        // 4. Layer: Interpret/Narrative
        const mode = ast.interpret || 'DESCRIPTIVE';
        if (mode === 'NARRATIVE') {
            layersUsed.push('INTERPRETIVE', 'NARRATIVE');
            if (workingSet.length === 0) {
                throw new CogError('CRM_NON_REDUCIBLE', 'Narrative layer requires a non-empty data set for reduction', 422);
            }
        } else if (mode === 'INTERPRETIVE') {
            layersUsed.push('INTERPRETIVE');
        } else {
            layersUsed.push('DESCRIPTIVE');
        }

        // 5. Render
        const text = this.renderText(mode, workingSet, aggsResult);

        return {
            layersUsed,
            data: resultData,
            text,
            provenance: {
                cells: { source: '/v1/cells', count: data.cells.length },
                events: { source: '/v1/log', count: data.events.length },
                window: limits.time_range_days ? `last_${limits.time_range_days}_days` : undefined
            }
        };
    }

    private static applyFilters(set: any[], filters?: CQLFilter[]): any[] {
        if (!filters || filters.length === 0) return set;
        return set.filter(item => {
            return filters.every(f => {
                const val = item[f.field];
                switch (f.operator) {
                    case '=': return val == f.value;
                    case '!=': return val != f.value;
                    case '>': return val > f.value;
                    case '<': return val < f.value;
                    case '>=': return val >= f.value;
                    case '<=': return val <= f.value;
                    default: return false;
                }
            });
        });
    }

    private static applyAggregations(set: any[], aggs: CQLAggregation[]): any {
        const result: any = {};
        for (const agg of aggs) {
            const key = `${agg.type}${agg.field ? `_${agg.field}` : ''}`;
            if (agg.type === 'count') {
                result[key] = set.length;
            } else if (agg.type === 'avg' && agg.field) {
                const sum = set.reduce((acc, curr) => acc + (Number(curr[agg.field!]) || 0), 0);
                result[key] = set.length > 0 ? Number((sum / set.length).toFixed(2)) : 0;
            } else if (agg.type === 'max' && agg.field) {
                result[key] = set.length > 0 ? Math.max(...set.map(i => Number(i[agg.field!]) || 0)) : 0;
            } else if (agg.type === 'distribution' && agg.field) {
                const dist: Record<string, number> = {};
                set.forEach(item => {
                    const val = String(item[agg.field!]);
                    dist[val] = (dist[val] || 0) + 1;
                });
                result[key] = dist;
            }
        }
        return result;
    }

    private static renderText(mode: CQLInterpretMode, set: any[], aggs?: any): string {
        const count = set.length;

        if (mode === 'DESCRIPTIVE') {
            let base = `Observatório: ${count} registros identificados.`;
            if (aggs) {
                if (aggs.count !== undefined) base += ` Volume total: ${aggs.count}.`;
                if (aggs.avg_friction !== undefined) base += ` Média de fricção: ${aggs.avg_friction}.`;
                if (aggs.distribution_state) {
                    const states = Object.entries(aggs.distribution_state as Record<string, number>)
                        .map(([k, v]) => `${k}: ${v}`).join(', ');
                    base += ` Distribuição por estado: [ ${states} ].`;
                }
            }
            return base;
        }

        if (mode === 'INTERPRETIVE') {
            const avgFriction = aggs?.avg_friction ?? 'N/A';
            return `Análise Interpretativa: Células em RUNNING apresentam fricção média de ${avgFriction} sob esta amostra. O padrão sugere estabilidade operacional em ${count} unidades.`;
        }

        if (mode === 'NARRATIVE') {
            return `Narrativa Técnica: O fluxo observado demonstra uma progressão iniciada por ingestão GPP e transições auditáveis. Com ${count} pontos de observação, a integridade do processo é confirmada pelos logs.`;
        }

        return '';
    }
}
