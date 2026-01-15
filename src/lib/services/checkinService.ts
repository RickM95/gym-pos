import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { Client } from './clientService';
import { subscriptionService } from './subscriptionService';

export interface CheckinResult {
    success: boolean;
    message: string;
    client?: Client;
}

export const checkinService = {
    async processCheckin(qrCode: string): Promise<CheckinResult> {
        const db = await getDB();

        // 1. Find Client by QR Code
        const client = await db.getFromIndex('clients', 'by-qr', qrCode);

        if (!client) {
            return { success: false, message: 'Client not found' };
        }

        // 2. Validate Subscription
        const activeSub = await subscriptionService.getActiveSubscription(client.id);

        if (!activeSub) {
            return { success: false, message: 'No active subscription', client };
        }

        // 3. Log Check-in
        const checkin = {
            id: uuidv4(),
            clientId: client.id,
            timestamp: new Date().toISOString(),
            synced: 0
        };

        await db.add('checkins', checkin);
        await logEvent('CHECKIN', checkin);

        return {
            success: true,
            message: `Welcome, ${client.name.split(' ')[0]}!`,
            client
        };
    }
};
