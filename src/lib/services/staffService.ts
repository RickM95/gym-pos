import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { PERMISSION_ITEMS, PermissionKey } from './permissionService';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';

import { cryptoUtils } from '../utils/cryptoUtils';

export interface StaffMember {
    id: string;
    locationId: string;
    companyId: string;
    name: string;
    username: string;
    pin: string;
    email?: string;
    phone?: string;
    role: string;
    permissions: Record<string, boolean>;
    photoUrl?: string;
    rtn?: string;
    dpi?: string;
    isActive: boolean;
    hireDate: string;
    terminationDate?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export const staffService = {
    async createStaff(data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'synced'> & { locationId?: string }) {
        const id = uuidv4();
        const now = new Date().toISOString();

        const username = data.username.toLowerCase().trim();
        const hashedPin = await cryptoUtils.hashCredential(data.pin);
        const newStaff: StaffMember = {
            ...data,
            locationId: data.locationId || 'main-gym',
            companyId: (data as any).companyId || 'global',
            hireDate: data.hireDate || now,
            username,
            pin: hashedPin,
            id,
            createdAt: now,
            updatedAt: now,
            isActive: true,
            synced: 0
        };

        // 1. Sync to Firebase (Fire-and-forget to prevent blocking local availability)
        const cloudSync = setDoc(doc(db, 'profiles', id), {
            id,
            name: data.name,
            username: data.username,
            pin: hashedPin,
            role: data.role,
            permissions: data.permissions,
            photoUrl: data.photoUrl || null,
            rtn: data.rtn || null,
            dpi: data.dpi || null,
            createdAt: now,
            updatedAt: now
        }).catch(error => {
            console.warn('[staffService] Background Firebase sync failed:', error);
        });

        const localDb = await getDB();
        await localDb.add('staff', newStaff);
        console.log('[staffService] Local record created for:', newStaff.username);
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
                const now = new Date().toISOString();

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    const staff: StaffMember = {
                        id: data.id,
                        locationId: data.locationId || 'main-gym',
                        companyId: data.companyId || 'global',
                        name: data.name,
                        username: (data.username || data.name.toLowerCase().replace(/\s+/g, '_')).toLowerCase(),
                        pin: data.pin,
                        email: data.email,
                        phone: data.phone,
                        role: data.role,
                        permissions: data.permissions,
                        photoUrl: data.photoUrl,
                        rtn: data.rtn,
                        dpi: data.dpi,
                        isActive: true,
                        hireDate: data.hireDate || data.createdAt || now,
                        terminationDate: data.terminationDate,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        synced: data.synced || 0
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
                    username: data.username,
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

    async getStaffByUsername(usernameInput: string): Promise<StaffMember | null> {
        const username = usernameInput.toLowerCase().trim();
        const localDb = await getDB();
        try {
            const staff = await localDb.getFromIndex('staff', 'by-username', username);
            if (staff) return staff;

            // Fallback: Manual Scan
            const allStaff = await localDb.getAll('staff');
            const found = allStaff.find(s => s.username === username);
            if (found) return found;
        } catch (error) {
            console.warn('[staffService] Index lookup failed, attempting manual scan...', error);
            try {
                const allStaff = await localDb.getAll('staff');
                return allStaff.find(s => s.username === username) || null;
            } catch (scanError) {
                console.error('[staffService] Manual scan failed:', scanError);
            }
        }

        // Fallback to Firebase search if online
        try {
            const q = query(collection(db, 'profiles'), where('username', '==', username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data() as any;
                return {
                    id: data.id,
                    name: data.name,
                    username: data.username,
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
            console.error('Firebase getStaffByUsername error:', error);
        }

        return null;
    },

    async updateStaff(id: string, data: Partial<Omit<StaffMember, 'id' | 'createdAt'>>) {
        const now = new Date().toISOString();

        // 1. Update Firebase
        try {
            const updates: any = { updatedAt: now };
            if (data.name) updates.name = data.name;
            if (data.username) {
                const normalized = data.username.toLowerCase().trim();
                updates.username = normalized;
                data.username = normalized;
            }
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
        console.log('[staffService] Local staff count:', existingStaff.length);

        if (existingStaff.length === 0) {
            console.log('[staffService] Starting primary seeding process...');
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
                if (hasCloudStaff) {
                    console.error('[staffService] Cloud data detected. Syncing to local cache...');
                    await this.getAllStaff();
                    console.error('[staffService] Cloud sync complete.');
                    // Don't return! We need the repair logic below to run.
                }
            } catch (e) {
                console.warn("[staffService] Cloud check skipped (likely offline or unauthorized). Falling back to local defaults.");
            }

            // 🛡️ SECURITY: Pass plaintext PIN to createStaff which handles hashing
            const defaultStaff = [
                {
                    name: 'Administrator',
                    username: 'admin',
                    pin: '0000', // Plaintext here, createStaff will hash it
                    role: 'ADMIN',
                    locationId: 'main-gym',
                    companyId: 'global',
                    hireDate: new Date().toISOString(),
                    permissions: PERMISSION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {} as Record<PermissionKey, boolean>)
                }
            ];

            for (const staffData of defaultStaff) {
                console.log('[staffService] Seeding default account:', staffData.username);
                await this.createStaff(staffData);
            }
            console.log('[staffService] Local seeding complete.');
        }

        // 🛡️ SECURITY: Migrate legacy staff (add username and hash plaintext PINs)
        const allStaff = await localDb.getAll('staff');
        for (const s of allStaff) {
            let changed = false;

            // 1. Username Migration
            if (!s.username || s.username === 'administrator') {
                console.log(`[staffService] Migrating/Normalizing username for ${s.name}`);
                // Special case for Administrator
                if (s.name === 'Administrator' || s.role === 'ADMIN' || s.username === 'administrator') {
                    s.username = 'admin';
                } else if (!s.username) {
                    s.username = s.name.toLowerCase().replace(/\s+/g, '_').toLowerCase();
                }
                changed = true;
            } else if (s.username !== s.username.toLowerCase()) {
                console.log(`[staffService] Normalizing username to lowercase for ${s.name}`);
                s.username = s.username.toLowerCase();
                changed = true;
            }

            // 2. legacy PIN Migration
            const isHashed = s.pin.length > 20 || s.pin.startsWith('dev-hash-');
            if (s.pin && !isHashed) {
                console.log(`[staffService] Migrating legacy PIN for ${s.name}`);
                const hashed = await cryptoUtils.hashCredential(s.pin);
                s.pin = hashed;
                changed = true;
            }

            if (changed) {
                console.log(`[staffService] Saving migrated record for ${s.name}...`);
                await localDb.put('staff', s);
                // 🛡️ SECURITY: Background sync to prevent initialization hang
                setDoc(doc(db, 'profiles', s.id), {
                    username: s.username,
                    pin: s.pin
                }, { merge: true }).catch(e => {
                    console.warn(`[staffService] Background migration sync failed for ${s.name}`);
                });
            }
        }

        // 🛡️ NUCLEAR REPAIR: Final Stand against identity issues
        const finalCheck = await localDb.getAll('staff');
        console.error('--- NUCLEAR REPAIR SCAN ---');
        console.error('Total Staff in Store:', finalCheck.length);

        let targetAdmin = finalCheck.find(s => s.username === 'admin' || s.role === 'ADMIN' || s.name === 'Administrator');

        if (targetAdmin) {
            console.error('Admin Identity Found:', targetAdmin.username);
            const correctHash = await cryptoUtils.hashCredential('0000');

            if (targetAdmin.pin !== correctHash || targetAdmin.username !== 'admin') {
                console.error('Repairing Admin Record...');
                targetAdmin.username = 'admin';
                targetAdmin.pin = correctHash;
                targetAdmin.isActive = true;
                await localDb.put('staff', targetAdmin);
                // Background sync
                setDoc(doc(doc(db, 'profiles', targetAdmin.id).parent, targetAdmin.id), {
                    username: 'admin',
                    pin: correctHash,
                    isActive: true,
                    role: 'ADMIN'
                }, { merge: true }).catch(() => { });
                console.error('Repair complete.');
            } else {
                console.error('Admin record is healthy.');
            }
        } else {
            console.error('CRITICAL: NO ADMIN RECORD FOUND. Re-running seeding logic...');
            await this.createStaff({
                name: 'Administrator',
                username: 'admin',
                pin: '0000',
                role: 'ADMIN',
                locationId: 'main-gym',
                companyId: 'global',
                hireDate: new Date().toISOString(),
                permissions: PERMISSION_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {} as any)
            });
        }
        console.error('---------------------------');
    }
};