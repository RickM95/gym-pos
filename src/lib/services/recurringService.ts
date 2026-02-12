import { getDB } from '../db';
import { logEvent } from '../sync';
import { Expense, analyticsService } from './analyticsService';
import { v4 as uuidv4 } from 'uuid';

export interface RecurringExpenseConfig {
    id: string;
    locationId: string;
    name: string; // e.g., "Gym Rent"
    amount: number;
    category: Expense['category'];
    originalAmount?: number; // For LOAN tracking
    interestRate?: number;    // For LOAN tracking
    vendor?: string;
    description?: string;
    frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
    dueDay: number; // Day of month (1-31) for Monthly
    isActive: boolean;
    lastPaidDate?: string;
    createdAt: string;
    updatedAt: string;
}

export const recurringService = {
    async getConfigs(): Promise<RecurringExpenseConfig[]> {
        const db = await getDB();
        return db.getAll('recurring_configs');
    },

    async addConfig(config: Omit<RecurringExpenseConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringExpenseConfig> {
        const db = await getDB();
        const now = new Date().toISOString();
        const newConfig: RecurringExpenseConfig = {
            ...config,
            locationId: config.locationId || 'main-gym',
            id: `REC-${uuidv4()}`,
            createdAt: now,
            updatedAt: now
        };
        await db.add('recurring_configs', newConfig);
        await logEvent('RECURRING_CONFIG_CREATED', newConfig);
        return newConfig;
    },

    async updateConfig(id: string, updates: Partial<RecurringExpenseConfig>): Promise<RecurringExpenseConfig> {
        const db = await getDB();
        const config = await db.get('recurring_configs', id);
        if (!config) throw new Error('Config not found');

        const updated = {
            ...config,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await db.put('recurring_configs', updated);
        await logEvent('RECURRING_CONFIG_UPDATED', updated);
        return updated;
    },

    async deleteConfig(id: string): Promise<void> {
        const db = await getDB();
        await db.delete('recurring_configs', id);
        await logEvent('RECURRING_CONFIG_DELETED', { id });
    },

    async processPayment(configId: string, paymentMethod: Expense['paymentMethod'], notes?: string): Promise<Expense> {
        const config = await (await getDB()).get('recurring_configs', configId);
        if (!config) throw new Error('Recurring config not found');

        // Create the actual expense
        const expense = await analyticsService.createExpense({
            description: `[Recurring] ${config.name}`,
            category: config.category,
            amount: config.amount,
            originalAmount: config.originalAmount,
            interestRate: config.interestRate,
            date: new Date().toISOString(),
            vendor: config.vendor,
            paymentMethod,
            notes: notes || `Auto-generated from recurring config: ${config.name}`,
            createdBy: 'system', // or current user
            locationId: config.locationId || 'main-gym'
        });

        // Update last paid date
        await this.updateConfig(configId, { lastPaidDate: new Date().toISOString() });

        return expense;
    },

    isDue(config: RecurringExpenseConfig): { isDue: boolean; dueDate: Date; daysOverdue: number } {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let dueDate = new Date();

        if (config.frequency === 'MONTHLY') {
            dueDate = new Date(currentYear, currentMonth, config.dueDay);
            // If due day is passed in current month, check if paid.
            // Actually, we want to know if it's due for THIS month.

            // If today is past the due day, it's due unless paid recently (this month)
            // If today is before due day, it's "upcoming"
        }

        // Simplified Logic: 
        // Calculate the NEXT due date relative to today.
        // If lastPaidDate is AFTER the previous due date, then we are good.

        // Let's stick to a simpler UI approach: Show "Due this month: Dec 15".
        // If lastPaidDate is in Dec, show "Paid".

        return {
            isDue: false, // UI will calculate status
            dueDate,
            daysOverdue: 0
        };
    }
};
