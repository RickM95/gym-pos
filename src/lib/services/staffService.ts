import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { PERMISSION_ITEMS, PermissionKey } from './permissionService';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';

import { cryptoUtils } from '../utils/cryptoUtils';

export interface StaffMember {
    id: string;
    name: string;
    pin: string; // Hashed PIN for login
    role: string;
    permissions: Record<PermissionKey, boolean>;
    photoUrl?: string;
    rtn?: string;
    dpi?: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export const staffService = {
    async createStaff(data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) {
        const id = uuidv4();
        const now = new Date().toISOString();

        // 🛡️ SECURITY: Hash PIN before storage
        const hashedPin = await cryptoUtils.hashCredential(data.pin);

        const newStaff: StaffMember = {
            ...data,
            pin: hashedPin,
            id,
            createdAt: now,
            updatedAt: now,
            isActive: true
        };

        // 1. Sync to Firebase
        try {
            await setDoc(doc(db, 'profiles', id), {
                id,
                name: data.name,
                pin: hashedPin,
                role: data.role,
                permissions: data.permissions,
                photoUrl: data.photoUrl || null,
                rtn: data.rtn || null,
                dpi: data.dpi || null,
                createdAt: now,
                updatedAt: now
            });
        } catch (error) {
            console.error('Failed to sync staff to Firebase:', error);
        }

        const localDb = await getDB();
        await localDb.add('staff', newStaff);
        await logEvent('STAFF_CREATED', newStaff);

        return newStaff;
    },

    async getAllStaff() {
        try {
            const querySnapshot = await getDocs(collection(db, 'profiles'));
            if (!querySnapshot.empty) {
                const staffMembers: StaffMember[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('staff', 'readwrite');

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    const staff: StaffMember = {
                        id: data.id,
                        name: data.name,
                        pin: data.pin,
                        role: data.role,
                        permissions: data.permissions,
                        photoUrl: data.photoUrl,
                        rtn: data.rtn,
                        dpi: data.dpi,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        isActive: true
                    };
                    staffMembers.push(staff);
                    tx.store.put(staff);
                });
                await tx.done;
                return staffMembers;
            }
        } catch (error) {
            console.error('Firebase getAllStaff error:', error);
        }

        const localDb = await getDB();
        return localDb.getAll('staff');
    },

    async getStaff(id: string) {
        try {
            const docSnap = await getDoc(doc(db, 'profiles', id));
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                return {
                    id: data.id,
                    name: data.name,
                    pin: data.pin,
                    role: data.role,
                    permissions: data.permissions,
                    photoUrl: data.photoUrl,
                    rtn: data.rtn,
                    dpi: data.dpi,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    isActive: true
                } as StaffMember;
            }
        } catch (error) {
            console.error('Firebase getStaff error:', error);
        }

        const localDb = await getDB();
        return localDb.get('staff', id);
    },

    async updateStaff(id: string, data: Partial<Omit<StaffMember, 'id' | 'createdAt'>>) {
        const now = new Date().toISOString();

        // 1. Update Firebase
        try {
            const updates: any = { updatedAt: now };
            if (data.name) updates.name = data.name;
            if (data.pin) {
                // 🛡️ SECURITY: Hash PIN before update
                const hashedPin = await cryptoUtils.hashCredential(data.pin);
                updates.pin = hashedPin;
                data.pin = hashedPin;
            }
            if (data.role) updates.role = data.role;
            if (data.permissions) updates.permissions = data.permissions;
            if (data.photoUrl) updates.photoUrl = data.photoUrl;
            if (data.rtn) updates.rtn = data.rtn;
            if (data.dpi) updates.dpi = data.dpi;

            await updateDoc(doc(db, 'profiles', id), updates);
        } catch (error) {
            console.error('Firebase updateStaff error:', error);
        }

        // 2. Update Local
        const localDb = await getDB();
        const staff = await localDb.get('staff', id);
        if (!staff) throw new Error('Staff member not found');

        const updatedStaff = {
            ...staff,
            ...data,
            updatedAt: now
        };

        await localDb.put('staff', updatedStaff);
        await logEvent('STAFF_UPDATED', updatedStaff);
        return updatedStaff;
    },

    async deleteStaff(id: string) {
        try {
            await deleteDoc(doc(db, 'profiles', id));
        } catch (error) {
            console.error('Firebase deleteStaff error:', error);
        }

        const localDb = await getDB();
        await localDb.delete('staff', id);
        await logEvent('STAFF_DELETED', { id });
    },

    async initializeDefaultStaff() {
        const localDb = await getDB();
        const existingStaff = await localDb.getAll('staff');

        if (existingStaff.length === 0) {
            // Also check Firebase with timeout to prevent hanging
            try {
                const checkFirebase = async () => {
                    const snapshot = await getDocs(collection(db, 'profiles'));
                    return !snapshot.empty;
                };

                const timeout = new Promise<boolean>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                );

                const hasCloudStaff = await Promise.race([checkFirebase(), timeout]);
                if (hasCloudStaff) return;
            } catch (e) {
                console.warn("Could not check Firebase for default staff (offline or blocked), relying on local check");
            }

            // 🛡️ SECURITY: Pass plaintext PIN to createStaff which handles hashing
            const defaultStaff = [
                {
                    name: 'Administrator',
                    pin: '0000', // Plaintext here, createStaff will hash it
                    role: 'ADMIN',
                    permissions: PERMISSION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {} as Record<PermissionKey, boolean>)
                }
            ];

            for (const staffData of defaultStaff) {
                await this.createStaff(staffData);
            }
        }

        // 🛡️ SECURITY: Migrate legacy plaintext PINs to hashed format
        const allStaff = await localDb.getAll('staff');
        for (const s of allStaff) {
            if (s.pin && s.pin.length < 20) {
                console.log(`[staffService] Migrating legacy PIN for ${s.name}`);
                const hashed = await cryptoUtils.hashCredential(s.pin);
                s.pin = hashed;
                await localDb.put('staff', s);
                try {
                    await updateDoc(doc(db, 'profiles', s.id), { pin: hashed });
                } catch (e) {
                    console.warn(`[staffService] Firebase PIN migration skipped for ${s.name} (offline)`);
                }
            }
        }

        // 🛡️ SECURITY: Repair double-hashed Administrator PIN if necessary
        const admin = allStaff.find(s => s.name === 'Administrator' && s.role === 'ADMIN');
        if (admin) {
            const singleHash = await cryptoUtils.hashCredential('0000');
            const doubleHash = await cryptoUtils.hashCredential(singleHash);

            if (admin.pin === doubleHash) {
                console.log(`[staffService] Detected double-hashed admin PIN. Repairing...`);
                admin.pin = singleHash;
                await localDb.put('staff', admin);
                try {
                    await updateDoc(doc(db, 'profiles', admin.id), { pin: singleHash });
                } catch (e) { }
            }
        }
    }
};