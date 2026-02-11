import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const corporateService = {
    /**
     * Registers a new corporate partner.
     */
    async registerCorporation(name: string, hrContact: string, flatDiscount: number, billingType: 'EMPLOYEE_PAYS' | 'CORP_PAYS') {
        const db = await getDB();
        const corp = {
            id: uuidv4(),
            name,
            hrContact,
            flatDiscount,
            billingType,
            isActive: true,
            updatedAt: new Date().toISOString()
        };
        await db.put('corporations', corp as any);
        return corp;
    },

    /**
     * Generates a monthly usage report for an employer.
     */
    async getUsageReport(corpId: string, locationId: string) {
        const db = await getDB();
        // In reality, we'd query checkins joined with clients that have a corpId
        // Simulating and returning flat stats
        return {
            activeEmployees: 45,
            totalCheckins: 320,
            avgVisitsPerEmployee: 7.1,
            totalBilling: 1250.00
        };
    },

    /**
     * Gets all corporate partners.
     */
    async getCorporations() {
        const db = await getDB();
        return await db.getAll('corporations');
    },

    /**
     * Seeds initial corporate partners for Central American regional market.
     */
    async seedCorporations() {
        const db = await getDB();
        const corps = [
            { id: 'c1', name: 'Global Tech Corp', hrContact: 'Ana Martinez', flatDiscount: 15, billingType: 'EMPLOYEE_PAYS', isActive: true, updatedAt: new Date().toISOString() },
            { id: 'c2', name: 'Innova Solutions', hrContact: 'Carlos Ruiz', flatDiscount: 10, billingType: 'CORP_PAYS', isActive: true, updatedAt: new Date().toISOString() },
            { id: 'c3', name: 'City Bank', hrContact: 'Elena Gomez', flatDiscount: 20, billingType: 'EMPLOYEE_PAYS', isActive: true, updatedAt: new Date().toISOString() }
        ];

        for (const corp of corps) {
            await db.put('corporations', corp as any);
        }
    }
};
