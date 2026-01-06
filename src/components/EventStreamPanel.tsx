import React, { useEffect, useState, useRef } from 'react';
import { sseClient, SSEEvent, ConnectionStatus } from '@/services/sseClient';
import { cn } from '@/lib/utils';
import { Terminal, Activity, Wifi, WifiOff, AlertCircle, Trash2, ArrowDownCircle } from 'lucide-react';

export function EventStreamPanel() {
    const [events, setEvents] = useState<SSEEvent[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [metrics, setMetrics] = useState({ reconnectCount: 0 });
    const [avgLatency, setAvgLatency] = useState<number | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect on mount
        sseClient.connect();

        // Subscribe to status
        const unsubscribeStatus = sseClient.subscribeToStatus((newStatus, newMetrics) => {
            setStatus(newStatus);
            setMetrics(newMetrics);
        });

        // Subscribe to events
        const unsubscribeEvents = sseClient.subscribeToEvents((event) => {
            setEvents((prev) => {
                const newEvents = [event, ...prev].slice(0, 200);

                // Calculate latency (moving average of last 50)
                const latencyEvents = newEvents
                    .filter(e => e.receivedAt_ms && e.timestamp_ms)
                    .slice(0, 50);

                if (latencyEvents.length > 0) {
                    const sum = latencyEvents.reduce((acc, e) => acc + (e.receivedAt_ms! - e.timestamp_ms), 0);
                    setAvgLatency(Math.round(sum / latencyEvents.length));
                }

                return newEvents;
            });
        });

        // Disconnect on unmount
        return () => {
            unsubscribeStatus();
            unsubscribeEvents();
            // We don't necessarily disconnect sseClient here if we want it to persist across pages,
            // but the requirement says "cleanup safe when unmounting".
            // Given it's a singleton, let's just unsubscribe.
        };
    }, []);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [events, autoScroll]);

    const clearEvents = () => {
        setEvents([]);
        setAvgLatency(null);
    };

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'text-status-online';
            case 'error': return 'text-status-offline';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'connected': return <Wifi className="h-4 w-4" />;
            case 'error': return <AlertCircle className="h-4 w-4" />;
            default: return <WifiOff className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex flex-col h-[400px] rounded-lg border bg-card overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Event Stream</h3>
                    <div className={cn("flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-background border text-[10px] font-medium uppercase tracking-wider", getStatusColor())}>
                        {getStatusIcon()}
                        {status}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={cn(
                            "p-1.5 rounded-md transition-colors",
                            autoScroll ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent"
                        )}
                        title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
                    >
                        <ArrowDownCircle className="h-4 w-4" />
                    </button>
                    <button
                        onClick={clearEvents}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-status-offline/10 hover:text-status-offline transition-colors"
                        title="Clear stream"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Stream Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-black/20"
            >
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Activity className="h-8 w-8 mb-2 animate-pulse" />
                        <p>Waiting for events...</p>
                    </div>
                ) : (
                    events.map((event, idx) => (
                        <div
                            key={`${event.timestamp_ms}-${idx}`}
                            className="flex items-start gap-2 py-1 px-2 rounded hover:bg-accent/30 transition-colors border-l-2 border-transparent hover:border-primary/50"
                        >
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                                [{new Date(event.timestamp_ms).toLocaleTimeString()}]
                            </span>
                            <span className="font-bold text-primary shrink-0 uppercase tracking-tighter">
                                {event.type}
                            </span>
                            <span className="text-foreground/80 break-all line-clamp-2">
                                {JSON.stringify(event.details || event)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-1.5 border-t bg-muted/30 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-medium">
                <div className="flex gap-4">
                    <span>Buffer: {events.length} / 200</span>
                    {avgLatency !== null && (
                        <span>Avg Latency: <span className="text-primary">{avgLatency}ms</span></span>
                    )}
                    <span>Reconnects: <span className={cn(metrics.reconnectCount > 0 ? "text-status-offline" : "text-status-online")}>{metrics.reconnectCount}</span></span>
                </div>
                <span className="flex items-center gap-1 italic">
                    <Activity className="h-3 w-3" />
                    Reactive Observation
                </span>
            </div>
        </div>
    );
}
