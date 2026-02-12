import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface FinancedContract {
    id: string;
    locationId: string;
    clientId: string;
    contractNumber: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED' | 'CANCELLED';
    paymentHistory: any[];
    createdAt: string;
    updatedAt: string;
    synced: number;
    companyId: string;
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
        const status = approvalChance > 0.3 ? 'ACTIVE' : 'CANCELLED';

        const now = new Date();
        const startDate = now.toISOString();
        const endDate = new Date(now.setMonth(now.getMonth() + installments)).toISOString();
        const interestRate = 12.5;
        const monthlyPayment = (amount * (1 + interestRate / 100)) / installments;

        const { authService } = await import('./authService');
        const user = authService.getUser();

        const contract: FinancedContract = {
            id: uuidv4(),
            locationId: user?.locationId || 'main-gym',
            companyId: user?.companyId || 'global',
            clientId,
            contractNumber: `FC-${Date.now()}`,
            principalAmount: amount,
            interestRate,
            termMonths: installments,
            monthlyPayment,
            startDate,
            endDate,
            status,
            paymentHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
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

        // Add payment to history
        contract.paymentHistory.push({
            date: new Date().toISOString(),
            amount: contract.monthlyPayment,
            status: 'PAID'
        });

        // If all payments made (paymentHistory length equals termMonths), mark as PAID_OFF
        if (contract.paymentHistory.length >= contract.termMonths) {
            contract.status = 'PAID_OFF';
        }

        contract.updatedAt = new Date().toISOString();
        await db.put('financed_contracts', contract);
    },

    /**
     * Gets active financed contracts for a gym or client.
     */
    async getContracts(clientId?: string) {
        const db = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();

        if (clientId) {
            return await db.getAllFromIndex('financed_contracts', 'by-client', clientId);
        }

        if (user?.companyId) {
            return await db.getAllFromIndex('financed_contracts', 'by-company', user.companyId);
        }

        return await db.getAll('financed_contracts');
    }
};
