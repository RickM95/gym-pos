import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { Client } from './clientService';
import { subscriptionService } from './subscriptionService';
import { db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc, limit } from 'firebase/firestore';

export interface CheckinResult {
    success: boolean;
    message: string;
    client?: Client;
}

export const checkinService = {
    async processCheckin(qrCode: string): Promise<CheckinResult> {
        // 1. Find Client by QR Code (Firebase first)
        let client: Client | null = null;

        try {
            const q = query(collection(db, 'clients'), where('qrCode', '==', qrCode), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data() as any;
                client = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    qrCode: data.qrCode,
                    notes: data.notes,
                    status: data.status,
                    joinedDate: data.joinedDate,
                    photoUrl: data.photoUrl,
                    rtn: data.rtn,
                    dpi: data.dpi,
                    updatedAt: data.updatedAt,
                    synced: 1
                };
            }
        } catch (error) {
            console.error('Firebase checkin client lookup error:', error);
        }

        if (!client) {
            // Local fallback
            const localDb = await getDB();
            client = await localDb.getFromIndex('clients', 'by-qr', qrCode);
        }

        if (!client) {
            return { success: false, message: 'Client not found' };
        }

        // 2. Validate Subscription
        const activeSub = await subscriptionService.getActiveSubscription(client.id);

        if (!activeSub) {
            return { success: false, message: 'No active subscription', client };
        }

        // 3. Log Check-in
        const checkinId = uuidv4();
        const now = new Date().toISOString();

        let firebaseSynced = 1;
        try {
            await setDoc(doc(db, 'check_ins', checkinId), {
                id: checkinId,
                clientId: client.id,
                timestamp: now
            });
        } catch (error) {
            console.error('Firebase check-in sync error:', error);
            firebaseSynced = 0;
        }

        // local log regardless for history
        const localDb = await getDB();
        const checkin = {
            id: checkinId,
            clientId: client.id,
            timestamp: now,
            synced: firebaseSynced
        };

        await localDb.add('checkins', checkin);
        await logEvent('CHECK_IN', checkin);

        return {
            success: true,
            message: `Welcome, ${client.name.split(' ')[0]}!`,
            client
        };
    }
};
