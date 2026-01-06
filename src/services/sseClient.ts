import { getApiBaseUrl } from './genesisApi';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface SSEEvent {
    type: string;
    timestamp_ms: number;
    cell_id?: string | null;
    details?: any;
    meta?: {
        version: string;
    };
}

export type EventCallback = (event: SSEEvent) => void;
export type StatusCallback = (status: ConnectionStatus) => void;

class SSEClient {
    private eventSource: EventSource | null = null;
    private eventCallbacks: Set<EventCallback> = new Set();
    private statusCallbacks: Set<StatusCallback> = new Set();
    private status: ConnectionStatus = 'disconnected';
    private reconnectTimeout: number | null = null;

    constructor() {
        // Initial status
        this.status = 'disconnected';
    }

    public connect() {
        if (this.eventSource) return;

        const baseUrl = getApiBaseUrl().replace('/v1', ''); // Backend serves /v1/stream/events
        const url = `${baseUrl}/v1/stream/events`;

        console.log(`[SSEClient] Connecting to ${url}...`);

        try {
            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => {
                console.log('[SSEClient] Connected');
                this.updateStatus('connected');
            };

            this.eventSource.onmessage = (event) => {
                this.handleMessage(event);
            };

            // Handle named events from GenesisCore Contract v1.0
            const namedEvents = [
                'CELL_CREATED',
                'STATE_CHANGED',
                'FRICTION_RECORDED',
                'METRICS_UPDATED',
                'CELL_UPDATED',
                'AUDIT_LOG'
            ];

            namedEvents.forEach(eventType => {
                this.eventSource?.addEventListener(eventType, (event: any) => {
                    this.handleMessage(event);
                });
            });

            this.eventSource.onerror = (error) => {
                console.error('[SSEClient] Connection error:', error);
                this.updateStatus('error');
                this.disconnect();
                this.scheduleReconnect();
            };
        } catch (err) {
            console.error('[SSEClient] Setup error:', err);
            this.updateStatus('error');
            this.scheduleReconnect();
        }
    }

    public disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.updateStatus('disconnected');
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    public subscribeToEvents(callback: EventCallback) {
        this.eventCallbacks.add(callback);
        return () => this.eventCallbacks.delete(callback);
    }

    public subscribeToStatus(callback: StatusCallback) {
        this.statusCallbacks.add(callback);
        callback(this.status);
        return () => this.statusCallbacks.delete(callback);
    }

    private handleMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);
            this.eventCallbacks.forEach(cb => cb(data));
        } catch (err) {
            console.warn('[SSEClient] Malformed event payload:', event.data);
            // Fallback for non-JSON or malformed data as per requirements
            const fallbackEvent: SSEEvent = {
                type: 'RAW_PAYLOAD',
                timestamp_ms: Date.now(),
                details: { raw: String(event.data).substring(0, 500) },
                meta: { version: '0.0.0' }
            };
            this.eventCallbacks.forEach(cb => cb(fallbackEvent));
        }
    }

    private updateStatus(newStatus: ConnectionStatus) {
        this.status = newStatus;
        this.statusCallbacks.forEach(cb => cb(newStatus));
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) return;
        this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, 5000); // Reconnect after 5 seconds
    }
}

export const sseClient = new SSEClient();
