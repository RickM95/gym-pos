import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const trainerService = {
    /**
     * Creates a new digital product or PT package.
     */
    async createProduct(trainerId: string, name: string, price: number, type: 'PROGRAM' | 'COACHING' | 'PACKAGE') {
        const db = await getDB();
        const product = {
            id: uuidv4(),
            trainerId,
            name,
            price,
            type,
            isActive: true,
            updatedAt: new Date().toISOString()
        };
        await db.put('digital_products', product as any);
        return product;
    },

    /**
     * Records a sale and handles commission split (e.g., 70/30).
     */
    async processSale(productId: string, gymCommissionRate: number = 0.3) {
        const db = await getDB();
        const product = await db.get('digital_products', productId);
        if (!product) throw new Error('Product not found');

        const trainerId = product.trainerId;
        const totalAmount = product.price;
        const gymCut = totalAmount * gymCommissionRate;
        const trainerCut = totalAmount - gymCut;

        // Update trainer wallet
        let wallet = await db.get('trainer_wallets', trainerId);
        if (!wallet) {
            wallet = { 
                id: uuidv4(), 
                trainerId, 
                balance: 0, 
                currency: 'USD', 
                pendingAmount: 0, 
                lastPayoutDate: undefined, 
                payoutMethod: undefined, 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString(), 
                synced: 0 
            };
        }

        wallet.balance += trainerCut;
        wallet.updatedAt = new Date().toISOString();
        await db.put('trainer_wallets', wallet as any);

        return { trainerCut, gymCut };
    },

    /**
     * Gets all products for a trainer.
     */
    async getTrainerProducts(trainerId: string) {
        const db = await getDB();
        return await db.getAllFromIndex('digital_products', 'by-trainer', trainerId);
    }
};
