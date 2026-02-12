"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    AlertTriangle,
    Package,
    DollarSign,
    TrendingUp,
    Calendar,
    BarChart3,
    Download,
    Upload
} from "lucide-react";
import { inventoryService, Product, InventoryCategory, Supplier } from "@/lib/services/inventoryService";

export default function InventoryManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'suppliers' | 'reports'>('products');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchTerm, selectedCategory, lowStockOnly]);

    const loadData = async () => {
        try {
            const [productsData, categoriesData, suppliersData] = await Promise.all([
                inventoryService.getProducts(),
                inventoryService.getCategories(),
                inventoryService.getSuppliers()
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setSuppliers(suppliersData);

            // Initialize default categories if none exist
            if (categoriesData.length === 0) {
                await initializeDefaultCategories();
            }
        } catch (error) {
            console.error('Failed to load inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaultCategories = async () => {
        const defaultCategories = [
            { name: 'Supplements', description: 'Protein powders, creatine, pre-workout, etc.' },
            { name: 'Beverages', description: 'Energy drinks, water, sports drinks' },
            { name: 'Accessories', description: 'Weight belts, gloves, shaker bottles' },
            { name: 'Equipment', description: 'Small equipment, resistance bands' },
            { name: 'Apparel', description: 'Gym merchandise, clothing' },
            { name: 'Recovery', description: 'Protein bars, recovery drinks' }
        ];

        for (const category of defaultCategories) {
            await inventoryService.createCategory(category);
        }

        // Reload categories after initialization
        const categoriesData = await inventoryService.getCategories();
        setCategories(categoriesData);
    };

    const filterProducts = () => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }

        if (lowStockOnly) {
            filtered = filtered.filter(p => p.currentStock <= p.minStockLevel);
        }

        setFilteredProducts(filtered);
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || 'Unknown';
    };

    const getStockStatus = (product: Product) => {
        if (product.currentStock === 0) return { status: 'Out of Stock', color: 'red' };
        if (product.currentStock <= product.minStockLevel) return { status: 'Low Stock', color: 'yellow' };
        return { status: 'In Stock', color: 'green' };
    };

    const calculateProfitMargin = (product: Product) => {
        return ((product.unitPrice - product.costPrice) / product.unitPrice * 100).toFixed(1);
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 animate-pulse">
                Loading Inventory Management...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
                    <p className="text-gray-400 mt-1">Manage products, suppliers, and inventory levels</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-1 overflow-x-auto">
                {[
                    { id: 'products', label: 'Products', icon: <Package size={18} /> },
                    { id: 'categories', label: 'Categories', icon: <BarChart3 size={18} /> },
                    { id: 'suppliers', label: 'Suppliers', icon: <TrendingUp size={18} /> },
                    { id: 'reports', label: 'Reports', icon: <Download size={18} /> }
                ].map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${activeTab === id
                            ? 'bg-gray-800 text-white border-b-2 border-primary'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {icon}
                        {label}
                        {id === 'products' && (
                            <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full">{products.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setLowStockOnly(!lowStockOnly)}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${lowStockOnly
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                                }`}
                        >
                            <AlertTriangle size={18} />
                            Low Stock Only
                        </button>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProducts.map(product => {
                            const stockStatus = getStockStatus(product);
                            const profitMargin = calculateProfitMargin(product);

                            return (
                                <div key={product.id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-primary">
                                    <div className="p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white">{product.name}</h3>
                                                <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${stockStatus.color === 'red' ? 'bg-red-900/50 text-red-400' :
                                                stockStatus.color === 'yellow' ? 'bg-yellow-900/50 text-yellow-400' :
                                                    'bg-green-900/50 text-green-400'
                                                }`}>
                                                {stockStatus.status}
                                            </span>
                                        </div>

                                        {/* Category */}
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-gray-400" />
                                            <span className="text-gray-300 text-sm">{getCategoryName(product.categoryId)}</span>
                                        </div>

                                        {/* Stock Information */}
                                        <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Current Stock</span>
                                                <span className={`font-bold ${product.currentStock <= product.minStockLevel ? 'text-yellow-400' : 'text-white'
                                                    }`}>
                                                    {product.currentStock} {product.unit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Min Level</span>
                                                <span className="text-white">{product.minStockLevel} {product.unit}</span>
                                            </div>
                                            {product.expiryDate && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">Expiry</span>
                                                    <span className="text-white text-sm">{new Date(product.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial Information */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-2 bg-primary/20 rounded-lg">
                                                <p className="text-primary font-bold">{new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(product.unitPrice)}</p>
                                                <p className="text-primary/70 text-xs">Price</p>
                                            </div>
                                            <div className="text-center p-2 bg-green-950/30 rounded-lg">
                                                <p className="text-green-400 font-bold">{profitMargin}%</p>
                                                <p className="text-green-300 text-xs">Margin</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </button>
                                            <button className="flex-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1">
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Package size={48} className="mx-auto mb-4 text-gray-600" />
                            <h3 className="text-xl font-semibold text-gray-400">No products found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map(category => (
                            <div key={category.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-primary transition">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                                    <div className="flex gap-1">
                                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                                            <Edit size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {category.description && (
                                    <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Products:</span>
                                    <span className="text-white font-medium">
                                        {products.filter(p => p.categoryId === category.id).length}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => {/* Add category modal */ }}
                            className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-primary hover:bg-gray-750 transition flex flex-col items-center justify-center text-gray-400 hover:text-white"
                        >
                            <Plus size={24} className="mb-2" />
                            <span className="font-medium">Add Category</span>
                        </button>
                    </div>
                </div>
            )}

            {/* SUPPLIERS TAB */}
            {activeTab === 'suppliers' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-primary transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{supplier.name}</h3>
                                        {supplier.contactPerson && (
                                            <p className="text-gray-400 text-sm">Contact: {supplier.contactPerson}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                                            <Edit size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {supplier.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">Email:</span>
                                            <span className="text-gray-300">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">Phone:</span>
                                            <span className="text-gray-300">{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.paymentTerms && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">Terms:</span>
                                            <span className="text-gray-300">{supplier.paymentTerms}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Active Products:</span>
                                        <span className="text-white font-medium">
                                            {products.filter(p => p.supplier === supplier.id).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => {/* Add supplier modal */ }}
                            className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-primary hover:bg-gray-750 transition flex flex-col items-center justify-center text-gray-400 hover:text-white"
                        >
                            <Plus size={24} className="mb-2" />
                            <span className="font-medium">Add Supplier</span>
                        </button>
                    </div>
                </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-primary transition cursor-pointer">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <Package className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Inventory Report</h3>
                                    <p className="text-gray-400 text-sm">Stock levels and valuations</p>
                                </div>
                            </div>
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                <Download size={16} />
                                Generate Report
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-primary transition cursor-pointer">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <DollarSign className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Sales Report</h3>
                                    <p className="text-gray-400 text-sm">Product sales performance</p>
                                </div>
                            </div>
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                <Download size={16} />
                                Generate Report
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-primary transition cursor-pointer">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <TrendingUp className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Profit Analysis</h3>
                                    <p className="text-gray-400 text-sm">Margins and profitability</p>
                                </div>
                            </div>
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                                <Download size={16} />
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}