import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';

export type EventType =
    | 'CLIENT_CREATED'
    | 'CLIENT_UPDATED'
    | 'CHECKIN'
    | 'SUBSCRIPTION_CREATED'
    | 'PLAN_CREATED'
    | 'WORKOUT_LOGGED'
    | 'TAX_REPORT_CREATED'
    | 'TAX_REPORT_UPDATED'
    | 'TAX_REPORT_FILED'
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_DELETED'
    | 'STAFF_PERMISSIONS_UPDATED'
    | 'CLIENT_AUTH_CREATED'
    | 'CLIENT_AUTH_UPDATED'
    | 'CLIENT_AUTH_REMOVED'
    | 'CLIENT_LOGIN_SUCCESS'
    | 'CLIENT_LOGIN_FAILED'
    // Inventory and Analytics Events
    | 'CATEGORY_CREATED'
    | 'CATEGORY_UPDATED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'STOCK_UPDATED'
    | 'SUPPLIER_CREATED'
    | 'SUPPLIER_UPDATED'
    | 'PURCHASE_ORDER_CREATED'
    | 'PURCHASE_ORDER_UPDATED'
    | 'PURCHASE_ORDER_RECEIVED'
    | 'SALE_CREATED'
    | 'EXPENSE_CREATED'
    | 'EXPENSE_UPDATED';

export interface SyncEvent {
    id: string;
    type: EventType;
    payload: any;
    timestamp: number;
    synced: number; // 0 = false, 1 = true
}

export const logEvent = async (type: EventType, payload: any) => {
    const db = await getDB();
    const event: SyncEvent = {
        id: uuidv4(),
        type,
        payload,
        timestamp: Date.now(),
        synced: 0,
    };
    await db.add('events', event);
    console.log(`[OfflineSync] Event logged: ${type}`, event);
    return event;
};

export const getUnsyncedEvents = async (): Promise<SyncEvent[]> => {
    const db = await getDB();
    const events = await db.getAllFromIndex('events', 'by-synced', 0);
    return events as any as SyncEvent[];
};
