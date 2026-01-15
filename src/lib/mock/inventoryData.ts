import { inventoryService } from '@/lib/services/inventoryService';
import { analyticsService } from '@/lib/services/analyticsService';

export async function initializeMockData() {
    try {
        console.log('Initializing mock data for Spartan Gym...');

        // 1. Initialize Categories
        await initializeCategories();
        
        // 2. Initialize Products
        await initializeProducts();
        
        // 3. Initialize Suppliers
        await initializeSuppliers();
        
        // 4. Initialize Sample Sales and Expenses
        await initializeFinancialData();
        
        console.log('Mock data initialized successfully');
    } catch (error) {
        console.error('Error initializing mock data:', error);
    }
}

async function initializeCategories() {
    const categories = [
        { name: 'Supplements', description: 'Protein powders, creatine, pre-workout, BCAA' },
        { name: 'Beverages', description: 'Energy drinks, water bottles, sports drinks' },
        { name: 'Accessories', description: 'Weight belts, workout gloves, shaker bottles' },
        { name: 'Equipment', description: 'Small equipment items, resistance bands' },
        { name: 'Apparel', description: 'Gym merchandise, clothing items' },
        { name: 'Recovery', description: 'Protein bars, water bags, recovery drinks' }
    ];

    for (const category of categories) {
        try {
            await inventoryService.createCategory(category);
        } catch (error) {
            // Category might already exist
        }
    }
}

async function initializeSuppliers() {
    const suppliers = [
        {
            name: 'NutriPro Honduras',
            contactPerson: 'Carlos Rodriguez',
            email: 'carlos@nutripro.hn',
            phone: '+504 2234-5678',
            address: 'Tegucigalpa, Honduras',
            rtn: '08011999001234',
            paymentTerms: 'NET 30',
            isActive: true
        },
        {
            name: 'Fitness Gear Central',
            contactPerson: 'Maria Sanchez',
            email: 'maria@fitnessgear.hn',
            phone: '+504 2255-8901',
            address: 'San Pedro Sula, Honduras',
            rtn: '08011999005678',
            paymentTerms: 'NET 15',
            isActive: true
        },
        {
            name: 'Gym Supplies Direct',
            contactPerson: 'Roberto Martinez',
            email: 'roberto@gymsupplies.hn',
            phone: '+504 2276-2345',
            address: 'La Ceiba, Honduras',
            paymentTerms: 'COD',
            isActive: true
        }
    ];

    for (const supplier of suppliers) {
        try {
            await inventoryService.createSupplier(supplier);
        } catch (error) {
            // Supplier might already exist
        }
    }
}

async function initializeProducts() {
    const categories = await inventoryService.getCategories();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));

    const products = [
        // Supplements
        {
            name: 'Whey Protein Gold Standard',
            description: '5lb Premium whey protein',
            categoryId: categoryMap.get('Supplements') || '',
            sku: 'SUP-001',
            barcode: '750104123456',
            unitPrice: 2500,
            costPrice: 1500,
            currentStock: 15,
            minStockLevel: 5,
            maxStockLevel: 30,
            unit: 'units',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'WP2024-001',
            isActive: true
        },
        {
            name: 'Creatine Monohydrate',
            description: '500g Micronized creatine',
            categoryId: categoryMap.get('Supplements') || '',
            sku: 'SUP-002',
            barcode: '750104123457',
            unitPrice: 800,
            costPrice: 450,
            currentStock: 25,
            minStockLevel: 8,
            maxStockLevel: 40,
            unit: 'units',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'CR2024-001',
            isActive: true
        },
        {
            name: 'Pre-Workout Extreme',
            description: '30 servings high-energy pre-workout',
            categoryId: categoryMap.get('Supplements') || '',
            sku: 'SUP-003',
            barcode: '750104123458',
            unitPrice: 1200,
            costPrice: 700,
            currentStock: 8,
            minStockLevel: 5,
            maxStockLevel: 20,
            unit: 'units',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'PW2024-001',
            isActive: true
        },

        // Beverages
        {
            name: 'Energy Drink 500ml',
            description: 'High-caffeine energy drink',
            categoryId: categoryMap.get('Beverages') || '',
            sku: 'BEV-001',
            barcode: '750104123459',
            unitPrice: 75,
            costPrice: 40,
            currentStock: 50,
            minStockLevel: 20,
            maxStockLevel: 100,
            unit: 'bottles',
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'ED2024-001',
            isActive: true
        },
        {
            name: 'Mineral Water 1L',
            description: 'Premium mineral water',
            categoryId: categoryMap.get('Beverages') || '',
            sku: 'BEV-002',
            barcode: '750104123460',
            unitPrice: 35,
            costPrice: 20,
            currentStock: 80,
            minStockLevel: 30,
            maxStockLevel: 150,
            unit: 'bottles',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'MW2024-001',
            isActive: true
        },
        {
            name: 'Sports Drink 750ml',
            description: 'Electrolyte sports drink',
            categoryId: categoryMap.get('Beverages') || '',
            sku: 'BEV-003',
            barcode: '750104123461',
            unitPrice: 60,
            costPrice: 35,
            currentStock: 40,
            minStockLevel: 15,
            maxStockLevel: 80,
            unit: 'bottles',
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'SD2024-001',
            isActive: true
        },

        // Accessories
        {
            name: 'Weight Belt Premium',
            description: 'Leather weight lifting belt',
            categoryId: categoryMap.get('Accessories') || '',
            sku: 'ACC-001',
            barcode: '750104123462',
            unitPrice: 1500,
            costPrice: 900,
            currentStock: 3,
            minStockLevel: 2,
            maxStockLevel: 10,
            unit: 'units',
            isActive: true
        },
        {
            name: 'Workout Gloves Pro',
            description: 'Professional workout gloves',
            categoryId: categoryMap.get('Accessories') || '',
            sku: 'ACC-002',
            barcode: '750104123463',
            unitPrice: 600,
            costPrice: 350,
            currentStock: 12,
            minStockLevel: 5,
            maxStockLevel: 25,
            unit: 'pairs',
            isActive: true
        },
        {
            name: 'Shaker Bottle 28oz',
            description: 'Protein shaker with ball',
            categoryId: categoryMap.get('Accessories') || '',
            sku: 'ACC-003',
            barcode: '750104123464',
            unitPrice: 250,
            costPrice: 120,
            currentStock: 20,
            minStockLevel: 10,
            maxStockLevel: 50,
            unit: 'units',
            isActive: true
        },

        // Equipment
        {
            name: 'Resistance Bands Set',
            description: '5-piece resistance band set',
            categoryId: categoryMap.get('Equipment') || '',
            sku: 'EQP-001',
            barcode: '750104123465',
            unitPrice: 800,
            costPrice: 450,
            currentStock: 6,
            minStockLevel: 3,
            maxStockLevel: 15,
            unit: 'sets',
            isActive: true
        },
        {
            name: 'Jump Rope Pro',
            description: 'Speed jump rope',
            categoryId: categoryMap.get('Equipment') || '',
            sku: 'EQP-002',
            barcode: '750104123466',
            unitPrice: 350,
            costPrice: 200,
            currentStock: 8,
            minStockLevel: 4,
            maxStockLevel: 20,
            unit: 'units',
            isActive: true
        },

        // Apparel
        {
            name: 'Spartan Gym T-Shirt',
            description: 'Premium cotton gym t-shirt',
            categoryId: categoryMap.get('Apparel') || '',
            sku: 'APP-001',
            barcode: '750104123467',
            unitPrice: 450,
            costPrice: 250,
            currentStock: 25,
            minStockLevel: 10,
            maxStockLevel: 50,
            unit: 'units',
            isActive: true
        },
        {
            name: 'Gym Tank Top',
            description: 'Breathable gym tank top',
            categoryId: categoryMap.get('Apparel') || '',
            sku: 'APP-002',
            barcode: '750104123468',
            unitPrice: 400,
            costPrice: 220,
            currentStock: 18,
            minStockLevel: 8,
            maxStockLevel: 40,
            unit: 'units',
            isActive: true
        },

        // Recovery
        {
            name: 'Protein Bar Chocolate',
            description: '20g protein bar',
            categoryId: categoryMap.get('Recovery') || '',
            sku: 'REC-001',
            barcode: '750104123469',
            unitPrice: 85,
            costPrice: 50,
            currentStock: 45,
            minStockLevel: 20,
            maxStockLevel: 80,
            unit: 'bars',
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'PB2024-001',
            isActive: true
        },
        {
            name: 'BCAA Recovery Drink',
            description: 'Post-workout recovery drink',
            categoryId: categoryMap.get('Recovery') || '',
            sku: 'REC-002',
            barcode: '750104123470',
            unitPrice: 150,
            costPrice: 85,
            currentStock: 22,
            minStockLevel: 10,
            maxStockLevel: 40,
            unit: 'servings',
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: 'BC2024-001',
            isActive: true
        }
    ];

    for (const product of products) {
        try {
            await inventoryService.createProduct(product);
        } catch (error) {
            // Product might already exist
        }
    }
}

async function initializeFinancialData() {
    // Generate sample expenses
    const expenses = [
        {
            description: 'Monthly Rent',
            category: 'RENT' as const,
            amount: 25000,
            date: new Date().toISOString(),
            vendor: 'Property Management',
            invoiceNumber: 'RENT-2024-01',
            paymentMethod: 'TRANSFER' as const,
            createdBy: 'system'
        },
        {
            description: 'Electricity Bill',
            category: 'UTILITIES' as const,
            amount: 3500,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: 'ENEE',
            invoiceNumber: 'ELEC-2024-01',
            paymentMethod: 'TRANSFER' as const,
            createdBy: 'system'
        },
        {
            description: 'Water Bill',
            category: 'UTILITIES' as const,
            amount: 800,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: 'SANAA',
            invoiceNumber: 'WATER-2024-01',
            paymentMethod: 'TRANSFER' as const,
            createdBy: 'system'
        },
        {
            description: 'Staff Salaries',
            category: 'SALARIES' as const,
            amount: 45000,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            paymentMethod: 'TRANSFER' as const,
            createdBy: 'system'
        },
        {
            description: 'Marketing Campaign',
            category: 'MARKETING' as const,
            amount: 2500,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: 'Digital Marketing Agency',
            invoiceNumber: 'MKT-2024-001',
            paymentMethod: 'TRANSFER' as const,
            createdBy: 'system'
        },
        {
            description: 'Equipment Maintenance',
            category: 'MAINTENANCE' as const,
            amount: 1200,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: 'Fitness Tech Services',
            invoiceNumber: 'MAIN-2024-001',
            paymentMethod: 'CASH' as const,
            createdBy: 'system'
        },
        {
            description: 'Office Supplies',
            category: 'SUPPLIES' as const,
            amount: 800,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            vendor: 'Office Depot',
            invoiceNumber: 'SUP-2024-001',
            paymentMethod: 'CARD' as const,
            createdBy: 'system'
        }
    ];

    for (const expense of expenses) {
        try {
            await analyticsService.createExpense(expense);
        } catch (error) {
            // Expense might already exist
        }
    }

    // Generate sample sales
    const products = await inventoryService.getProducts();
    const staffId = 'staff-001';

    const sampleSales = [
        {
            items: [
                { productId: products[0]?.id || '', quantity: 2, unitPrice: 2500, discount: 0, total: 5000 },
                { productId: products[3]?.id || '', quantity: 3, unitPrice: 75, discount: 0, total: 225 }
            ],
            subtotal: 5225,
            taxRate: 0.15,
            taxAmount: 784,
            total: 6009,
            paymentMethod: 'CARD' as const,
            paymentStatus: 'PAID' as const,
            saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            staffId,
            notes: 'Member purchase'
        },
        {
            items: [
                { productId: products[1]?.id || '', quantity: 1, unitPrice: 800, discount: 50, total: 750 },
                { productId: products[4]?.id || '', quantity: 2, unitPrice: 35, discount: 0, total: 70 }
            ],
            subtotal: 820,
            taxRate: 0.15,
            taxAmount: 123,
            total: 943,
            paymentMethod: 'CASH' as const,
            paymentStatus: 'PAID' as const,
            saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            staffId,
            notes: 'Walk-in customer'
        },
        {
            items: [
                { productId: products[6]?.id || '', quantity: 1, unitPrice: 1500, discount: 0, total: 1500 },
                { productId: products[11]?.id || '', quantity: 2, unitPrice: 450, discount: 0, total: 900 }
            ],
            subtotal: 2400,
            taxRate: 0.15,
            taxAmount: 360,
            total: 2760,
            paymentMethod: 'TRANSFER' as const,
            paymentStatus: 'PAID' as const,
            saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            staffId,
            notes: 'Premium member'
        }
    ];

    for (const sale of sampleSales) {
        try {
            await inventoryService.createSale(sale);
        } catch (error) {
            // Sale might already exist
        }
    }

    // Calculate analytics for current month
    try {
        await analyticsService.calculateRevenueAnalytics(
            new Date().toISOString().slice(0, 7) + '-01',
            'MONTHLY'
        );
    } catch (error) {
        // Analytics might already exist
    }
}