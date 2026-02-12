import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    themeSettings?: any;
    subscriptionPlan: string;
    featureFlags: {
        payroll?: boolean;
        advancedReports?: boolean;
        multiBranch?: boolean;
        auditLogs?: boolean;
        inventory?: boolean;
        scheduling?: boolean;
        marketplace?: boolean;
        financing?: boolean;
        academy?: boolean;
    };
    createdAt: string;
    status: 'active' | 'suspended';
    ownerId?: string;
}

export const companyService = {
    async createCompany(data: Omit<Company, 'id' | 'createdAt'>) {
        const id = uuidv4();
        const now = new Date().toISOString();

        const newCompany: Company = {
            ...data,
            id,
            createdAt: now,
            featureFlags: data.featureFlags || {}
        };

        // Sync to Firebase
        try {
            await setDoc(doc(db, 'companies', id), {
                ...newCompany,
                themeSettings: data.themeSettings || {},
                featureFlags: data.featureFlags || {}
            });
        } catch (error) {
            console.error('Firebase company creation error:', error);
        }

        // Save to Local DB
        const localDb = await getDB();
        await localDb.add('companies', newCompany);

        return newCompany;
    },

    async getAllCompanies() {
        try {
            const q = query(collection(db, 'companies'), orderBy('name'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const companies: Company[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('companies', 'readwrite');

                querySnapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    const company: Company = {
                        id: data.id,
                        name: data.name,
                        logoUrl: data.logoUrl,
                        themeSettings: data.themeSettings,
                        subscriptionPlan: data.subscriptionPlan,
                        featureFlags: data.featureFlags || {},
                        createdAt: data.createdAt,
                        status: data.status,
                        ownerId: data.ownerId
                    };
                    companies.push(company);
                    tx.store.put(company);
                });
                await tx.done;
                return companies;
            }
        } catch (error) {
            console.error('Firebase getCompanies error:', error);
        }

        const localDb = await getDB();
        return localDb.getAll('companies');
    },

    async getCompany(id: string) {
        try {
            const docSnap = await getDoc(doc(db, 'companies', id));
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                return {
                    id: data.id,
                    name: data.name,
                    logoUrl: data.logoUrl,
                    themeSettings: data.themeSettings,
                    subscriptionPlan: data.subscriptionPlan,
                    featureFlags: data.featureFlags || {},
                    createdAt: data.createdAt,
                    status: data.status,
                    ownerId: data.ownerId
                } as Company;
            }
        } catch (error) {
            console.error('Firebase getCompany error:', error);
        }

        const localDb = await getDB();
        return localDb.get('companies', id);
    },

    async updateCompany(id: string, data: Partial<Omit<Company, 'id' | 'createdAt'>>) {
        const now = new Date().toISOString();

        // Update Firebase
        try {
            const updates: any = {};
            if (data.name !== undefined) updates.name = data.name;
            if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
            if (data.themeSettings !== undefined) updates.themeSettings = data.themeSettings;
            if (data.subscriptionPlan !== undefined) updates.subscriptionPlan = data.subscriptionPlan;
            if (data.featureFlags !== undefined) updates.featureFlags = data.featureFlags;
            if (data.status !== undefined) updates.status = data.status;
            if (data.ownerId !== undefined) updates.ownerId = data.ownerId;
            updates.updatedAt = now;

            await updateDoc(doc(db, 'companies', id), updates);
        } catch (error) {
            console.error('Firebase updateCompany error:', error);
        }

        // Update Local
        const localDb = await getDB();
        const company = await localDb.get('companies', id);
        if (!company) throw new Error('Company not found');

        const updatedCompany = {
            ...company,
            ...data,
            updatedAt: now
        };

        await localDb.put('companies', updatedCompany);
        return updatedCompany;
    },

    async suspendCompany(id: string) {
        return this.updateCompany(id, { status: 'suspended' });
    },

    async activateCompany(id: string) {
        return this.updateCompany(id, { status: 'active' });
    },

    async getCompaniesByStatus(status: 'active' | 'suspended') {
        const localDb = await getDB();
        const allCompanies = await localDb.getAll('companies');
        return allCompanies.filter(company => company.status === status);
    },

    async getDefaultCompany(): Promise<Company | null> {
        // For migration: get first active company or create default
        const localDb = await getDB();
        const companies = await localDb.getAll('companies');
        const activeCompany = companies.find(c => c.status === 'active');
        if (activeCompany) return activeCompany;

        // Create default company if none exists
        if (companies.length === 0) {
            const defaultCompany = await this.createCompany({
                name: 'Default Gym',
                subscriptionPlan: 'premium',
                featureFlags: {
                    payroll: true,
                    advancedReports: true,
                    multiBranch: false,
                    auditLogs: true,
                    inventory: true,
                    scheduling: true,
                    marketplace: true,
                    financing: true,
                    academy: true
                },
                status: 'active'
            });
            return defaultCompany;
        }

        return companies[0];
    }
};