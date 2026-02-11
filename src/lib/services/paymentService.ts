import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
    id: string;
    clientId: string;
    locationId: string;
    amount: number;
    status: 'PAID' | 'OPEN' | 'FAILED';
    dueDate: string;
    paymentDate?: string;
    attempts: number;
    updatedAt: string;
}

export const paymentService = {
    /**
     * Creates a new invoice for a member.
     */
    async createInvoice(clientId: string, locationId: string, amount: number): Promise<Invoice> {
        const db = await getDB();
        const invoice: Invoice = {
            id: uuidv4(),
            clientId,
            locationId,
            amount,
            status: 'OPEN',
            dueDate: new Date().toISOString(),
            attempts: 0,
            updatedAt: new Date().toISOString()
        };
        await db.put('invoices', invoice);
        return invoice;
    },

    /**
     * Simulates processing a recurring payment.
     * Includes dunning logic (max 3 attempts).
     */
    async processPayment(invoiceId: string): Promise<boolean> {
        const db = await getDB();
        const invoice = await db.get('invoices', invoiceId);
        if (!invoice) throw new Error('Invoice not found');

        // Simulate digital payment processing
        const success = Math.random() > 0.2; // 80% success rate for simulation

        if (success) {
            invoice.status = 'PAID';
            invoice.paymentDate = new Date().toISOString();
        } else {
            invoice.attempts += 1;
            if (invoice.attempts >= 3) {
                invoice.status = 'FAILED';
                // TODO: Trigger client suspension
            }
        }

        invoice.updatedAt = new Date().toISOString();
        await db.put('invoices', invoice);
        return success;
    },

    /**
     * Manual verification for bank transfers (Central American market specific).
     */
    async verifyManualPayment(invoiceId: string, reference: string): Promise<void> {
        const db = await getDB();
        const invoice = await db.get('invoices', invoiceId);
        if (!invoice) throw new Error('Invoice not found');

        invoice.status = 'PAID';
        invoice.paymentDate = new Date().toISOString();
        invoice.updatedAt = new Date().toISOString();
        // Log reference in metadata if needed
        await db.put('invoices', invoice);
    },

    /**
     * Gets revenue stats for a location.
     */
    async getRevenueStats(locationId: string) {
        const db = await getDB();
        const invoices = await db.getAllFromIndex('invoices', 'by-location', locationId);

        const paid = invoices.filter(i => i.status === 'PAID');
        const failed = invoices.filter(i => i.status === 'FAILED');

        return {
            totalVolume: paid.reduce((acc, curr) => acc + curr.amount, 0),
            successRate: (paid.length / (paid.length + failed.length || 1)) * 100,
            pendingVolume: invoices.filter(i => i.status === 'OPEN').reduce((acc, curr) => acc + curr.amount, 0)
        };
    }
};
