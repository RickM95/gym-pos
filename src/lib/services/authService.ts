import { cryptoUtils } from '../utils/cryptoUtils';
import { staffService } from './staffService';
import { clientAuthService } from './clientAuthService';
import { marketplaceService } from './marketplaceService';
import { corporateService } from './corporateService';

export type UserRole = 'ADMIN' | 'TRAINER' | 'STAFF' | 'CLIENT' | 'TECH' | 'FRONT_DESK' | 'ACCOUNTANT' | 'AUDITOR' | 'PLATFORM_ADMIN';

export interface User {
    id: string;
    name: string;
    username: string; // Add username for identity-based flows
    role: UserRole;
    locationId: string;
    companyId: string;
    linkedClientId?: string;
    permissions?: Record<string, boolean>; // Individual permissions for staff
    photoUrl?: string; // Profile picture URL
    isActive: boolean;
}

const SESSION_KEY = 'gym_platform_user';
const FAILED_ATTEMPTS_KEY = 'auth_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000; // 30 seconds

export const authService = {
    async login(identifier: string, pin: string): Promise<User | null> {
        const username = identifier.toLowerCase().trim();
        console.log('[authService] Secure login attempt for:', username);

        // 1. Rate Limiting Check
        const status = (this as any).getLockoutStatus();
        if (status.isLocked) {
            const remaining = Math.ceil((status.unlockTime - Date.now()) / 1000);
            throw new Error(`Too many failed attempts. Try again in ${remaining}s.`);
        }

        // 2. Check Staff Profiles
        try {
            const staff = await staffService.getStaffByUsername(username);

            if (staff && staff.isActive) {
                const isValid = await cryptoUtils.verifyCredential(pin, staff.pin);
                if (isValid) {
                    (this as any).resetFailedAttempts();
                    const user: User = {
                        id: staff.id,
                        name: staff.name,
                        username: staff.username,
                        role: staff.role as UserRole,
                        locationId: staff.locationId,
                        companyId: staff.companyId,
                        isActive: staff.isActive,
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

            // EMERGENCY FALLBACK: Manual Scan if StaffService fails
            try {
                const { getDB } = await import('../db');
                const localDb = await getDB();
                if (localDb.objectStoreNames.contains('staff')) {
                    console.warn('[authService] PROCEEDING WITH EMERGENCY MANUAL SCAN');
                    const allStaff = await localDb.getAll('staff');
                    const staff = allStaff.find(s => s.username === username && s.isActive);
                    if (staff) {
                        const isValid = await cryptoUtils.verifyCredential(pin, staff.pin);
                        if (isValid) {
                            const user: User = {
                                id: staff.id,
                                name: staff.name,
                                username: staff.username,
                                role: staff.role as any,
                                locationId: staff.locationId,
                                companyId: staff.companyId,
                                isActive: staff.isActive,
                                permissions: staff.permissions
                            };
                            return user;
                        }
                    }
                }
            } catch (fallbackError) {
                console.error('[authService] Emergency fallback also failed:', fallbackError);
            }

            if (error instanceof Error && error.message.includes('attempts')) throw error;
        }

        // 3. Check Platform Admin
        try {
            const { platformAdminService } = await import('./platformAdminService');
            // Use PIN validation for platform admins
            const platformAdmin = await platformAdminService.validatePlatformAdminPin(username, pin);

            if (platformAdmin) {
                (this as any).resetFailedAttempts();
                const user: User = {
                    id: platformAdmin.id,
                    name: platformAdmin.name,
                    username: platformAdmin.username,
                    role: 'PLATFORM_ADMIN',
                    locationId: 'platform',
                    companyId: 'platform',
                    isActive: platformAdmin.isActive,
                    photoUrl: platformAdmin.photoUrl
                };

                if (typeof window !== 'undefined') {
                    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                }
                return user;
            }
        } catch (error) {
            console.error('[authService] Platform admin login error:', error);
        }

        (this as any).recordFailedAttempt();
        return null;
    },

    async loginWithPassword(identifier: string, password: string): Promise<User | null> {
        const username = identifier.toLowerCase().trim();
        console.log('[authService] Password login attempt for:', username);

        try {
            const { platformAdminService } = await import('./platformAdminService');
            // Use Password validation for platform admins
            const platformAdmin = await platformAdminService.validatePlatformAdmin(username, password);

            if (platformAdmin) {
                (this as any).resetFailedAttempts();
                const user: User = {
                    id: platformAdmin.id,
                    name: platformAdmin.name,
                    username: platformAdmin.username,
                    role: 'PLATFORM_ADMIN',
                    locationId: 'platform',
                    companyId: 'platform',
                    isActive: platformAdmin.isActive,
                    photoUrl: platformAdmin.photoUrl
                };

                if (typeof window !== 'undefined') {
                    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                }
                return user;
            }
        } catch (error) {
            console.error('[authService] Platform admin password login error:', error);
        }

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
        // 🔓 EMERGENCY BYPASS: Clear failed attempts immediately on initialization
        if (typeof window !== 'undefined') {
            (this as any).resetFailedAttempts();
        }

        // Initialize default staff and ecosystem data in background
        // We don't await this so the UI can load immediately
        this.runBackgroundInitialization().catch(err => {
            console.error('[authService] Background initialization failed:', err);
        });
    },

    async runBackgroundInitialization() {
        try {
            await staffService.initializeDefaultStaff();

            // SaaS Ecosystem Seeding
            const marketplaceSeed = marketplaceService.getVendors().then(async (v) => {
                if (v.length === 0) await marketplaceService.seedVendors();
            });
            const corporateSeed = corporateService.getCorporations().then(async (c) => {
                if (c.length === 0) await corporateService.seedCorporations();
            });

            await Promise.all([marketplaceSeed, corporateSeed]);
        } catch (error) {
            console.error('[authService] Background init error:', error);
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
                    username: result.client.id, // Use ID as username for clients
                    role: 'CLIENT',
                    locationId: result.client.locationId || 'main-gym',
                    companyId: result.client.companyId || 'global',
                    isActive: true,
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
