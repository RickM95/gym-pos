import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { cryptoUtils } from '../utils/cryptoUtils';

export interface PlatformAdmin {
    id: string;
    username: string;
    password: string;
    pin?: string; // Optional PIN for backward compatibility
    email: string;
    name: string;
    photoUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const platformAdminService = {
    /**
     * Check if platform admin setup is complete
     */
    async isPlatformAdminSetup(): Promise<boolean> {
        try {
            const db = await getDB();
            const admins = await db.getAll('platform_admins');
            return admins.length > 0 && admins.some(admin => admin.isActive);
        } catch (error) {
            console.error('[platformAdminService] Error checking setup:', error);
            return false;
        }
    },

    /**
     * Create platform admin account
     */
    async createPlatformAdmin(data: {
        username: string;
        password: string;
        pin: string;
        email: string;
        name: string;
    }): Promise<PlatformAdmin> {
        const id = uuidv4();
        const now = new Date().toISOString();
        const hashedPassword = await cryptoUtils.hashCredential(data.password);
        const hashedPin = await cryptoUtils.hashCredential(data.pin);

        const platformAdmin: PlatformAdmin = {
            id,
            username: data.username.toLowerCase().trim(),
            password: hashedPassword,
            pin: hashedPin,
            email: data.email.toLowerCase().trim(),
            name: data.name,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };

        const db = await getDB();
        await db.add('platform_admins', platformAdmin);

        console.log('[platformAdminService] Platform admin created:', platformAdmin.username);
        return platformAdmin;
    },

    /**
     * Validate platform admin credentials
     */
    async validatePlatformAdmin(username: string, password: string): Promise<PlatformAdmin | null> {
        try {
            const db = await getDB();
            const admins = await db.getAll('platform_admins');
            const admin = admins.find(a => a.username === username.toLowerCase().trim() && a.isActive);

            if (!admin) {
                return null;
            }

            const isValid = await cryptoUtils.verifyCredential(password, admin.password);
            return isValid ? admin : null;
        } catch (error) {
            console.error('[platformAdminService] Validation error:', error);
            return null;
        }
    },

    /**
     * Validate platform admin PIN
     */
    async validatePlatformAdminPin(username: string, pin: string): Promise<PlatformAdmin | null> {
        try {
            const db = await getDB();
            const admins = await db.getAll('platform_admins');
            const admin = admins.find(a => a.username === username.toLowerCase().trim() && a.isActive);

            if (!admin || !admin.pin) {
                return null;
            }

            const isValid = await cryptoUtils.verifyCredential(pin, admin.pin);
            return isValid ? admin : null;
        } catch (error) {
            console.error('[platformAdminService] PIN Validation error:', error);
            return null;
        }
    },

    /**
     * Get platform admin by ID
     */
    async getPlatformAdmin(id: string): Promise<PlatformAdmin | undefined> {
        const db = await getDB();
        return db.get('platform_admins', id);
    },

    /**
     * Update platform admin profile
     */
    async updatePlatformAdmin(id: string, updates: Partial<Omit<PlatformAdmin, 'id' | 'createdAt'>>): Promise<void> {
        const db = await getDB();
        const admin = await db.get('platform_admins', id);

        if (!admin) {
            throw new Error('Platform admin not found');
        }

        const updatedAdmin: PlatformAdmin = {
            ...admin,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await db.put('platform_admins', updatedAdmin);
    },

    /**
     * Change platform admin password
     */
    async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
        const db = await getDB();
        const admin = await db.get('platform_admins', id);

        if (!admin) {
            throw new Error('Platform admin not found');
        }

        // Verify current password
        const isValid = await cryptoUtils.verifyCredential(currentPassword, admin.password);
        if (!isValid) {
            return false;
        }

        // Hash and update new password
        const hashedPassword = await cryptoUtils.hashCredential(newPassword);
        admin.password = hashedPassword;
        admin.updatedAt = new Date().toISOString();

        await db.put('platform_admins', admin);
        return true;
    }
};
