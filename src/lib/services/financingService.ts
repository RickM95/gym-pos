import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface FinancedContract {
    id: string;
    clientId: string;
    totalAmount: number;
    installmentsTotal: number;
    installmentsPaid: number;
    status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'DEFAULTED';
    apr: number;
    updatedAt: string;
}

export const financingService = {
    /**
     * Initiates a financing request for a membership plan.
     */
    async requestFinancing(clientId: string, amount: number, installments: number): Promise<FinancedContract> {
        const db = await getDB();

        // Internal approval logic simulation
        // In real world, this would call a fintech API / Bureau
        const approvalChance = Math.random();
        const status = approvalChance > 0.3 ? 'APPROVED' : 'PENDING';

        const contract: FinancedContract = {
            id: uuidv4(),
            clientId,
            totalAmount: amount,
            installmentsTotal: installments,
            installmentsPaid: 0,
            status,
            apr: 12.5, // Fixed rate for gym-based credit
            updatedAt: new Date().toISOString()
        };

        await db.put('financed_contracts', contract);
        return contract;
    },

    /**
     * Records an installment payment.
     */
    async payInstallment(contractId: string): Promise<void> {
        const db = await getDB();
        const contract = await db.get('financed_contracts', contractId);
        if (!contract) throw new Error('Contract not found');

        contract.installmentsPaid += 1;
        if (contract.installmentsPaid >= contract.installmentsTotal) {
            contract.status = 'ACTIVE'; // Fully paid/settled context
        }

        contract.updatedAt = new Date().toISOString();
        await db.put('financed_contracts', contract);
    },

    /**
     * Gets active financed contracts for a gym or client.
     */
    async getContracts(clientId?: string) {
        const db = await getDB();
        if (clientId) {
            return await db.getAllFromIndex('financed_contracts', 'by-client', clientId);
        }
        return await db.getAll('financed_contracts');
    }
};
