import { getDB } from '../db';
import { SyncEvent, getUnsyncedEvents } from '../sync';
import { mockBackend } from '../mock/backend';

export const syncService = {
    // Check if there are loose ends to tie up
    async getPendingCount(): Promise<number> {
        const events = await getUnsyncedEvents();
        return events.length;
    },

    async syncEvents() {
        console.log('[SyncService] Starting sync...');
        const db = await getDB();
        const pendingEvents = await getUnsyncedEvents();

        if (pendingEvents.length === 0) {
            console.log('[SyncService] No pending events.');
            return { success: true, count: 0 };
        }

        try {
            // 1. Send to Backend
            const result = await mockBackend.processBatch(pendingEvents);

            if (result.success) {
                // 2. Mark as Synced in Local DB
                const tx = db.transaction(['events'], 'readwrite');
                const store = tx.objectStore('events');

                await Promise.all(pendingEvents.map(async (event) => {
                    const updatedEvent = { ...event, synced: 1 };
                    await store.put(updatedEvent);
                }));

                await tx.done;
                console.log(`[SyncService] Successfully synced ${pendingEvents.length} events.`);
                return { success: true, count: pendingEvents.length };
            } else {
                throw new Error('Backend rejected batch.');
            }
        } catch (error) {
            console.error('[SyncService] Sync failed:', error);
            return { success: false, error };
        }
    }
};
