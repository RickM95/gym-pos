import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const marketplaceService = {
    /**
     * Seeds initial vendors for Central American regional market.
     */
    async seedVendors() {
        const db = await getDB();
        const vendors = [
            { id: 'v1', name: 'Spartan Nutrition', category: 'Supplements', sponsored: true, referralLink: '#', commissionRate: 0.1, updatedAt: new Date().toISOString() },
            { id: 'v2', name: 'Iron Equip Central', category: 'Equipment', sponsored: false, referralLink: '#', commissionRate: 0.05, updatedAt: new Date().toISOString() },
            { id: 'v3', name: 'CleanGym Pro', category: 'Services', sponsored: false, referralLink: '#', commissionRate: 0.08, updatedAt: new Date().toISOString() }
        ];

        for (const vendor of vendors) {
            await db.put('vendors', vendor as any);
        }
    },

    /**
     * Tracks a click/lead for a vendor from a gym owner.
     */
    async trackLead(vendorId: string, locationId: string) {
        const db = await getDB();
        const leadId = `${vendorId}_${locationId}`;
        let lead = await db.get('marketplace_leads', leadId);

        if (!lead) {
            lead = {
                id: leadId,
                vendorId,
                locationId,
                clickCount: 1,
                conversionStatus: 'CLICKED',
                updatedAt: new Date().toISOString()
            };
        } else {
            lead.clickCount += 1;
            lead.updatedAt = new Date().toISOString();
        }

        await db.put('marketplace_leads', lead as any);
    },

    /**
     * Gets all vendors for the marketplace.
     */
    async getVendors() {
        const db = await getDB();
        return await db.getAll('vendors');
    }
};
