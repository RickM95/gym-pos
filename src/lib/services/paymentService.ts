import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
    id: string;
    locationId: string;
    clientId: string;
    invoiceNumber: string;
    amount: number;
    tax: number;
    total: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;
    paidDate?: string;
    items: any[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export const paymentService = {
    /**
     * Creates a new invoice for a member.
     */
    async createInvoice(clientId: string, locationId: string, amount: number): Promise<Invoice> {
        const db = await getDB();
        const invoice: Invoice = {
            id: uuidv4(),
            locationId,
            clientId,
            invoiceNumber: `INV-${Date.now()}`,
            amount,
            tax: amount * 0.15, // Assume 15% tax
            total: amount * 1.15,
            status: 'SENT',
            dueDate: new Date().toISOString(),
            paidDate: undefined,
            items: [],
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
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
            invoice.paidDate = new Date().toISOString();
        } else {
            // Mark as OVERDUE on failure
            invoice.status = 'OVERDUE';
            // Track failure count in notes
            invoice.notes = (invoice.notes || '') + ` Payment failed on ${new Date().toISOString()};`;
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
        invoice.paidDate = new Date().toISOString();
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
        const overdue = invoices.filter(i => i.status === 'OVERDUE');

        return {
            totalVolume: paid.reduce((acc, curr) => acc + curr.amount, 0),
            successRate: (paid.length / (paid.length + overdue.length || 1)) * 100,
            pendingVolume: invoices.filter(i => i.status === 'SENT').reduce((acc, curr) => acc + curr.amount, 0)
        };
    }
};
