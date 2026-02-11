import { cryptoUtils } from '../utils/cryptoUtils';
import { staffService } from './staffService';
import { clientAuthService } from './clientAuthService';

export type UserRole = 'ADMIN' | 'TRAINER' | 'STAFF' | 'CLIENT' | 'TECH' | 'FRONT_DESK';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    linkedClientId?: string;
    permissions?: Record<string, boolean>; // Individual permissions for staff
    photoUrl?: string; // Profile picture URL
}

const SESSION_KEY = 'gym_platform_user';
const FAILED_ATTEMPTS_KEY = 'auth_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000; // 30 seconds

export const authService = {
    async login(pin: string): Promise<User | null> {
        console.log('[authService] Secure login attempt');

        // 1. Rate Limiting Check
        const status = (this as any).getLockoutStatus();
        if (status.isLocked) {
            const remaining = Math.ceil((status.unlockTime - Date.now()) / 1000);
            throw new Error(`Too many failed attempts. Try again in ${remaining}s.`);
        }

        // 2. Check Staff Profiles
        try {
            const allStaff = await staffService.getAllStaff();

            for (const staff of allStaff) {
                const isValid = await cryptoUtils.verifyCredential(pin, staff.pin);
                if (isValid && staff.isActive) {
                    (this as any).resetFailedAttempts();
                    const user: User = {
                        id: staff.id,
                        name: staff.name,
                        role: staff.role as UserRole,
                        permissions: staff.permissions,
                        photoUrl: staff.photoUrl
                    };

                    if (typeof window !== 'undefined') {
                        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                    }
                    return user;
                }
            }
        } catch (error) {
            console.error('[authService] Staff login error:', error);
            if (error instanceof Error && error.message.includes('attempts')) throw error;
        }

        (this as any).recordFailedAttempt();
        return null;
    },

    recordFailedAttempt() {
        if (typeof window === 'undefined') return;
        const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
        localStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());
        localStorage.setItem(FAILED_ATTEMPTS_KEY + '_time', Date.now().toString());
    },

    resetFailedAttempts() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY + '_time');
    },

    getLockoutStatus() {
        if (typeof window === 'undefined') return { isLocked: false, unlockTime: 0 };
        const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0');
        const lastTime = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY + '_time') || '0');

        if (attempts >= MAX_ATTEMPTS) {
            const unlockTime = lastTime + LOCKOUT_MS;
            if (Date.now() < unlockTime) {
                return { isLocked: true, unlockTime };
            } else {
                (this as any).resetFailedAttempts();
            }
        }
        return { isLocked: false, unlockTime: 0 };
    },

    async initialize() {
        // Initialize default staff if cloud is empty
        try {
            // Add timeout to prevent hanging
            const initPromise = staffService.initializeDefaultStaff();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Initialization timeout')), 5000)
            );

            await Promise.race([initPromise, timeoutPromise]);
        } catch (error) {
            console.error('[authService] Initialization error:', error);
            // Continue anyway - app can work with local storage
        }
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SESSION_KEY);
        }
    },

    getUser(): User | null {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                try {
                    return JSON.parse(stored) as User;
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    },

    async hasPermission(user: User | null, permission: string): Promise<boolean> {
        if (!user) return false;
        if (user.role === 'ADMIN' || user.role === 'TECH') return true;
        if (user.permissions) {
            return user.permissions[permission] || false;
        }
        return false;
    },

    async authenticateClient(clientId: string, pin?: string): Promise<User | null> {
        try {
            if (!pin) return null;
            const result = await clientAuthService.authenticateClient({
                clientId,
                pin,
                authMethod: 'pin'
            });

            if (result) {
                const user: User = {
                    id: result.client.id,
                    name: result.client.name,
                    role: 'CLIENT',
                    linkedClientId: result.client.id,
                    photoUrl: result.client.photoUrl
                };

                if (typeof window !== 'undefined') {
                    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                }
                return user;
            }
            return null;
        } catch (error) {
            console.error('Client authentication error:', error);
            return null;
        }
    }
};
