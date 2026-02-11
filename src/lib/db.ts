import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'gym-platform-db';
const DB_VERSION = 10;

export type BrandingConfig = DBSchemaV1['branding_config']['value'];
export type FeatureConfigStore = DBSchemaV1['feature_config']['value'];

export interface Location {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
}

export type DBSchemaV1 = {
    clients: {
        key: string;
        value: {
            id: string;
            locationId: string; // Multi-location
            name: string;
            email?: string;
            phone?: string;
            qrCode: string; // checksum
            notes?: string;
            updatedAt: string;
            synced: number; // 0: false, 1: true
        };
        indexes: { 'by-qr': string; 'by-location': string };
    };
    subscriptions: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            planId: string;
            startDate: string;
            endDate: string;
            isActive: boolean;
            isFrozen: boolean; // Pause feature
            freezeDate?: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string; 'by-location': string; 'by-active-plan': [string, string] };
    };
    checkins: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            timestamp: number; // Changed to number for easier indexing/ranges
            synced: number;
        };
        indexes: { 'by-client': string; 'by-timestamp': number; 'by-location': string };
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
            type: 'ERROR' | 'BUG_REPORT' | 'SYSTEM_ALERT';
            message: string;
            details?: string;
            user: string;
            role: string;
            timestamp: number;
            status: 'OPEN' | 'RESOLVED';
        };
        indexes: { 'by-type': string; 'by-timestamp': number };
    };
    branding_config: {
        key: string;
        value: {
            id: string; // 'current' or specific ID
            logoUrl?: string;
            wallpaperUrl?: string;
            watermarkText?: string;
            themeId: string; // 'black', 'pink', 'red', 'blue', etc.
            primaryColor?: string;
            secondaryColor?: string;
            accentColor?: string;
            logoScale?: number;
            gymName: string;
            updatedAt: string;
        };
    };
    feature_config: {
        key: string;
        value: {
            id: string; // FeatureKey
            enabled: boolean;
            updatedAt: string;
        };
    };
    locations: {
        key: string;
        value: Location & { updatedAt: string; synced: number };
    };
    payment_methods: {
        key: string;
        value: {
            id: string;
            clientId: string;
            type: 'CARD' | 'BANK';
            token: string;
            last4: string;
            exp: string;
            isDefault: boolean;
            updatedAt: string;
        };
        indexes: { 'by-client': string };
    };
    invoices: {
        key: string;
        value: {
            id: string;
            clientId: string;
            locationId: string;
            amount: number;
            status: 'PAID' | 'OPEN' | 'FAILED';
            dueDate: string;
            paymentDate?: string;
            attempts: number;
            updatedAt: string;
        };
        indexes: { 'by-client': string; 'by-location': string; 'by-status': string };
    };
    financed_contracts: {
        key: string;
        value: {
            id: string;
            clientId: string;
            totalAmount: number;
            installmentsTotal: number;
            installmentsPaid: number;
            status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'DEFAULTED';
            apr: number;
            updatedAt: string;
        };
        indexes: { 'by-client': string; 'by-status': string };
    };
    vendors: {
        key: string;
        value: {
            id: string;
            name: string;
            category: string;
            sponsored: boolean;
            referralLink: string;
            commissionRate: number;
            updatedAt: string;
        };
    };
    marketplace_leads: {
        key: string;
        value: {
            id: string;
            vendorId: string;
            locationId: string;
            clickCount: number;
            conversionStatus: string;
            updatedAt: string;
        };
        indexes: { 'by-vendor': string; 'by-location': string };
    };
    digital_products: {
        key: string;
        value: {
            id: string;
            type: 'PROGRAM' | 'COACHING' | 'PACKAGE';
            name: string;
            price: number;
            trainerId: string;
            isActive: boolean;
            updatedAt: string;
        };
        indexes: { 'by-trainer': string };
    };
    trainer_wallets: {
        key: string;
        value: {
            id: string;
            trainerId: string;
            balance: number;
            pendingCommissions: number;
            updatedAt: string;
        };
    };
    corporations: {
        key: string;
        value: {
            id: string;
            name: string;
            hrContact: string;
            flatDiscount: number;
            billingType: 'EMPLOYEE_PAYS' | 'CORP_PAYS';
            isActive: boolean;
            updatedAt: string;
        };
    };
    academy_progress: {
        key: string;
        value: {
            id: string;
            ownerId: string;
            courseId: string;
            progress: number;
            updatedAt: string;
        };
        indexes: { 'by-owner': string };
    };
    classes: {
        key: string;
        value: {
            id: string;
            locationId: string;
            name: string;
            description?: string;
            instructorId: string;
            instructorName: string;
            startTime: string; // HH:mm
            endTime: string;   // HH:mm
            daysOfWeek: number[]; // 0-6
            capacity: number;
            category: string;
            isActive: boolean;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-location': string; 'by-instructor': string };
    };
    bookings: {
        key: string;
        value: {
            id: string;
            classId: string;
            clientId: string;
            date: string; // ISO Date YYYY-MM-DD
            status: 'CONFIRMED' | 'CANCELLED' | 'WAITLIST' | 'ATTENDED';
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-class': string; 'by-client': string; 'by-date': string };
    };
    shifts: {
        key: string;
        value: {
            id: string;
            staffId: string;
            locationId: string;
            startTime: string;
            endTime?: string;
            type: 'CLOCK_IN' | 'BREAK' | 'CLOCK_OUT';
            notes?: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-staff': string; 'by-location': string; 'by-date': string };
    };
    commissions: {
        key: string;
        value: {
            id: string;
            staffId: string;
            saleId?: string;
            bookingId?: string;
            amount: number;
            percentage: number;
            type: 'SALE' | 'PT_SESSION' | 'CLASS';
            status: 'PENDING' | 'PAID' | 'VOID';
            date: string;
            synced: number;
        };
        indexes: { 'by-staff': string; 'by-date': string };
    };
    notifications: {
        key: string;
        value: {
            id: string;
            clientId: string;
            locationId: string;
            type: 'MEMBERSHIP_EXPIRING' | 'BIRTHDAY' | 'WELCOME' | 'PAYMENT_RECEIPT' | 'CUSTOM';
            channel: 'WHATSAPP' | 'EMAIL';
            status: 'PENDING' | 'SENT' | 'FAILED';
            message: string;
            scheduledFor: string;
            sentAt?: string;
            error?: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string; 'by-status': string; 'by-date': string; 'by-location': string };
    };
    promotions: {
        key: string;
        value: {
            id: string;
            locationId: string;
            name: string;
            code?: string;
            discountType: 'PERCENT' | 'FIXED';
            discountValue: number;
            minPurchase?: number;
            startDate: string;
            endDate: string;
            applicableTo: { type: 'CATEGORY' | 'PRODUCT' | 'ALL'; id?: string }[];
            memberOnly: boolean;
            isActive: boolean;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-location': string; 'by-code': string };
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
            locationId: string;
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
            locationId: string;
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
        indexes: { 'by-category': string; 'by-sku': string; 'by-supplier': string; 'low-stock': number; 'by-location': string };
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
            locationId: string;
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
        indexes: { 'by-supplier': string; 'by-status': string; 'by-location': string };
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
        };
        indexes: { 'by-client': string; 'by-date': number; 'by-staff': string; 'by-location': string };
    };
    expenses: {
        key: string;
        value: {
            id: string;
            locationId: string;
            description: string;
            category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'EQUIPMENT' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'LOAN' | 'OTHER';
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
        indexes: { 'by-category': string; 'by-date': number; 'by-location': string };
    };
    revenue_analytics: {
        key: string;
        value: {
            id: string;
            locationId: string;
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
        indexes: { 'by-period': string; 'by-date': number; 'by-location': string };
    };
    recurring_configs: {
        key: string;
        value: {
            id: string;
            locationId: string;
            name: string;
            amount: number;
            category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'EQUIPMENT' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'LOAN' | 'OTHER';
            originalAmount?: number;
            interestRate?: number;
            vendor?: string;
            description?: string;
            frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
            dueDay: number;
            isActive: boolean;
            lastPaidDate?: string;
            createdAt: string;
            updatedAt: string;
        };
    };
    // Add other stores as needed
};

let dbPromise: Promise<IDBPDatabase<DBSchemaV1>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<DBSchemaV1>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, tx) {
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
                // Checkins
                if (!db.objectStoreNames.contains('checkins')) {
                    const store = db.createObjectStore('checkins', { keyPath: 'id' });
                    store.createIndex('by-client', 'clientId');
                    store.createIndex('by-timestamp', 'timestamp');
                } else if (oldVersion < 7) {
                    const store = tx.objectStore('checkins');
                    if (!store.indexNames.contains('by-timestamp')) {
                        store.createIndex('by-timestamp', 'timestamp');
                    }
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
                // Recurring Configs
                if (!db.objectStoreNames.contains('recurring_configs')) {
                    db.createObjectStore('recurring_configs', { keyPath: 'id' });
                }

                // Version 8: Migration for Modular features and Multi-location
                if (oldVersion < 8) {
                    const upgradeTx = tx;

                    // Add locationId indexes to existing stores
                    const storesToUpdate = [
                        'clients', 'subscriptions', 'checkins', 'tax_reports',
                        'products', 'purchase_orders', 'sales', 'expenses',
                        'revenue_analytics', 'recurring_configs'
                    ];

                    storesToUpdate.forEach(storeName => {
                        if (db.objectStoreNames.contains(storeName as any)) {
                            const store = upgradeTx.objectStore(storeName as any);
                            if (!store.indexNames.contains('by-location')) {
                                store.createIndex('by-location', 'locationId');
                            }
                        }
                    });

                    // Create new modular stores
                    if (!db.objectStoreNames.contains('classes')) {
                        const store = db.createObjectStore('classes', { keyPath: 'id' });
                        store.createIndex('by-location', 'locationId');
                        store.createIndex('by-instructor', 'instructorId');
                    }
                    if (!db.objectStoreNames.contains('bookings')) {
                        const store = db.createObjectStore('bookings', { keyPath: 'id' });
                        store.createIndex('by-class', 'classId');
                        store.createIndex('by-client', 'clientId');
                        store.createIndex('by-date', 'date');
                    }
                    if (!db.objectStoreNames.contains('shifts')) {
                        const store = db.createObjectStore('shifts', { keyPath: 'id' });
                        store.createIndex('by-staff', 'staffId');
                        store.createIndex('by-location', 'locationId');
                        store.createIndex('by-date', 'startTime');
                    }
                    if (!db.objectStoreNames.contains('commissions')) {
                        const store = db.createObjectStore('commissions', { keyPath: 'id' });
                        store.createIndex('by-staff', 'staffId');
                        store.createIndex('by-date', 'date');
                    }
                    if (!db.objectStoreNames.contains('notifications')) {
                        const store = db.createObjectStore('notifications', { keyPath: 'id' });
                        store.createIndex('by-client', 'clientId');
                        store.createIndex('by-status', 'status');
                        store.createIndex('by-date', 'scheduledFor');
                        store.createIndex('by-location', 'locationId');
                    }
                    if (!db.objectStoreNames.contains('promotions')) {
                        const store = db.createObjectStore('promotions', { keyPath: 'id' });
                        store.createIndex('by-location', 'locationId');
                        store.createIndex('by-code', 'code');
                    }
                    if (!db.objectStoreNames.contains('branding_config')) {
                        db.createObjectStore('branding_config', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('locations')) {
                        db.createObjectStore('locations', { keyPath: 'id' });
                    }
                }

                // Version 9 Migration (Fintech & Ecosystem)
                if (oldVersion < 9) {
                    if (!db.objectStoreNames.contains('payment_methods')) {
                        const store = db.createObjectStore('payment_methods', { keyPath: 'id' });
                        store.createIndex('by-client', 'clientId');
                    }
                    if (!db.objectStoreNames.contains('invoices')) {
                        const store = db.createObjectStore('invoices', { keyPath: 'id' });
                        store.createIndex('by-client', 'clientId');
                        store.createIndex('by-location', 'locationId');
                        store.createIndex('by-status', 'status');
                    }
                    if (!db.objectStoreNames.contains('financed_contracts')) {
                        const store = db.createObjectStore('financed_contracts', { keyPath: 'id' });
                        store.createIndex('by-client', 'clientId');
                        store.createIndex('by-status', 'status');
                    }
                    if (!db.objectStoreNames.contains('vendors')) {
                        db.createObjectStore('vendors', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('marketplace_leads')) {
                        const store = db.createObjectStore('marketplace_leads', { keyPath: 'id' });
                        store.createIndex('by-vendor', 'vendorId');
                        store.createIndex('by-location', 'locationId');
                    }
                    if (!db.objectStoreNames.contains('digital_products')) {
                        const store = db.createObjectStore('digital_products', { keyPath: 'id' });
                        store.createIndex('by-trainer', 'trainerId');
                    }
                    if (!db.objectStoreNames.contains('trainer_wallets')) {
                        db.createObjectStore('trainer_wallets', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('corporations')) {
                        db.createObjectStore('corporations', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('academy_progress')) {
                        const store = db.createObjectStore('academy_progress', { keyPath: 'id' });
                        store.createIndex('by-owner', 'ownerId');
                    }
                    if (oldVersion < 10) {
                        // Optimized Indexes for Dashboard
                        const subStore = tx.objectStore('subscriptions');
                        if (!subStore.indexNames.contains('by-active-plan')) {
                            subStore.createIndex('by-active-plan', ['isActive', 'planId']);
                        }
                    }
                },
            });
    }
    return dbPromise;
};

export const getDB = () => initDB();
