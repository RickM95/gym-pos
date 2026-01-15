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

// Legacy users for CLIENT and TECH roles (they don't use staff service)
const LEGACY_USERS: Record<string, User> = {
    '3333': { id: 'demo-client-001', name: 'Member Kiosk', role: 'CLIENT', linkedClientId: 'demo-client-001' },
    '9999': { id: 'tech-001', name: 'Tech Support', role: 'TECH' },
};

const SESSION_KEY = 'gym_platform_user';

export const authService = {
    async login(pin: string): Promise<User | null> {
        console.log('[authService] Login attempt with PIN:', pin.substring(0, 2) + '**');

        // First check legacy users (CLIENT, TECH)
        if (LEGACY_USERS[pin]) {
            const user = LEGACY_USERS[pin];
            console.log('[authService] Legacy user found:', user.name, user.role);
            if (typeof window !== 'undefined') {
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            }
            return user;
        }

        // Check staff members
        try {
            console.log('[authService] Checking staff database...');
            const staff = await staffService.getStaffByPin(pin);
            if (staff) {
                console.log('[authService] Staff member found:', staff.name, staff.role);
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
            console.log('[authService] No staff member found with PIN');
        } catch (error) {
            console.error('[authService] Error during staff login:', error);
            // If staff service fails, try to initialize and retry
            try {
                console.log('[authService] Attempting to initialize default staff...');
                await staffService.initializeDefaultStaff();
                const staff = await staffService.getStaffByPin(pin);
                if (staff) {
                    console.log('[authService] Staff member found after initialization:', staff.name);
                    const user: User = {
                        id: staff.id,
                        name: staff.name,
                        role: staff.role as UserRole,
                        permissions: staff.permissions
                    };

                    if (typeof window !== 'undefined') {
                        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                    }
                    return user;
                }
            } catch (retryError) {
                console.error('[authService] Retry failed:', retryError);
            }
        }

        console.log('[authService] Login failed: No matching user found');
        return null;
    },

    async initialize() {
        console.log('[authService] Initializing authentication service...');
        // Initialize default staff if needed
        try {
            await staffService.initializeDefaultStaff();
            console.log('[authService] Default staff initialization complete');
        } catch (error) {
            console.error('[authService] Failed to initialize default staff:', error);
            throw error;
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

        // ADMIN and TECH have all permissions
        if (user.role === 'ADMIN' || user.role === 'TECH') return true;

        // Check individual permissions
        if (user.permissions) {
            return user.permissions[permission] || false;
        }

        // Fallback: check staff permissions
        try {
            const permissions = await staffService.getStaffPermissions(user.id);
            return permissions[permission] || false;
        } catch (error) {
            console.error('Error checking permissions:', error);
            return false;
        }
    },

    // Method to authenticate clients (used by kiosk mode or special client access points)
    async authenticateClient(clientId: string, pin?: string): Promise<User | null> {
        try {
            // For now, only allow PIN-based client authentication through main auth system
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
