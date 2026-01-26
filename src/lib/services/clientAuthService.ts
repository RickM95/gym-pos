import { getDB } from '../db';
import { clientService } from './clientService';
import { logEvent } from '../sync';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface ClientAuth {
    clientId: string;
    password: string;
    pin: string;
    biometricData?: {
        fingerprint?: string;
        faceId?: string;
    };
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    loginAttempts: number;
    isLocked: boolean;
    lockUntil?: string;
}

export interface ClientCredentials {
    clientId: string;
    password?: string;
    pin?: string;
    authMethod: 'password' | 'pin' | 'biometric';
}

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    const hashedInput = await hashPassword(password);
    return hashedInput === hashedPassword;
};

export const clientAuthService = {
    async createClientAuth(clientId: string, password: string, pin: string): Promise<ClientAuth> {
        // Verify client exists
        const client = await clientService.getClient(clientId);
        if (!client) throw new Error('Client not found');

        const hashedPassword = await hashPassword(password);
        const now = new Date().toISOString();

        const clientAuth: ClientAuth = {
            clientId,
            password: hashedPassword,
            pin,
            createdAt: now,
            updatedAt: now,
            loginAttempts: 0,
            isLocked: false
        };

        // 1. Sync to Firebase
        try {
            await setDoc(doc(db, 'client_auth', clientId), {
                clientId,
                password: hashedPassword,
                pin,
                updatedAt: now,
                createdAt: now,
                loginAttempts: 0,
                isLocked: false
            });
        } catch (error) {
            console.error('Firebase client auth sync error:', error);
        }

        // 2. Save Local
        const dbLocal = await getDB();
        await dbLocal.put('client_auth', clientAuth);
        await logEvent('CLIENT_AUTH_CREATED', { clientId });

        return clientAuth;
    },

    async authenticateClient(credentials: ClientCredentials): Promise<{ client: any; auth: ClientAuth } | null> {
        let auth: ClientAuth | null = null;

        // 1. Try Firebase first
        try {
            const docRef = doc(db, 'client_auth', credentials.clientId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                auth = {
                    clientId: data.clientId,
                    password: data.password,
                    pin: data.pin,
                    biometricData: data.biometricData,
                    lastLogin: data.lastLogin,
                    loginAttempts: data.loginAttempts,
                    isLocked: data.isLocked,
                    lockUntil: data.lockUntil,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };
            }
        } catch (error) {
            console.error('Firebase auth lookup error:', error);
        }

        // 2. Local fallback if not found or error
        if (!auth) {
            const dbLocal = await getDB();
            auth = await dbLocal.get('client_auth', credentials.clientId);
        }

        if (!auth) throw new Error('Client authentication not found');

        // Check lock
        if (auth.isLocked && auth.lockUntil) {
            if (new Date(auth.lockUntil) > new Date()) {
                throw new Error('Account temporarily locked. Please try again later.');
            }
        }

        let isValid = false;
        if (credentials.authMethod === 'password' && credentials.password) {
            isValid = await verifyPassword(credentials.password, auth.password);
        } else if (credentials.authMethod === 'pin' && credentials.pin) {
            isValid = credentials.pin === auth.pin;
        }

        const now = new Date().toISOString();
        if (!isValid) {
            const attempts = auth.loginAttempts + 1;
            const isLocked = attempts >= 5;
            const lockUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

            try {
                await updateDoc(doc(db, 'client_auth', auth.clientId), {
                    loginAttempts: attempts,
                    isLocked,
                    lockUntil,
                    updatedAt: now
                });
            } catch (e) { console.error('Firebase auth update failed', e); }

            const dbLocal = await getDB();
            await dbLocal.put('client_auth', { ...auth, loginAttempts: attempts, isLocked, lockUntil: lockUntil || undefined });
            throw new Error('Invalid credentials');
        }

        // Success
        try {
            await updateDoc(doc(db, 'client_auth', auth.clientId), {
                loginAttempts: 0,
                isLocked: false,
                lockUntil: null,
                lastLogin: now,
                updatedAt: now
            });
        } catch (e) { console.error('Firebase auth success update failed', e); }

        const dbLocal = await getDB();
        await dbLocal.put('client_auth', { ...auth, loginAttempts: 0, isLocked: false, lastLogin: now, updatedAt: now });

        const client = await clientService.getClient(credentials.clientId);
        if (!client) throw new Error('Client not found');

        return { client, auth: { ...auth, loginAttempts: 0, isLocked: false, lastLogin: now, updatedAt: now } };
    },

    async updateClientAuth(clientId: string, updates: { password?: string; pin?: string; }): Promise<void> {
        const now = new Date().toISOString();
        const dbUpdates: any = { updatedAt: now };

        if (updates.password) dbUpdates.password = await hashPassword(updates.password);
        if (updates.pin) dbUpdates.pin = updates.pin;

        try {
            await updateDoc(doc(db, 'client_auth', clientId), dbUpdates);
        } catch (e) { console.error('Firebase update auth failed', e); }

        const dbLocal = await getDB();
        const auth = await dbLocal.get('client_auth', clientId);
        if (auth) {
            if (updates.password) auth.password = dbUpdates.password;
            if (updates.pin) auth.pin = updates.pin;
            auth.updatedAt = now;
            await dbLocal.put('client_auth', auth);
        }
    }
};