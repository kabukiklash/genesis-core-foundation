type Subscriber = (event: any) => boolean; // Return false if consumer is full/broken

class EventBus {
    private subscribers: Set<Subscriber> = new Set();
    private readonly MAX_SUBSCRIBERS = 100; // Prevention of resource exhaustion

    /**
     * Register a new subscriber (SSE connection)
     * @param subscriber Function to call when an event is emitted. Should return false if failed.
     * @returns Unsubscribe function or null if limit reached
     */
    subscribe(subscriber: Subscriber): (() => void) | null {
        if (this.subscribers.size >= this.MAX_SUBSCRIBERS) {
            console.warn(`[EventBus] Max subscribers reached (${this.MAX_SUBSCRIBERS}). Rejecting new connection.`);
            return null;
        }
        this.subscribers.add(subscriber);
        return () => {
            this.subscribers.delete(subscriber);
        };
    }

    /**
     * Broadcast an event to all connected subscribers
     * @param event The event object
     */
    emit(event: any) {
        const deadSubscribers: Subscriber[] = [];

        this.subscribers.forEach((subscriber) => {
            try {
                const ok = subscriber(event);
                if (!ok) {
                    // Subscriber signaled failure (likely backpressure/buffer full)
                    deadSubscribers.push(subscriber);
                }
            } catch (error) {
                console.error('[EventBus] Error notifying subscriber:', error);
                deadSubscribers.push(subscriber);
            }
        });

        // Cleanup dead subscribers
        deadSubscribers.forEach(sub => {
            this.subscribers.delete(sub);
            console.log('[EventBus] Removed dead/slow subscriber.');
        });
    }

    get subscriberCount(): number {
        return this.subscribers.size;
    }
}

export const eventBus = new EventBus();
