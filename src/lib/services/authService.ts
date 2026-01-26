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

export const authService = {
    async login(pin: string): Promise<User | null> {
        console.log('[authService] Login attempt with PIN');

        // 1. Check legacy/special users (CLIENT, TECH - can be moved to DB later)
        const LEGACY_USERS: Record<string, User> = {
            '3333': { id: 'demo-client-001', name: 'Member Kiosk', role: 'CLIENT', linkedClientId: 'demo-client-001' },
            '9999': { id: 'tech-001', name: 'Tech Support', role: 'TECH' },
        };

        if (LEGACY_USERS[pin]) {
            const user = LEGACY_USERS[pin];
            if (typeof window !== 'undefined') {
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            }
            return user;
        }

        // 2. Check Staff Profiles (via staffService which checks Firebase -> Local)
        try {
            const staff = await staffService.getStaffByPin(pin);
            if (staff) {
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
        } catch (error) {
            console.error('[authService] Staff login error:', error);
        }

        return null;
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
