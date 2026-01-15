import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { PERMISSION_ITEMS, PermissionKey, permissionService } from './permissionService';

export interface StaffMember {
    id: string;
    name: string;
    pin: string; // 4-digit PIN for login
    role: string; // Keep role for UI grouping, but permissions override it
    permissions: Record<PermissionKey, boolean>;
    photoUrl?: string; // Profile picture URL
    rtn?: string; // Registro Tributario Nacional (Honduras)
    dpi?: string; // Documento de Identidad Personal
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export const staffService = {
    async createStaff(data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) {
        const db = await getDB();
        const id = uuidv4();

        const newStaff: StaffMember = {
            ...data,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        await db.add('staff', newStaff);
        await logEvent('STAFF_CREATED', newStaff);

        return newStaff;
    },

    async getAllStaff() {
        const db = await getDB();
        return db.getAll('staff');
    },

    async getStaff(id: string) {
        const db = await getDB();
        return db.get('staff', id);
    },

    async updateStaff(id: string, data: Partial<Omit<StaffMember, 'id' | 'createdAt'>>) {
        const db = await getDB();
        const staff = await db.get('staff', id);
        if (!staff) throw new Error('Staff member not found');

        const updatedStaff = {
            ...staff,
            ...data,
            updatedAt: new Date().toISOString()
        };

        await db.put('staff', updatedStaff);
        await logEvent('STAFF_UPDATED', updatedStaff);
        return updatedStaff;
    },

    async deleteStaff(id: string) {
        const db = await getDB();
        await db.delete('staff', id);
        await logEvent('STAFF_DELETED', { id });
    },

    async getStaffByPin(pin: string): Promise<StaffMember | null> {
        const db = await getDB();
        const allStaff = await db.getAll('staff');
        
        const staff = allStaff.find(s => s.pin === pin && s.isActive);
        return staff || null;
    },

    async getStaffPermissions(staffId: string): Promise<Record<string, boolean>> {
        const db = await getDB();
        const staff = await db.get('staff', staffId);
        
        if (!staff) {
            // Return default empty permissions
            const empty: Record<string, boolean> = {};
            PERMISSION_ITEMS.forEach(item => empty[item.id] = false);
            return empty;
        }

        return staff.permissions;
    },

    async updateStaffPermissions(staffId: string, permissions: Record<string, boolean>) {
        const db = await getDB();
        const staff = await db.get('staff', staffId);
        if (!staff) throw new Error('Staff member not found');

        const updatedStaff = {
            ...staff,
            permissions: permissions as Record<PermissionKey, boolean>,
            updatedAt: new Date().toISOString()
        };

        await db.put('staff', updatedStaff);
        await logEvent('STAFF_PERMISSIONS_UPDATED', updatedStaff);
        return updatedStaff;
    },

    // Initialize default staff members if none exist
    async initializeDefaultStaff() {
        const db = await getDB();
        const existingStaff = await db.getAll('staff');
        
        if (existingStaff.length === 0) {
            const defaultStaff = [
                {
                    name: 'Administrator',
                    pin: '0000',
                    role: 'ADMIN',
                    permissions: PERMISSION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {} as Record<PermissionKey, boolean>)
                },
                {
                    name: 'Head Trainer',
                    pin: '1111',
                    role: 'TRAINER',
                    permissions: {
                        view_financials: false,
                        manage_plans: false,
                        manage_clients: true,
                        manage_workouts: true,
                        check_in: true,
                        sync_data: false
                    } as Record<PermissionKey, boolean>
                },
                {
                    name: 'Front Desk',
                    pin: '2222',
                    role: 'FRONT_DESK',
                    permissions: {
                        view_financials: false,
                        manage_plans: false,
                        manage_clients: true,
                        manage_workouts: false,
                        check_in: true,
                        sync_data: false
                    } as Record<PermissionKey, boolean>
                }
            ];

            for (const staffData of defaultStaff) {
                await this.createStaff(staffData);
            }
        }
    }
};