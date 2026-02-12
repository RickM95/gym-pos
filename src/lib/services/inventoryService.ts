import { getDB } from '../db';
import { logEvent } from '../sync';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, query, where, orderBy, getCountFromServer } from 'firebase/firestore';

export interface InventoryCategory {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
    companyId: string;
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
    manufacturer?: string;
    expiryDate?: string;
    batchNumber?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    synced: number;
    locationId: string;
    companyId: string;
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
    locationId: string;
    companyId: string;
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
    companyId: string;
}

export interface Sale {
    id: string;
    locationId: string;
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
    companyId: string;
}

export const inventoryService = {
    // --- CATEGORIES ---
    async getCategories(): Promise<InventoryCategory[]> {
        try {
            const q = query(collection(db, 'inventory_categories'), orderBy('name'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const categories: InventoryCategory[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('inventory_categories', 'readwrite');

                const { authService } = await import('./authService');
                const user = authService.getUser();
                const companyId = user?.companyId || 'global';

                snapshot.forEach(doc => {
                    const data = doc.data() as any;
                    const category: InventoryCategory = {
                        id: data.id,
                        name: data.name,
                        description: data.description,
                        parentId: data.parentId,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        synced: 1,
                        companyId: data.companyId || companyId
                    };
                    categories.push(category);
                    tx.store.put(category);
                });
                await tx.done;
                return categories;
            }
        } catch (error) {
            console.error('Firebase getCategories error:', error);
        }

        const dbLocal = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = user?.companyId || 'global';

        const allCategories = await dbLocal.getAll('inventory_categories');
        // Ensure all categories have companyId for backward compatibility
        return allCategories.map(cat => ({
            ...cat,
            companyId: cat.companyId || companyId
        }));
    },

    async getCategory(id: string): Promise<InventoryCategory | undefined> {
        try {
            const docSnap = await getDoc(doc(db, 'inventory_categories', id));
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                return {
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    parentId: data.parentId,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    synced: 1,
                    companyId: data.companyId || 'global'
                };
            }
        } catch (error) {
            console.error('Firebase getCategory error:', error);
        }

        const dbLocal = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = user?.companyId || 'global';

        const category = await dbLocal.get('inventory_categories', id);
        if (!category) return undefined;

        // Ensure companyId exists for backward compatibility
        return {
            ...category,
            companyId: (category as any).companyId || companyId
        };
    },

    async createCategory(category: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'companyId'>): Promise<InventoryCategory> {
        const id = `CAT-${Date.now()}`;
        const now = new Date().toISOString();
        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = user?.companyId || 'global';

        const newCategory: InventoryCategory = {
            ...category,
            id,
            companyId,
            createdAt: now,
            updatedAt: now,
            synced: 1
        };

        try {
            await setDoc(doc(db, 'inventory_categories', id), {
                id,
                name: category.name,
                description: category.description || null,
                parentId: category.parentId || null,
                companyId,
                createdAt: now,
                updatedAt: now
            });
        } catch (error) {
            console.error('Firebase createCategory error:', error);
            newCategory.synced = 0;
        }

        const dbLocal = await getDB();
        await dbLocal.add('inventory_categories', newCategory);
        await logEvent('CATEGORY_CREATED', newCategory);

        return newCategory;
    },

    // --- SUPPLIERS ---
    async getSuppliers(): Promise<Supplier[]> {
        try {
            const q = query(collection(db, 'suppliers'), orderBy('name'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const suppliers: Supplier[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('suppliers', 'readwrite');

                snapshot.forEach(doc => {
                    const data = doc.data() as any;
                    const supplier: Supplier = {
                        id: data.id,
                        name: data.name,
                        contactPerson: data.contactPerson,
                        email: data.email,
                        phone: data.phone,
                        address: data.address,
                        rtn: data.rtn,
                        paymentTerms: data.paymentTerms,
                        isActive: data.isActive,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        synced: 1
                    };
                    suppliers.push(supplier);
                    tx.store.put(supplier);
                });
                await tx.done;
                return suppliers;
            }
        } catch (error) {
            console.error('Firebase getSuppliers error:', error);
        }

        const dbLocal = await getDB();
        return dbLocal.getAll('suppliers');
    },

    // --- PRODUCTS ---
    async getProducts(categoryId?: string): Promise<Product[]> {
        try {
            let q = query(collection(db, 'products'), orderBy('name'));
            if (categoryId) {
                q = query(collection(db, 'products'), where('categoryId', '==', categoryId), orderBy('name'));
            }

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const products: Product[] = [];
                // Not clearing local DB because we might be filtered
                snapshot.forEach(doc => {
                    const data = doc.data() as any;
                    const product: Product = {
                        id: data.id,
                        name: data.name,
                        description: data.description,
                        categoryId: data.categoryId,
                        sku: data.sku,
                        barcode: data.barcode,
                        unitPrice: data.unitPrice,
                        costPrice: data.costPrice,
                        currentStock: data.currentStock,
                        minStockLevel: data.minStockLevel,
                        maxStockLevel: data.maxStockLevel,
                        unit: data.unit,
                        manufacturer: data.manufacturer,
                        isActive: data.isActive,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        synced: 1,
                        locationId: data.locationId,
                        companyId: data.companyId || 'global'
                    };
                    products.push(product);
                });

                // Sync to local
                const dbLocal = await getDB();
                const tx = dbLocal.transaction('products', 'readwrite');
                for (const p of products) {
                    tx.store.put(p);
                }
                await tx.done;

                return products;
            }
        } catch (error) {
            console.error('Firebase getProducts error:', error);
        }

        const dbLocal = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();

        if (categoryId) {
            return dbLocal.getAllFromIndex('products', 'by-category', categoryId);
        }

        if (user?.companyId) {
            return dbLocal.getAllFromIndex('products', 'by-company', user.companyId);
        }

        return dbLocal.getAll('products');
    },

    async getLowStockProducts(): Promise<Product[]> {
        const products = await this.getProducts();
        return products.filter(p => p.currentStock <= p.minStockLevel && p.isActive);
    },

    async getProduct(id: string): Promise<Product | undefined> {
        try {
            const docSnap = await getDoc(doc(db, 'products', id));
            if (docSnap.exists()) {
                const data = docSnap.data() as any;
                return {
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    categoryId: data.categoryId,
                    sku: data.sku,
                    barcode: data.barcode,
                    unitPrice: data.unitPrice,
                    costPrice: data.costPrice,
                    currentStock: data.currentStock,
                    minStockLevel: data.minStockLevel,
                    maxStockLevel: data.maxStockLevel,
                    unit: data.unit,
                    manufacturer: data.manufacturer,
                    isActive: data.isActive,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    synced: 1,
                    locationId: data.locationId || 'main-gym',
                    companyId: data.companyId || 'global'
                } as Product;
            }
        } catch (error) {
            console.error('Firebase getProduct error:', error);
        }

        const dbLocal = await getDB();
        return dbLocal.get('products', id);
    },

    async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Product> {
        const id = `PROD-${Date.now()}`;
        const now = new Date().toISOString();
        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = user?.companyId || 'global';

        const newProduct: Product = {
            ...product,
            id,
            companyId: product.companyId || companyId,
            createdAt: now,
            updatedAt: now,
            synced: 1
        };

        try {
            await setDoc(doc(db, 'products', id), {
                id,
                name: product.name,
                description: product.description || null,
                categoryId: product.categoryId,
                sku: product.sku,
                barcode: product.barcode || null,
                unitPrice: product.unitPrice,
                costPrice: product.costPrice,
                currentStock: product.currentStock,
                minStockLevel: product.minStockLevel,
                maxStockLevel: product.maxStockLevel,
                unit: product.unit,
                supplier: product.supplier || null,
                expiryDate: product.expiryDate || null,
                batchNumber: product.batchNumber || null,
                isActive: product.isActive,
                locationId: product.locationId,
                companyId: product.companyId || companyId,
                createdAt: now,
                updatedAt: now
            });
        } catch (error) {
            console.error('Firebase createProduct error:', error);
            newProduct.synced = 0;
        }

        const dbLocal = await getDB();
        await dbLocal.add('products', newProduct);
        await logEvent('PRODUCT_CREATED', newProduct);

        return newProduct;
    },

    async updateStock(productId: string, quantity: number, transactionType: InventoryTransaction['transactionType'],
        unitCost: number, createdBy: string, referenceId?: string, referenceType?: string, notes?: string): Promise<void> {
        // ... (existing implementation)
        const product = await this.getProduct(productId);
        if (!product) throw new Error('Product not found');

        const newStock = transactionType === 'SALE' || transactionType === 'DAMAGE' || transactionType === 'EXPIRED'
            ? product.currentStock - quantity
            : product.currentStock + quantity;

        if (newStock < 0) throw new Error('Insufficient stock');

        const now = new Date().toISOString();
        const transactionId = `TRANS-${Date.now()}`;

        // 1. Update Firebase
        let firebaseSuccess = false;
        try {
            // Update product stock
            await updateDoc(doc(db, 'products', productId), {
                currentStock: newStock,
                updatedAt: now
            });

            // Create Transaction
            await setDoc(doc(db, 'inventory_transactions', transactionId), {
                id: transactionId,
                productId,
                transactionType,
                quantity,
                unitCost,
                totalCost: quantity * unitCost,
                referenceId: referenceId || null,
                referenceType: referenceType || null,
                notes: notes || null,
                createdBy,
                companyId: product.companyId,
                createdAt: now
            });
            firebaseSuccess = true;
        } catch (error) {
            console.error('Firebase updateStock error:', error);
        }

        // 2. Update Local
        const dbLocal = await getDB();
        await dbLocal.put('products', {
            ...product,
            currentStock: newStock,
            updatedAt: now,
            synced: firebaseSuccess ? 1 : 0,
            companyId: product.companyId
        });

        const transaction: InventoryTransaction = {
            id: transactionId,
            productId,
            transactionType,
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
            referenceId,
            referenceType,
            notes,
            createdBy,
            companyId: product.companyId,
            createdAt: now,
            synced: firebaseSuccess ? 1 : 0
        };

        await dbLocal.add('inventory_transactions', transaction);
        await logEvent('STOCK_UPDATED', { productId, newStock, transactionType, quantity });
    },

    // --- SALES ---
    async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
        try {
            let q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
            if (startDate && endDate) {
                // Note: This compound query requires an index in Firestore.
                // We will attempt it, but if it fails, we fall back to local filtering.
                q = query(collection(db, 'sales'),
                    where('saleDate', '>=', startDate),
                    where('saleDate', '<=', endDate),
                    orderBy('saleDate', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const sales: Sale[] = [];
                const localDb = await getDB();
                const tx = localDb.transaction('sales', 'readwrite');

                snapshot.forEach(doc => {
                    const data = doc.data() as any;
                    const sale: Sale = {
                        id: data.id,
                        locationId: data.locationId,
                        clientId: data.clientId,
                        items: data.items,
                        subtotal: data.subtotal,
                        taxRate: data.taxRate,
                        taxAmount: data.taxAmount,
                        total: data.total,
                        paymentMethod: data.paymentMethod,
                        paymentStatus: data.paymentStatus,
                        saleDate: data.saleDate,
                        staffId: data.staffId,
                        notes: data.notes,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        synced: 1,
                        companyId: data.companyId || 'global'
                    };
                    sales.push(sale);
                    tx.store.put(sale);
                });
                await tx.done;
                return sales;
            }
        } catch (error) {
            console.error('Firebase getSales error (offline or missing index?):', error);
        }

        const dbLocal = await getDB();
        const { authService } = await import('./authService');
        const user = authService.getUser();

        let sales = await dbLocal.getAll('sales');

        if (user?.companyId) {
            sales = await dbLocal.getAllFromIndex('sales', 'by-company', user.companyId);
        }

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

    async createSale(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Sale> {
        const id = `SALE-${Date.now()}`;
        const now = new Date().toISOString();

        const { authService } = await import('./authService');
        const user = authService.getUser();
        const companyId = sale.companyId || user?.companyId || 'global';

        const newSale: Sale = {
            ...sale,
            id,
            companyId,
            createdAt: now,
            updatedAt: now,
            synced: 1
        };

        // 1. Create Sale in Firebase
        try {
            await setDoc(doc(db, 'sales', id), {
                id,
                clientId: sale.clientId || null,
                items: sale.items,
                subtotal: sale.subtotal,
                taxRate: sale.taxRate,
                taxAmount: sale.taxAmount,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
                paymentStatus: sale.paymentStatus,
                saleDate: sale.saleDate,
                staffId: sale.staffId,
                notes: sale.notes || null,
                locationId: sale.locationId,
                companyId: newSale.companyId,
                createdAt: now,
                updatedAt: now
            });

            // Update stock for sold items handled via updateStock loop below, but updateStock also talks to Firebase.
            // This might cause double writes if we call updateStock which calls Firebase.
            // Ideally should be a transaction. For now we will rely on updateStock's own logic.
        } catch (error) {
            console.error('Firebase createSale error:', error);
            newSale.synced = 0;
        }

        // 2. Save Local
        const dbLocal = await getDB();
        await dbLocal.add('sales', newSale);

        // 3. Update stock for sold items
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
    }
};