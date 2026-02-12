import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'gym-platform-db';
const DB_VERSION = 56; // v56: Ensure platform_admins and feature_config exist


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
            companyId: string;
        };
        indexes: { 'by-qr': string; 'by-location': string; 'by-company': string };
    };
    subscriptions: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            planId: string;
            planName: string;
            startDate: string;
            endDate: string;
            isActive: boolean;
            isFrozen: boolean; // Pause feature
            freezeDate?: string;
            paymentMethod?: 'CASH' | 'TRANSFER' | 'POS' | 'COMPLIMENTARY';
            paymentAmount?: number;
            paymentReference?: string;
            paymentImage?: string;
            adminName?: string;
            updatedAt: string;
            synced: number;
            companyId: string;
        };
        indexes: { 'by-client': string; 'by-location': string; 'by-active-plan': [string, string]; 'by-company': string };
    },
    client_auth: {
        key: string;
        value: {
            clientId: string;
            password: string;
            pin: string;
            biometricData?: {
                fingerprint?: string;
                faceId?: string;
            };
            createdAt: string;
            updatedAt: string;
            lastLogin?: string;
            loginAttempts: number;
            isLocked: boolean;
            lockUntil?: string;
        };
        indexes: { 'by-client': string };
    },
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
    },
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
    },
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
            companyId: string;
        };
        indexes: { 'by-category': string; 'by-sku': string; 'by-supplier': string; 'low-stock': number; 'by-location': string; 'by-company': string };
    },
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
    },
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
    },
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
    },
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
            companyId: string;
        };
        indexes: { 'by-client': string; 'by-date': number; 'by-staff': string; 'by-location': string; 'by-company': string };
    },
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
            companyId: string;
        };
        indexes: { 'by-category': string; 'by-date': number; 'by-location': string; 'by-company': string };
    },
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
    },
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
    },
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
    },
    companies: {
        key: string;
        value: {
            id: string;
            name: string;
            logoUrl?: string;
            themeSettings?: any;
            subscriptionPlan: string;
            featureFlags: any;
            createdAt: string;
            status: 'active' | 'suspended';
            ownerId?: string;
        };
        indexes: { 'by-status': string };
    },
    platform_admins: {
        key: string;
        value: {
            id: string;
            username: string;
            password: string;
            pin?: string;
            email: string;
            name: string;
            photoUrl?: string;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
        };
    },
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
    },
    feature_config: {
        key: string;
        value: {
            id: string; // FeatureKey
            enabled: boolean;
            updatedAt: string;
            companyId: string;
        };
        indexes: { 'by-company': string };
    },
    checkins: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            timestamp: string;
            checkinType?: string;
            staffId?: string;
            notes?: string;
            synced: number;
            companyId: string;
        };
        indexes: { 'by-client': string; 'by-timestamp': string; 'by-location': string; 'by-company': string };
    },
    events: {
        key: string;
        value: {
            id: string;
            eventType: string;
            entityType: string;
            entityId: string;
            data: any;
            timestamp: string;
            synced: number;
            companyId: string;
        };
        indexes: { 'by-synced': number; 'by-company': string };
    },
    settings: {
        key: string;
        value: {
            role: string;
            permissions: any;
            updatedAt: string;
        };
    },
    logs: {
        key: string;
        value: {
            id: string;
            type: string;
            message: string;
            data?: any;
            timestamp: string;
            synced: number;
        };
        indexes: { 'by-type': string; 'by-timestamp': string };
    },
    workout_assignments: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            workoutId: string;
            assignedBy: string;
            assignedDate: string;
            dueDate?: string;
            status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
            notes?: string;
            completedDate?: string;
            synced: number;
        };
        indexes: { 'by-client': string; 'by-location': string };
    },
    staff: {
        key: string;
        value: {
            id: string;
            locationId: string;
            name: string;
            username: string;
            pin: string;
            email?: string;
            phone?: string;
            role: string;
            permissions: any;
            isActive: boolean;
            hireDate: string;
            terminationDate?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
            companyId: string;
        };
        indexes: { 'by-location': string; 'by-username': string; 'by-company': string };
    },
    locations: {
        key: string;
        value: {
            id: string;
            name: string;
            address?: string;
            phone?: string;
            isActive: boolean;
            companyId?: string;
            settings?: any;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    },
    payment_methods: {
        key: string;
        value: {
            id: string;
            locationId: string;
            clientId: string;
            type: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
            details?: any;
            isDefault: boolean;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string; 'by-location': string };
    },
    invoices: {
        key: string;
        value: {
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
            companyId: string;
        };
        indexes: { 'by-client': string; 'by-location': string; 'by-status': string; 'by-company': string };
    },
    financed_contracts: {
        key: string;
        value: {
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
        };
        indexes: { 'by-client': string; 'by-status': string; 'by-company': string };
    },
    vendors: {
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
    },
    marketplace_leads: {
        key: string;
        value: {
            id: string;
            vendorId: string;
            locationId: string;
            leadType: string;
            contactInfo: any;
            status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
            notes?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-vendor': string; 'by-location': string };
    },
    digital_products: {
        key: string;
        value: {
            id: string;
            trainerId: string;
            name: string;
            description?: string;
            price: number;
            category: string;
            mediaUrls: string[];
            isPublished: boolean;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-trainer': string };
    },
    trainer_wallets: {
        key: string;
        value: {
            id: string;
            trainerId: string;
            balance: number;
            currency: string;
            pendingAmount: number;
            lastPayoutDate?: string;
            payoutMethod?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    },
    corporations: {
        key: string;
        value: {
            id: string;
            name: string;
            contactPerson?: string;
            email?: string;
            phone?: string;
            address?: string;
            rtn?: string;
            employeeCount?: number;
            contractTerms?: any;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    },
    academy_progress: {
        key: string;
        value: {
            id: string;
            ownerId: string;
            courseId: string;
            moduleId: string;
            progress: number;
            completed: boolean;
            lastAccessed: string;
            scores?: any;
            certificates?: string[];
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-owner': string };
    },
    classes: {
        key: string;
        value: {
            id: string;
            locationId: string;
            name: string;
            description?: string;
            instructorId: string;
            schedule: any;
            capacity: number;
            enrolled: number;
            status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
            startDate: string;
            endDate: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-location': string; 'by-instructor': string };
    },
    bookings: {
        key: string;
        value: {
            id: string;
            classId: string;
            clientId: string;
            date: string;
            status: 'BOOKED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';
            notes?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-class': string; 'by-client': string; 'by-date': string };
    },
    shifts: {
        key: string;
        value: {
            id: string;
            staffId: string;
            locationId: string;
            startTime: string;
            endTime: string;
            role: string;
            status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
            notes?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-staff': string; 'by-location': string; 'by-date': string };
    },
    commissions: {
        key: string;
        value: {
            id: string;
            staffId: string;
            amount: number;
            date: string;
            sourceType: string;
            sourceId: string;
            status: 'PENDING' | 'PAID' | 'CANCELLED';
            paidDate?: string;
            notes?: string;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-staff': string; 'by-date': string };
    },
    notifications: {
        key: string;
        value: {
            id: string;
            clientId: string;
            locationId: string;
            type: string;
            title: string;
            message: string;
            status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
            scheduledFor: string;
            sentAt?: string;
            readAt?: string;
            metadata?: any;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string; 'by-status': string; 'by-date': string; 'by-location': string };
    },
    promotions: {
        key: string;
        value: {
            id: string;
            locationId: string;
            code: string;
            name: string;
            description?: string;
            discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
            discountValue: number;
            startDate: string;
            endDate: string;
            isActive: boolean;
            usageLimit?: number;
            usedCount: number;
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-location': string; 'by-code': string };
    },
    exercises: {
        key: string;
        value: {
            id: string;
            name: string;
            description?: string;
            category: string;
            muscleGroups: string[];
            equipment?: string;
            difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
            mediaUrls?: string[];
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    },
    workouts: {
        key: string;
        value: {
            id: string;
            name: string;
            description?: string;
            exercises: Array<{
                exerciseId: string;
                sets: number;
                reps: number;
                weight?: number;
                duration?: number;
                notes?: string;
            }>;
            duration?: number;
            difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
            createdAt: string;
            updatedAt: string;
            synced: number;
        };
    },
    sessions: {
        key: string;
        value: {
            id: string;
            clientId: string;
            workoutId: string;
            workoutName: string;
            date: string;
            logs: Array<{
                exerciseId: string;
                exerciseName: string;
                setNumber: number;
                reps: number;
                weight: number;
                notes?: string;
            }>;
            updatedAt: string;
            synced: number;
        };
        indexes: { 'by-client': string };
    },
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
                    const store = db.createObjectStore('staff', { keyPath: 'id' });
                    store.createIndex('by-username', 'username', { unique: true });
                    store.createIndex('by-location', 'locationId');
                } else if (oldVersion < 52) {
                    const store = tx.objectStore('staff');
                    if (!store.indexNames.contains('by-username')) {
                        store.createIndex('by-username', 'username', { unique: true });
                    }
                    if (!store.indexNames.contains('by-location')) {
                        store.createIndex('by-location', 'locationId');
                    }
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

                // Companies
                if (!db.objectStoreNames.contains('companies')) {
                    const store = db.createObjectStore('companies', { keyPath: 'id' });
                    store.createIndex('by-status', 'status');
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
                }

                if (oldVersion < 53) {
                    const upgradeTx = tx;
                    const storesWithCompany = [
                        'clients', 'subscriptions', 'tax_reports', 'products',
                        'purchase_orders', 'sales', 'expenses', 'revenue_analytics',
                        'checkins', 'staff', 'invoices', 'events', 'locations'
                    ];

                    storesWithCompany.forEach(storeName => {
                        if (db.objectStoreNames.contains(storeName as any)) {
                            const store = upgradeTx.objectStore(storeName as any);
                            if (!store.indexNames.contains('by-company')) {
                                store.createIndex('by-company', 'companyId');
                            }
                        }
                    });
                }

                if (oldVersion < 54) {
                    // Add platform_admins store for platform-level administration
                    if (!db.objectStoreNames.contains('platform_admins')) {
                        db.createObjectStore('platform_admins', { keyPath: 'id' });
                    }
                }

                if (oldVersion < 55) {
                    // Add by-active-plan compound index to subscriptions if missing
                    if (db.objectStoreNames.contains('subscriptions')) {
                        const subStore = tx.objectStore('subscriptions');
                        if (!subStore.indexNames.contains('by-active-plan')) {
                            subStore.createIndex('by-active-plan', ['isActive', 'planId']);
                        }
                    }
                }

                if (oldVersion < 56) {
                    // Ensure platform_admins exists (for users who skipped v54 logic)
                    if (!db.objectStoreNames.contains('platform_admins')) {
                        db.createObjectStore('platform_admins', { keyPath: 'id' });
                    }
                    // Ensure feature_config exists
                    if (!db.objectStoreNames.contains('feature_config')) {
                        db.createObjectStore('feature_config', { keyPath: 'id' });
                    }
                }
            },
        });
    }
    return dbPromise;
};

export const getDB = () => initDB();
