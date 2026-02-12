import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';

export interface Client {
    id: string;
    locationId: string; // Multi-location link
    companyId: string; // Multi-tenant company reference
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
    async createClient(data: Omit<Client, 'id' | 'qrCode' | 'updatedAt' | 'synced' | 'locationId' | 'companyId'> & { locationId?: string; companyId?: string }) {
        const id = uuidv4();
        const qrCode = `CLIENT:${id.substring(0, 8)}`;
        const now = new Date().toISOString();
        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = data.companyId || user?.companyId || 'global';

        const newClient: Client = {
            ...data,
            locationId: data.locationId || user?.locationId || 'main-gym',
            companyId,
            id,
            qrCode,
            updatedAt: now,
            synced: 1
        };

        // 1. Sync to Firebase
        try {
            await setDoc(doc(db, 'clients', id), {
                id,
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                qrCode,
                notes: data.notes || null,
                status: data.status || 'active',
                joinedDate: data.joinedDate || now,
                photoUrl: data.photoUrl || null,
                rtn: data.rtn || null,
                dpi: data.dpi || null,
                locationId: newClient.locationId,
                companyId,
                updatedAt: now
            });
        } catch (error) {
            console.error('Firebase sync error:', error);
            newClient.synced = 0;
        }

        // 2. Save to Local DB
        const localDb = await getDB();
        await localDb.add('clients', newClient);
        await logEvent('CLIENT_CREATED', newClient);

        return newClient;
    },

    async getClients() {
        // Try Firebase first
        try {
            const q = query(collection(db, 'clients'), orderBy('name'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const clients: Client[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('clients', 'readwrite');

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    const client: Client = {
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
                        locationId: data.locationId || 'main-gym',
                        companyId: data.companyId || 'global',
                        updatedAt: data.updatedAt,
                        synced: 1
                    };
                    clients.push(client);
                    tx.store.put(client);
                });
                await tx.done;
                return clients;
            }
        } catch (error) {
            console.error('Firebase getClients error:', error);
        }

        const localDb = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();

        let clients = await localDb.getAll('clients');

        if (user?.companyId) {
            clients = await localDb.getAllFromIndex('clients', 'by-company', user.companyId);
        }

        // Ensure locationId exists for backward compatibility
        return clients.map(client => ({
            ...client,
            locationId: client.locationId || 'main-gym'
        }));
    },

    async getClient(id: string) {
        try {
            const docSnap = await getDoc(doc(db, 'clients', id));
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                return {
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
                    locationId: data.locationId || 'main-gym',
                    companyId: data.companyId || 'global',
                    updatedAt: data.updatedAt,
                    synced: 1
                } as Client;
            }
        } catch (error) {
            console.error('Firebase getClient error:', error);
        }

        const localDb = await getDB();
        const client = await localDb.get('clients', id);
        if (!client) return null;
        // Ensure locationId and companyId exists for backward compatibility
        return {
            ...client,
            locationId: client.locationId || 'main-gym',
            companyId: client.companyId || 'global'
        };
    },

    async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'qrCode'>>) {
        const now = new Date().toISOString();

        // 1. Update Firebase
        let firebaseError = false;
        try {
            const updates: any = { updatedAt: now };
            if (data.name !== undefined) updates.name = data.name;
            if (data.email !== undefined) updates.email = data.email;
            if (data.phone !== undefined) updates.phone = data.phone;
            if (data.notes !== undefined) updates.notes = data.notes;
            if (data.status !== undefined) updates.status = data.status;
            if (data.photoUrl !== undefined) updates.photoUrl = data.photoUrl;
            if (data.rtn !== undefined) updates.rtn = data.rtn;
            if (data.dpi !== undefined) updates.dpi = data.dpi;
            if (data.locationId !== undefined) updates.locationId = data.locationId;

            await updateDoc(doc(db, 'clients', id), updates);
        } catch (error) {
            console.error('Firebase update error:', error);
            firebaseError = true;
        }

        // 2. Update Local
        const localDb = await getDB();
        const client = await localDb.get('clients', id);
        if (!client) throw new Error('Client not found');

        const updatedClient = {
            ...client,
            ...data,
            updatedAt: now,
            synced: firebaseError ? 0 : 1,
            locationId: data.locationId || client.locationId || 'main-gym'
        };

        await localDb.put('clients', updatedClient);
        await logEvent('CLIENT_UPDATED', updatedClient);
        return updatedClient;
    }
};
