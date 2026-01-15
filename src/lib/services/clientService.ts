import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    qrCode: string; // checksum or unique string
    notes?: string;
    updatedAt: string;
    synced: number; // 0 or 1
    status?: 'active' | 'inactive';
    joinedDate?: string;
    photoUrl?: string; // URL to client photo
    rtn?: string; // Registro Tributario Nacional (Honduras)
    dpi?: string; // Documento de Identidad Personal
}

export const clientService = {
    async createClient(data: Omit<Client, 'id' | 'qrCode' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const id = uuidv4();
        // Simple QR checksum for now, can be more complex later
        const qrCode = `CLIENT:${id.substring(0, 8)}`;

        const newClient: Client = {
            ...data,
            id,
            qrCode,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.add('clients', newClient);
        await logEvent('CLIENT_CREATED', newClient);

        return newClient;
    },

    async getClients() {
        const db = await getDB();
        return db.getAll('clients');
    },

    async getClient(id: string) {
        const db = await getDB();
        return db.get('clients', id);
    },

    async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'qrCode'>>) {
        const db = await getDB();
        const client = await db.get('clients', id);
        if (!client) throw new Error('Client not found');

        const updatedClient = {
            ...client,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('clients', updatedClient);
        await logEvent('CLIENT_UPDATED', updatedClient);
        return updatedClient;
    }
};
