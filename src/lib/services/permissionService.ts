import { getDB } from '../db';
import { UserRole } from './authService';

export interface PermissionConfig {
    itemName: string;
    label: string;
    defaultValue: boolean;
}

export const PERMISSION_ITEMS = [
    { id: 'view_financials', label: 'View Financials (Revenue)' },
    { id: 'manage_plans', label: 'Manage Plans' },
    { id: 'manage_clients', label: 'Create/Edit Clients' },
    { id: 'manage_workouts', label: 'Manage Workouts' },
    { id: 'check_in', label: 'Perform Check-in' },
    { id: 'sync_data', label: 'Access Sync Debugger' },
    { id: 'edit_photos', label: 'Edit Photos (Staff & Clients)' },
] as const;

export type PermissionKey = typeof PERMISSION_ITEMS[number]['id'];

// Default configuration
const DEFAULTS: Record<UserRole, Record<string, boolean>> = {
    ADMIN: {
        view_financials: true,
        manage_plans: true,
        manage_clients: true,
        manage_workouts: true,
        check_in: true,
        sync_data: true,
        edit_photos: true,
    },
    TRAINER: {
        view_financials: false,
        manage_plans: false,
        manage_clients: true, // Can view, but maybe limit editing in UI
        manage_workouts: true,
        check_in: true,
        sync_data: false,
        edit_photos: false,
    },
    STAFF: {
        view_financials: false,
        manage_plans: false,
        manage_clients: false,
        manage_workouts: false,
        check_in: true,
        sync_data: false,
        edit_photos: false,
    },
    CLIENT: {
        view_financials: false,
        manage_plans: false,
        manage_clients: false,
        manage_workouts: false,
        check_in: true, // Maybe self-checkin?
        sync_data: false,
        edit_photos: false,
    },
    TECH: {
        view_financials: true,
        manage_plans: true,
        manage_clients: true,
        manage_workouts: true,
        check_in: true,
        sync_data: true,
        edit_photos: true,
    },
    FRONT_DESK: {
        view_financials: false,
        manage_plans: false, // Maybe can sell plans?
        manage_clients: true,
        manage_workouts: false,
        check_in: true,
        sync_data: false,
        edit_photos: false,
    }
};

export const permissionService = {
    async getPermissions(role: UserRole): Promise<Record<string, boolean>> {
        // ADMIN & TECH always exercises full power
        if (role === 'ADMIN' || role === 'TECH') {
            const allTrue: Record<string, boolean> = {};
            PERMISSION_ITEMS.forEach(item => allTrue[item.id] = true);
            return allTrue;
        }

        // For non-admin roles, return defaults as fallback
        return DEFAULTS[role] || {};
    },

    async updatePermissions(role: UserRole, permissions: Record<string, boolean>) {
        // This method is kept for backward compatibility
        // Individual staff permissions should be managed through staffService
        const db = await getDB();
        await db.put('settings', {
            role,
            permissions,
            updatedAt: new Date().toISOString()
        });
    },

    // Get default permissions for a role
    getDefaultPermissions(role: UserRole): Record<string, boolean> {
        return DEFAULTS[role] || {};
    }
};
