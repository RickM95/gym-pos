import { getDB } from '../db';
import { clientService } from './clientService';
import { logEvent } from '../sync';

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

// Simple password hashing (in production, use bcrypt or similar)
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
        const db = await getDB();
        
        // Verify client exists
        const client = await clientService.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }

        // Check if auth already exists
        const existingAuth = await db.get('client_auth', clientId);
        if (existingAuth) {
            throw new Error('Client authentication already exists');
        }

        // Validate PIN (4-6 digits) - allow 4 digits minimum
        if (!/^\d{4,6}$/.test(pin)) {
            throw new Error('PIN must be 4-6 digits');
        }
        if (pin.length < 4) {
            throw new Error('PIN must be at least 4 digits');
        }

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

        await db.put('client_auth', clientAuth);
        await logEvent('CLIENT_AUTH_CREATED' as const, { clientId });

        return clientAuth;
    },

    async authenticateClient(credentials: ClientCredentials): Promise<{ client: any; auth: ClientAuth } | null> {
        const db = await getDB();
        const auth = await db.get('client_auth', credentials.clientId);
        
        if (!auth) {
            throw new Error('Client authentication not found');
        }

        // Check if account is locked
        if (auth.isLocked && auth.lockUntil) {
            const lockUntil = new Date(auth.lockUntil);
            if (lockUntil > new Date()) {
                throw new Error('Account temporarily locked. Please try again later.');
            } else {
                // Lock expired, reset
                auth.isLocked = false;
                auth.loginAttempts = 0;
                await db.put('client_auth', auth);
            }
        }

        let isValid = false;

        switch (credentials.authMethod) {
            case 'password':
                if (credentials.password) {
                    isValid = await verifyPassword(credentials.password, auth.password);
                }
                break;
            case 'pin':
                if (credentials.pin) {
                    isValid = credentials.pin === auth.pin;
                }
                break;
            case 'biometric':
                // In a real implementation, this would interface with WebAuthn or similar
                // For now, we'll just check if biometric data exists
                isValid = !!(auth.biometricData?.fingerprint || auth.biometricData?.faceId);
                break;
        }

        if (!isValid) {
            // Increment login attempts
            auth.loginAttempts += 1;
            
            // Lock account after 5 failed attempts for 15 minutes
            if (auth.loginAttempts >= 5) {
                auth.isLocked = true;
                auth.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            }
            
            await db.put('client_auth', auth);
            await logEvent('CLIENT_LOGIN_FAILED', { 
                clientId: credentials.clientId, 
                attempts: auth.loginAttempts,
                authMethod: credentials.authMethod 
            });
            
            throw new Error('Invalid credentials');
        }

        // Reset login attempts on successful login
        auth.loginAttempts = 0;
        auth.isLocked = false;
        auth.lockUntil = undefined;
        auth.lastLogin = new Date().toISOString();
        auth.updatedAt = new Date().toISOString();

        await db.put('client_auth', auth);

        const client = await clientService.getClient(credentials.clientId);
        if (!client) {
            throw new Error('Client not found');
        }

        await logEvent('CLIENT_LOGIN_SUCCESS', { 
            clientId: credentials.clientId,
            authMethod: credentials.authMethod 
        });

        return { client, auth };
    },

    async updateClientAuth(clientId: string, updates: {
        password?: string;
        pin?: string;
        biometricData?: ClientAuth['biometricData'];
    }): Promise<ClientAuth> {
        const db = await getDB();
        const auth = await db.get('client_auth', clientId);
        
        if (!auth) {
            throw new Error('Client authentication not found');
        }

        const updatedAuth = { ...auth };

        if (updates.password) {
            updatedAuth.password = await hashPassword(updates.password);
        }

        if (updates.pin) {
            if (!/^\d{4,6}$/.test(updates.pin)) {
                throw new Error('PIN must be 4-6 digits');
            }
            updatedAuth.pin = updates.pin;
        }

        if (updates.biometricData) {
            updatedAuth.biometricData = updates.biometricData;
        }

        updatedAuth.updatedAt = new Date().toISOString();

        await db.put('client_auth', updatedAuth);
        await logEvent('CLIENT_AUTH_UPDATED', { clientId });

        return updatedAuth;
    },

    async getClientAuth(clientId: string): Promise<ClientAuth | null> {
        const db = await getDB();
        const result = await db.get('client_auth', clientId);
        return result || null;
    },

    async hasClientAuth(clientId: string): Promise<boolean> {
        const auth = await this.getClientAuth(clientId);
        return !!auth;
    },

    async removeClientAuth(clientId: string): Promise<void> {
        const db = await getDB();
        await db.delete('client_auth', clientId);
        await logEvent('CLIENT_AUTH_REMOVED', { clientId });
    }
};