import { SyncEvent } from '../sync';

export const mockBackend = {
    async processBatch(events: SyncEvent[]): Promise<{ success: boolean; syncedCount: number }> {
        console.log(`[MockBackend] Processing batch of ${events.length} events...`);

        // Simulate network latency (0.5s - 1.5s)
        const latency = 500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, latency));

        // Simulate occasional failure (10% chance)
        // if (Math.random() < 0.1) {
        //   console.error('[MockBackend] Batch failed (simulated network error)');
        //   return { success: false, syncedCount: 0 };
        // }

        console.log('[MockBackend] Batch processed successfully.');
        // In a real app, the server would return IDs or confirmations.
        return { success: true, syncedCount: events.length };
    }
};
