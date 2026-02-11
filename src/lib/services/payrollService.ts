import { getDB } from '../db';

/**
 * Service to manage staff shifts, payroll, and commissions.
 */
export const payrollService = {
    /**
     * Record a shift event (Clock-in, Break, Clock-out).
     */
    async recordShift(staffId: string, locationId: string, type: 'CLOCK_IN' | 'BREAK' | 'CLOCK_OUT', notes?: string): Promise<void> {
        const db = await getDB();
        const shift = {
            id: crypto.randomUUID(),
            staffId,
            locationId,
            type,
            startTime: new Date().toISOString(),
            notes,
            updatedAt: new Date().toISOString(),
            synced: 0
        };
        await db.put('shifts', shift as any);
    },

    /**
     * Calculate commissions for a staff member in a date range.
     */
    async calculateCommissions(staffId: string, startDate: string, endDate: string): Promise<number> {
        const db = await getDB();
        const commissions = await db.getAllFromIndex('commissions', 'by-staff', staffId);

        return commissions
            .filter(c => c.date >= startDate && c.date <= endDate && c.status === 'PENDING')
            .reduce((sum, c) => sum + c.amount, 0);
    },

    /**
     * Generate a commission record from a sale.
     */
    async trackSaleCommission(staffId: string, saleId: string, amount: number, percentage: number): Promise<void> {
        const db = await getDB();
        const commission = {
            id: crypto.randomUUID(),
            staffId,
            saleId,
            amount,
            percentage,
            type: 'SALE' as const,
            status: 'PENDING' as const,
            date: new Date().toISOString(),
            synced: 0
        };
        await db.put('commissions', commission as any);
    }
};
