import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';

export interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    updatedAt: string;
    synced: number;
}

export interface Subscription {
    id: string;
    clientId: string;
    planId: string;
    planName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    paymentMethod: 'CASH' | 'TRANSFER' | 'POS' | 'COMPLIMENTARY';
    paymentAmount: number;
    paymentReference?: string;
    paymentImage?: string;
    adminName?: string;
    updatedAt: string;
    synced: number;
}

export const subscriptionService = {
    // --- PLANS ---
    async createPlan(data: Omit<Plan, 'id' | 'updatedAt' | 'synced'>) {
        const id = uuidv4();
        const now = new Date().toISOString();
        const plan: Plan = {
            ...data,
            id,
            updatedAt: now,
            synced: 1
        };

        try {
            await setDoc(doc(db, 'plans', id), {
                id,
                name: data.name,
                price: data.price,
                durationDays: data.durationDays,
                updatedAt: now
            });
        } catch (error) {
            console.error('Firebase createPlan error:', error);
            plan.synced = 0;
        }

        const localDb = await getDB();
        await localDb.add('plans', plan);
        await logEvent('PLAN_CREATED', plan);
        return plan;
    },

    async getPlans() {
        try {
            const querySnapshot = await getDocs(collection(db, 'plans'));
            if (!querySnapshot.empty) {
                const plans: Plan[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('plans', 'readwrite');
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as any;
                    const plan: Plan = {
                        id: doc.id,
                        name: data.name,
                        price: data.price,
                        durationDays: data.durationDays,
                        updatedAt: data.updatedAt,
                        synced: 1
                    };
                    plans.push(plan);
                    tx.store.put(plan);
                });
                await tx.done;
                return plans;
            }
        } catch (error) {
            console.error('Firebase getPlans error:', error);
        }

        const localDb = await getDB();
        return localDb.getAll('plans');
    },

    // --- SUBSCRIPTIONS ---
    async assignSubscription(
        clientId: string,
        planId: string,
        paymentDetails: {
            method: 'CASH' | 'TRANSFER' | 'POS' | 'COMPLIMENTARY',
            amount: number,
            reference?: string,
            image?: string,
            durationDays?: number,
            adminName?: string
        }
    ) {
        let planName = "Custom / Complimentary";
        let durationDays = paymentDetails.durationDays || 30;

        if (planId !== 'complimentary') {
            const plans = await this.getPlans();
            const plan = plans.find(p => p.id === planId);
            if (!plan) throw new Error("Plan not found");
            planName = plan.name;
            if (!paymentDetails.durationDays) durationDays = plan.durationDays;
        } else {
            planName = paymentDetails.adminName
                ? `Direct Contract - ${paymentDetails.adminName}`
                : "Direct Contract";
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        const now = new Date().toISOString();
        const id = uuidv4();

        const subscription: Subscription = {
            id,
            clientId,
            planId,
            planName,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            paymentMethod: paymentDetails.method,
            paymentAmount: paymentDetails.amount,
            paymentReference: paymentDetails.reference,
            paymentImage: paymentDetails.image,
            adminName: paymentDetails.adminName,
            updatedAt: now,
            synced: 1
        };

        try {
            await setDoc(doc(db, 'subscriptions', id), {
                id,
                clientId,
                planId,
                planName,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                isActive: true,
                paymentMethod: paymentDetails.method,
                paymentAmount: paymentDetails.amount,
                paymentReference: paymentDetails.reference || null,
                paymentImage: paymentDetails.image || null,
                adminName: paymentDetails.adminName || null,
                updatedAt: now
            });
        } catch (error) {
            console.error('Firebase assignSubscription error:', error);
            subscription.synced = 0;
        }

        const localDb = await getDB();
        await localDb.add('subscriptions', subscription);
        await logEvent('SUBSCRIPTION_CREATED', subscription);
        return subscription;
    },

    async getActiveSubscription(clientId: string): Promise<Subscription | null> {
        try {
            const q = query(
                collection(db, 'subscriptions'),
                where('clientId', '==', clientId),
                where('isActive', '==', true),
                where('endDate', '>', new Date().toISOString()),
                orderBy('endDate', 'desc'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data() as any;
                return {
                    id: data.id,
                    clientId: data.clientId,
                    planId: data.planId,
                    planName: data.planName,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isActive: data.isActive,
                    paymentMethod: data.paymentMethod,
                    paymentAmount: data.paymentAmount,
                    paymentReference: data.paymentReference,
                    paymentImage: data.paymentImage,
                    adminName: data.adminName,
                    updatedAt: data.updatedAt,
                    synced: 1
                };
            }
        } catch (error) {
            console.error('Firebase getActiveSubscription error:', error);
        }

        const localDb = await getDB();
        const allSubs = await localDb.getAllFromIndex('subscriptions', 'by-client', clientId);
        const now = new Date();
        const activeSubs = (allSubs as Subscription[]).filter(sub => sub.isActive && new Date(sub.endDate) > now);
        return activeSubs.length > 0 ? activeSubs.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] : null;
    },

    async getExpiringSubscriptions(daysAhead: number = 7): Promise<Subscription[]> {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        try {
            const q = query(
                collection(db, 'subscriptions'),
                where('isActive', '==', true),
                where('endDate', '>', now.toISOString()),
                where('endDate', '<=', futureDate.toISOString()),
                orderBy('endDate')
            );
            const querySnapshot = await getDocs(q);
            const subs: Subscription[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as any;
                subs.push({
                    id: data.id,
                    clientId: data.clientId,
                    planId: data.planId,
                    planName: data.planName,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isActive: data.isActive,
                    paymentMethod: data.paymentMethod,
                    paymentAmount: data.paymentAmount,
                    paymentReference: data.paymentReference,
                    paymentImage: data.paymentImage,
                    adminName: data.adminName,
                    updatedAt: data.updatedAt,
                    synced: 1
                });
            });
            return subs;
        } catch (error) {
            console.error('Firebase getExpiringSubscriptions error:', error);
        }

        const localDb = await getDB();
        const allSubs = await localDb.getAll('subscriptions');
        return (allSubs as Subscription[]).filter(sub => {
            const end = new Date(sub.endDate);
            return sub.isActive && end > now && end <= futureDate;
        }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    },

    async getAllClientSubscriptions(clientId: string): Promise<Subscription[]> {
        try {
            const q = query(
                collection(db, 'subscriptions'),
                where('clientId', '==', clientId),
                orderBy('startDate', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const subs: Subscription[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as any;
                subs.push({
                    id: data.id,
                    clientId: data.clientId,
                    planId: data.planId,
                    planName: data.planName,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    isActive: data.isActive,
                    paymentMethod: data.paymentMethod,
                    paymentAmount: data.paymentAmount,
                    paymentReference: data.paymentReference,
                    paymentImage: data.paymentImage,
                    adminName: data.adminName,
                    updatedAt: data.updatedAt,
                    synced: 1
                });
            });
            return subs;
        } catch (error) {
            console.error('Firebase getAllClientSubscriptions error:', error);
        }

        const localDb = await getDB();
        const allSubs = await localDb.getAllFromIndex('subscriptions', 'by-client', clientId);
        return (allSubs as Subscription[]).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }
};
