import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'gym-platform-db';
const DB_VERSION = 4;

export type DBSchemaV1 = {
    clients: {
        key: string;
        value: {
            id: string;
            name: string;
            email?: string;
            phone?: string;
            qrCode: string; // checksum
            notes?: string;
            updatedAt: string;
            synced: number; // 0: false, 1: true
        };
        indexes: { 'by-qr': string };
    };
    subscriptions: {
        key: string;
        value: {
            id: string;
            clientId: string;
            planId: string;
            startDate: string;
            endDate: string;
            isActive: boolean;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string };
    };
    checkins: {
        key: string;
        value: {
            id: string;
            clientId: string;
            timestamp: string;
            synced: number;
        };
        indexes: { 'by-client': string };
    };
    events: {
        key: string;
        value: {
            id: string;
            type: string;
            payload: any;
            timestamp: number;
            synced: number;
        };
        indexes: { 'by-synced': number };
    };
    plans: {
        key: string;
        value: {
            id: string;
            name: string;
            price: number;
            durationDays: number;
            updatedAt: string;
            synced: number;
        };
    };
    exercises: {
        key: string;
        value: {
            id: string;
            name: string;
            category: string;
            muscleGroup: string;
            videoUrl?: string;
            updatedAt: string;
            synced: number;
        };
    };
    workouts: {
        key: string;
        value: {
            id: string;
            name: string;
            exercises: { id: string; name: string; sets: number; reps: number; notes?: string }[];
            updatedAt: string;
            synced: number;
        };
    };
    sessions: {
        key: string;
        value: {
            id: string;
            clientId: string;
            workoutId: string;
            workoutName: string;
            date: string; // ISO Date
            logs: { exerciseId: string; exerciseName: string; setNumber: number; reps: number; weight: number; notes?: string }[];
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string };
    };
    settings: {
        key: string;
        value: {
            role: string;
            permissions: Record<string, boolean>;
            updatedAt: string;
        };
    };
    logs: {
        key: string;
        value: {
            id: string;
            type: 'ERROR' | 'BUG_REPORT';
            message: string;
            details?: string;
            user: string;
            role: string;
            timestamp: number;
            status: 'OPEN' | 'RESOLVED';
        };
        indexes: { 'by-type': string; 'by-timestamp': number };
    };
    workout_assignments: {
        key: string;
        value: {
            id: string;
            clientId: string;
            workoutId: string;
            assignedBy: string;
            assignedAt: string;
            notes?: string;
        };
        indexes: { 'by-client': string };
    };
    staff: {
        key: string;
        value: {
            id: string;
            name: string;
            pin: string;
            role: string;
            permissions: Record<string, boolean>;
            photoUrl?: string;
            createdAt: string;
            updatedAt: string;
            isActive: boolean;
        };
    };
    client_auth: {
        key: string;
        value: {
            clientId: string;
            password: string; // Hashed password
            pin: string; // 4-6 digit PIN
            biometricData?: {
                fingerprint?: string; // Template ID
                faceId?: string; // Template ID
            };
            createdAt: string;
            updatedAt: string;
            lastLogin?: string;
            loginAttempts: number;
            isLocked: boolean;
            lockUntil?: string;
        };
        indexes: { 'by-client': string };
    };
    tax_reports: {
        key: string;
        value: {
            id: string;
            reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'IVA' | 'ISR';
            reportDate: string;
            filingDate: string;
            reportingPeriod: {
                startDate: string;
                endDate: string;
            };
            institution: {
                name: string;
                rtn: string;
                cae?: string;
                address: string;
                phone: string;
                email: string;
                economicActivity: string;
            };
            taxSummary: {
                totalRevenue: number;
                taxableRevenue: number;
                exemptRevenue: number;
                ivaCollected: number;
                ivaPaid: number;
                isrWithheld: number;
                isrPaid: number;
                netTax: number;
            };
            details: {
                revenueByCategory: Record<string, number>;
                expensesByCategory: Record<string, number>;
                clientTransactions: Array<{
                    clientId: string;
                    clientName: string;
                    clientRTN?: string;
                    amount: number;
                    iva: number;
                    date: string;
                    service: string;
                }>;
                expenseTransactions: Array<{
                    vendorName: string;
                    vendorRTN?: string;
                    amount: number;
                    iva: number;
                    date: string;
                    category: string;
                }>;
            };
            status: 'DRAFT' | 'FILED' | 'ACKNOWLEDGED' | 'PAID' | 'CLOSED';
            declarationNumber?: string;
            paymentReference?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    };
    inventory_categories: {
        key: string;
        value: {
            id: string;
            name: string;
            description?: string;
            parentId?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-parent': string };
    };
    products: {
        key: string;
        value: {
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
        };
        indexes: { 'by-category': string; 'by-sku': string; 'by-supplier': string; 'low-stock': number };
    };
    suppliers: {
        key: string;
        value: {
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
        };
    };
    purchase_orders: {
        key: string;
        value: {
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
        };
        indexes: { 'by-supplier': string; 'by-status': string };
    };
    inventory_transactions: {
        key: string;
        value: {
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
        };
        indexes: { 'by-product': string; 'by-type': string; 'by-date': number };
    };
    sales: {
        key: string;
        value: {
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
        };
        indexes: { 'by-client': string; 'by-date': number; 'by-staff': string };
    };
    expenses: {
        key: string;
        value: {
            id: string;
            description: string;
            category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'EQUIPMENT' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'OTHER';
            amount: number;
            date: string;
            vendor?: string;
            invoiceNumber?: string;
            paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT';
            receipts?: string[];
            notes?: string;
            createdBy: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-category': string; 'by-date': number };
    };
    revenue_analytics: {
        key: string;
        value: {
            id: string;
            period: string;
            periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
            date: string;
            membershipRevenue: number;
            productSales: number;
            servicesRevenue: number;
            totalRevenue: number;
            operatingExpenses: number;
            netProfit: number;
            memberCount: number;
            newMembers: number;
            canceledMembers: number;
            averageRevenuePerMember: number;
            customerAcquisitionCost: number;
            lifetimeValue: number;
            created: string;
            synced: number;
        };
        indexes: { 'by-period': string; 'by-date': number };
    };
    // Add other stores as needed
};

let dbPromise: Promise<IDBPDatabase<DBSchemaV1>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<DBSchemaV1>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Clients
                if (!db.objectStoreNames.contains('clients')) {
                    const store = db.createObjectStore('clients', { keyPath: 'id' });
                    store.createIndex('by-qr', 'qrCode', { unique: true });
                }
                // Plans
                if (!db.objectStoreNames.contains('plans')) {
                    db.createObjectStore('plans', { keyPath: 'id' });
                }
                // Subscriptions
                if (!db.objectStoreNames.contains('subscriptions')) {
                    const store = db.createObjectStore('subscriptions', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                }
                // Exercises & Workouts
                if (!db.objectStoreNames.contains('exercises')) {
                    db.createObjectStore('exercises', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('workouts')) {
                    db.createObjectStore('workouts', { keyPath: 'id' });
                }
                // Sessions
                if (!db.objectStoreNames.contains('sessions')) {
                    const store = db.createObjectStore('sessions', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                }
                // Checkins
                if (!db.objectStoreNames.contains('checkins')) {
                    const store = db.createObjectStore('checkins', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                }
                // Events (Sync Queue)
                if (!db.objectStoreNames.contains('events')) {
                    const store = db.createObjectStore('events', { keyPath: 'id' });
                    store.createIndex('by-synced', 'synced');
                }
                // Settings (Permissions)
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'role' });
                }
                // Logs (Error Tracking)
                if (!db.objectStoreNames.contains('logs')) {
                    const store = db.createObjectStore('logs', { keyPath: 'id' });
                    store.createIndex('by-type', 'type');
                    store.createIndex('by-timestamp', 'timestamp');
                }
                // Workout Assignments
                if (!db.objectStoreNames.contains('workout_assignments')) {
                    const store = db.createObjectStore('workout_assignments', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                }
                // Staff
                if (!db.objectStoreNames.contains('staff')) {
                    db.createObjectStore('staff', { keyPath: 'id' });
                }
                // Client Authentication
                if (!db.objectStoreNames.contains('client_auth')) {
                    const store = db.createObjectStore('client_auth', { keyPath: 'clientId' });
                    store.createIndex('by-client', 'clientId');
                }
                // Tax Reports (Honduran SAR)
                if (!db.objectStoreNames.contains('tax_reports')) {
                    db.createObjectStore('tax_reports', { keyPath: 'id' });
                }
                // Inventory Categories
                if (!db.objectStoreNames.contains('inventory_categories')) {
                    const store = db.createObjectStore('inventory_categories', { keyPath: 'id' });
                    store.createIndex('by-parent', 'parentId');
                }
                // Products
                if (!db.objectStoreNames.contains('products')) {
                    const store = db.createObjectStore('products', { keyPath: 'id' });
                    store.createIndex('by-category', 'categoryId');
                    store.createIndex('by-sku', 'sku', { unique: true });
                    store.createIndex('by-supplier', 'supplier');
                    store.createIndex('low-stock', 'currentStock');
                }
                // Suppliers
                if (!db.objectStoreNames.contains('suppliers')) {
                    db.createObjectStore('suppliers', { keyPath: 'id' });
                }
                // Purchase Orders
                if (!db.objectStoreNames.contains('purchase_orders')) {
                    const store = db.createObjectStore('purchase_orders', { keyPath: 'id' });
                    store.createIndex('by-supplier', 'supplierId');
                    store.createIndex('by-status', 'status');
                }
                // Inventory Transactions
                if (!db.objectStoreNames.contains('inventory_transactions')) {
                    const store = db.createObjectStore('inventory_transactions', { keyPath: 'id' });
                    store.createIndex('by-product', 'productId');
                    store.createIndex('by-type', 'transactionType');
                    store.createIndex('by-date', 'createdAt');
                }
                // Sales
                if (!db.objectStoreNames.contains('sales')) {
                    const store = db.createObjectStore('sales', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                    store.createIndex('by-date', 'saleDate');
                    store.createIndex('by-staff', 'staffId');
                }
                // Expenses
                if (!db.objectStoreNames.contains('expenses')) {
                    const store = db.createObjectStore('expenses', { keyPath: 'id' });
                    store.createIndex('by-category', 'category');
                    store.createIndex('by-date', 'date');
                }
                // Revenue Analytics
                if (!db.objectStoreNames.contains('revenue_analytics')) {
                    const store = db.createObjectStore('revenue_analytics', { keyPath: 'id' });
                    store.createIndex('by-period', 'period');
                    store.createIndex('by-date', 'date');
                }
            },
        });
    }
    return dbPromise;
};

export const getDB = () => initDB();
