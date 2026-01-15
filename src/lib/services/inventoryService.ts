import { getDB } from '../db';
import { logEvent } from '../sync';

export interface InventoryCategory {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    sku: string;
    barcode?: string;
    unitPrice: number;
    costPrice: number;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    unit: string;
    supplier?: string;
    expiryDate?: string;
    batchNumber?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    rtn?: string;
    paymentTerms?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
    orderDate: string;
    expectedDeliveryDate?: string;
    actualDeliveryDate?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        total: number;
        receivedQuantity?: number;
    }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface InventoryTransaction {
    id: string;
    productId: string;
    transactionType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'EXPIRED';
    quantity: number;
    unitCost: number;
    totalCost: number;
    referenceId?: string;
    referenceType?: string;
    notes?: string;
    createdBy: string;
    createdAt: string;
    synced: number;
}

export interface Sale {
    id: string;
    clientId?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        total: number;
    }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
    paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
    saleDate: string;
    staffId: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export const inventoryService = {
    // --- CATEGORIES ---
    async getCategories(): Promise<InventoryCategory[]> {
        const db = await getDB();
        return db.getAll('inventory_categories');
    },

    async getCategory(id: string): Promise<InventoryCategory | undefined> {
        const db = await getDB();
        return db.get('inventory_categories', id);
    },

    async createCategory(category: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<InventoryCategory> {
        const db = await getDB();
        const id = `CAT-${Date.now()}`;
        const now = new Date().toISOString();
        
        const newCategory: InventoryCategory = {
            ...category,
            id,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('inventory_categories', newCategory);
        await logEvent('CATEGORY_CREATED', newCategory);
        
        return newCategory;
    },

    async updateCategory(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
        const db = await getDB();
        const category = await db.get('inventory_categories', id);
        if (!category) throw new Error('Category not found');

        const updatedCategory = {
            ...category,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('inventory_categories', updatedCategory);
        await logEvent('CATEGORY_UPDATED', updatedCategory);
        
        return updatedCategory;
    },

    // --- PRODUCTS ---
    async getProducts(categoryId?: string): Promise<Product[]> {
        const db = await getDB();
        if (categoryId) {
            return db.getAllFromIndex('products', 'by-category', categoryId);
        }
        return db.getAll('products');
    },

    async getProduct(id: string): Promise<Product | undefined> {
        const db = await getDB();
        return db.get('products', id);
    },

    async getProductBySKU(sku: string): Promise<Product | undefined> {
        const db = await getDB();
        return db.getFromIndex('products', 'by-sku', sku);
    },

    async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Product> {
        const db = await getDB();
        const id = `PROD-${Date.now()}`;
        const now = new Date().toISOString();
        
        const newProduct: Product = {
            ...product,
            id,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('products', newProduct);
        await logEvent('PRODUCT_CREATED', newProduct);
        
        return newProduct;
    },

    async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
        const db = await getDB();
        const product = await db.get('products', id);
        if (!product) throw new Error('Product not found');

        const updatedProduct = {
            ...product,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('products', updatedProduct);
        await logEvent('PRODUCT_UPDATED', updatedProduct);
        
        return updatedProduct;
    },

    async updateStock(productId: string, quantity: number, transactionType: InventoryTransaction['transactionType'], 
                     unitCost: number, createdBy: string, referenceId?: string, referenceType?: string, notes?: string): Promise<void> {
        const db = await getDB();
        const product = await db.get('products', productId);
        if (!product) throw new Error('Product not found');

        const newStock = transactionType === 'SALE' || transactionType === 'DAMAGE' || transactionType === 'EXPIRED' 
            ? product.currentStock - quantity 
            : product.currentStock + quantity;

        if (newStock < 0) throw new Error('Insufficient stock');

        // Update product stock
        await db.put('products', {
            ...product,
            currentStock: newStock,
            updatedAt: new Date().toISOString(),
            synced: 0
        });

        // Create inventory transaction
        const transaction: InventoryTransaction = {
            id: `TRANS-${Date.now()}`,
            productId,
            transactionType,
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
            referenceId,
            referenceType,
            notes,
            createdBy,
            createdAt: new Date().toISOString(),
            synced: 0
        };

        await db.add('inventory_transactions', transaction);
        await logEvent('STOCK_UPDATED', { productId, newStock, transactionType, quantity });
    },

    async getLowStockProducts(): Promise<Product[]> {
        const db = await getDB();
        const products = await db.getAll('products');
        return products.filter(p => p.currentStock <= p.minStockLevel && p.isActive);
    },

    // --- SUPPLIERS ---
    async getSuppliers(): Promise<Supplier[]> {
        const db = await getDB();
        return db.getAll('suppliers');
    },

    async getSupplier(id: string): Promise<Supplier | undefined> {
        const db = await getDB();
        return db.get('suppliers', id);
    },

    async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Supplier> {
        const db = await getDB();
        const id = `SUP-${Date.now()}`;
        const now = new Date().toISOString();
        
        const newSupplier: Supplier = {
            ...supplier,
            id,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('suppliers', newSupplier);
        await logEvent('SUPPLIER_CREATED', newSupplier);
        
        return newSupplier;
    },

    async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
        const db = await getDB();
        const supplier = await db.get('suppliers', id);
        if (!supplier) throw new Error('Supplier not found');

        const updatedSupplier = {
            ...supplier,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('suppliers', updatedSupplier);
        await logEvent('SUPPLIER_UPDATED', updatedSupplier);
        
        return updatedSupplier;
    },

    // --- PURCHASE ORDERS ---
    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        const db = await getDB();
        return db.getAll('purchase_orders');
    },

    async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
        const db = await getDB();
        return db.get('purchase_orders', id);
    },

    async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<PurchaseOrder> {
        const db = await getDB();
        const id = `PO-${Date.now()}`;
        const orderNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const now = new Date().toISOString();
        
        const newOrder: PurchaseOrder = {
            ...order,
            id,
            orderNumber,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('purchase_orders', newOrder);
        await logEvent('PURCHASE_ORDER_CREATED', newOrder);
        
        return newOrder;
    },

    async updatePurchaseOrder(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        const db = await getDB();
        const order = await db.get('purchase_orders', id);
        if (!order) throw new Error('Purchase order not found');

        const updatedOrder = {
            ...order,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('purchase_orders', updatedOrder);
        await logEvent('PURCHASE_ORDER_UPDATED', updatedOrder);
        
        return updatedOrder;
    },

    async receivePurchaseOrder(id: string, receivedItems: { productId: string; receivedQuantity: number }[], createdBy: string): Promise<PurchaseOrder> {
        const db = await getDB();
        const order = await db.get('purchase_orders', id);
        if (!order) throw new Error('Purchase order not found');

        // Update order items with received quantities
        const updatedItems = order.items.map(item => {
            const received = receivedItems.find(r => r.productId === item.productId);
            return {
                ...item,
                receivedQuantity: received?.receivedQuantity || 0
            };
        });

        // Update stock for received items
        for (const received of receivedItems) {
            const item = order.items.find(i => i.productId === received.productId);
            if (item && received.receivedQuantity > 0) {
                await this.updateStock(
                    received.productId,
                    received.receivedQuantity,
                    'PURCHASE',
                    item.unitPrice,
                    createdBy,
                    id,
                    'PURCHASE_ORDER'
                );
            }
        }

        // Check if all items are received
        const allReceived = updatedItems.every(item => item.receivedQuantity === item.quantity);
        const status = allReceived ? 'RECEIVED' : 'PARTIAL';

        const updatedOrder: PurchaseOrder = {
            ...order,
            items: updatedItems,
            status,
            actualDeliveryDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('purchase_orders', updatedOrder);
        await logEvent('PURCHASE_ORDER_RECEIVED', updatedOrder);
        
        return updatedOrder;
    },

    // --- INVENTORY TRANSACTIONS ---
    async getInventoryTransactions(productId?: string, startDate?: string, endDate?: string): Promise<InventoryTransaction[]> {
        const db = await getDB();
        let transactions: InventoryTransaction[];

        if (productId) {
            transactions = await db.getAllFromIndex('inventory_transactions', 'by-product', productId);
        } else {
            transactions = await db.getAll('inventory_transactions');
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            transactions = transactions.filter(t => {
                const date = new Date(t.createdAt);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }

        return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    // --- SALES ---
    async createSale(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Sale> {
        const db = await getDB();
        const id = `SALE-${Date.now()}`;
        const now = new Date().toISOString();
        
        const newSale: Sale = {
            ...sale,
            id,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('sales', newSale);

        // Update stock for sold items
        for (const item of sale.items) {
            await this.updateStock(
                item.productId,
                item.quantity,
                'SALE',
                0, // No cost for sales
                sale.staffId,
                id,
                'SALE'
            );
        }

        await logEvent('SALE_CREATED', newSale);
        
        return newSale;
    },

    async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
        const db = await getDB();
        let sales = await db.getAll('sales');

        // Filter by date range if provided
        if (startDate || endDate) {
            sales = sales.filter(s => {
                const date = new Date(s.saleDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }

        return sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    },

    // --- INVENTORY ANALYTICS ---
    async getInventoryValue(): Promise<{ totalCost: number; totalValue: number; potentialProfit: number }> {
        const db = await getDB();
        const products = await db.getAll('products');
        
        let totalCost = 0;
        let totalValue = 0;

        products.forEach(product => {
            if (product.isActive) {
                totalCost += product.currentStock * product.costPrice;
                totalValue += product.currentStock * product.unitPrice;
            }
        });

        return {
            totalCost,
            totalValue,
            potentialProfit: totalValue - totalCost
        };
    },

    async getTopSellingProducts(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
        const sales = await this.getSales(startDate, endDate);
        const productSales = new Map<string, { quantity: number; revenue: number }>();

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
                productSales.set(item.productId, {
                    quantity: existing.quantity + item.quantity,
                    revenue: existing.revenue + item.total
                });
            });
        });

        // Get product details
        const db = await getDB();
        const results = [];
        
        for (const [productId, sales] of productSales.entries()) {
            const product = await db.get('products', productId);
            if (product) {
                results.push({
                    product,
                    quantitySold: sales.quantity,
                    revenue: sales.revenue
                });
            }
        }

        return results.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    }
};