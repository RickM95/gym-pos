import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';

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
    updatedAt: string;
    synced: number;
}

export const subscriptionService = {
    // --- PLANS ---
    async createPlan(data: Omit<Plan, 'id' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const plan: Plan = {
            ...data,
            id: uuidv4(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };
        await db.add('plans', plan);
        await logEvent('PLAN_CREATED', plan);
        return plan;
    },

    async getPlans() {
        const db = await getDB();
        return db.getAll('plans');
    },

    // --- SUBSCRIPTIONS ---
    async assignSubscription(clientId: string, planId: string) {
        const db = await getDB();
        const plan = await db.get('plans', planId);
        if (!plan) throw new Error("Plan not found");

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        const subscription: Subscription = {
            id: uuidv4(),
            clientId,
            planId,
            planName: plan.name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        // Deactivate old active subscriptions for this user?
        // For MVP, we'll just add the new one. The check-in logic will look for ANY valid one.

        await db.add('subscriptions', subscription);
        await logEvent('SUBSCRIPTION_CREATED', subscription);
        return subscription;
    },

    async getActiveSubscription(clientId: string): Promise<Subscription | null> {
        const db = await getDB();
        const allSubs = await db.getAllFromIndex('subscriptions', 'by-client', clientId);

        const now = new Date();

        // Find one that is active AND not expired
        const activeFn = (sub: any) => {
            const end = new Date(sub.endDate);
            return sub.isActive && end > now;
        };

        // Return the latest active one
        const validSubs = (allSubs as Subscription[]).filter(activeFn).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        return validSubs.length > 0 ? validSubs[0] : null;
    },

    async getExpiringSubscriptions(daysAhead: number = 7): Promise<Subscription[]> {
        const db = await getDB();
        const allSubs = await db.getAll('subscriptions');
        
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        // Find active subscriptions that will expire within the specified timeframe
        const expiringSubs = (allSubs as Subscription[]).filter(sub => {
            const endDate = new Date(sub.endDate);
            return sub.isActive && endDate > now && endDate <= futureDate;
        });

        return expiringSubs.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    },

    async getAllClientSubscriptions(clientId: string): Promise<Subscription[]> {
        const db = await getDB();
        const allSubs = await db.getAllFromIndex('subscriptions', 'by-client', clientId);
        
        return (allSubs as Subscription[]).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }
};

export interface SubscriptionWithPlan extends Subscription {
    status?: string;
}
