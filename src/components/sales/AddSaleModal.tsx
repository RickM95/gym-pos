"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Search, QrCode, Lock, Unlock, Shield } from "lucide-react";
import { inventoryService, Product } from "@/lib/services/inventoryService";
import { clientService, Client } from "@/lib/services/clientService";
import { authService } from "@/lib/services/authService";
import { Scanner } from "@/components/scanner/Scanner";

interface AddSaleModalProps {
    onClose: () => void;
    onSave: () => void;
}

interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    currentStock: number;
}

export default function AddSaleModal({ onClose, onSave }: AddSaleModalProps) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [items, setItems] = useState<CartItem[]>([]);
    const [clientId, setClientId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState('');

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);

    // Discount & Admin Auth State
    const [discountLocked, setDiscountLocked] = useState(true);
    const [showAdminPin, setShowAdminPin] = useState(false);
    const [adminPin, setAdminPin] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            const [productsData, clientsData] = await Promise.all([
                inventoryService.getProducts(),
                clientService.getClients()
            ]);
            // Only show active products with stock > 0
            setProducts(productsData.filter(p => p.isActive && p.currentStock > 0));
            setClients(clientsData || []);
        };
        loadInitialData();
    }, []);

    const addItem = (product: Product) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            if (existing.quantity >= product.currentStock) return;
            updateItem(product.id, { quantity: existing.quantity + 1 });
        } else {
            setItems([...items, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.unitPrice,
                discount: 0,
                total: product.unitPrice,
                currentStock: product.currentStock
            }]);
        }
        setSearchTerm(''); // Clear search to show cart or allow new search
    };

    const updateItem = (productId: string, updates: Partial<CartItem>) => {
        setItems(items.map(item => {
            if (item.productId === productId) {
                const updated = { ...item, ...updates };
                // Ensure discount doesn't exceed total
                if (updated.discount > (updated.quantity * updated.unitPrice)) {
                    updated.discount = updated.quantity * updated.unitPrice;
                }
                // Recalculate total if quantity, price or discount changed
                updated.total = (updated.quantity * updated.unitPrice) - (updated.discount || 0);
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setItems(items.filter(i => i.productId !== productId));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        // Assuming tax is included in price or calculated on top. 
        // Let's assume prices are tax-exclusive for now, or use a standard VAT.
        // Honduras ISV is typically 15%.
        const taxRate = 0.15;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        return { subtotal, taxRate, taxAmount, total };
    };

    const handleScan = (decodedText: string) => {
        // Expected format: CLIENT:uuid or similar. If not, try to search match.
        // Our clientService generates QR codes as `CLIENT:${id.substring(0, 8)}` or just IDs.
        // Let's search loosely.

        let foundClient = clients.find(c => c.qrCode === decodedText || c.id === decodedText);

        // If not found, scanning just the ID part might work
        if (!foundClient && decodedText.startsWith('CLIENT:')) {
            const shortId = decodedText.split(':')[1];
            foundClient = clients.find(c => c.id.startsWith(shortId));
        }

        if (foundClient) {
            setClientId(foundClient.id);
            setShowScanner(false);
            // Optionally play a sound or vibration
        } else {
            alert('Client not found');
        }
    };

    const handleUnlockDiscount = async () => {
        setAuthError('');
        try {
            const user = await authService.login(adminPin);
            if (user && (user.role === 'ADMIN' || user.role === 'TECH')) {
                setDiscountLocked(false);
                setShowAdminPin(false);
                setAdminPin('');
            } else {
                setAuthError('Invalid PIN or insufficient permissions');
            }
        } catch (error) {
            setAuthError('Authentication failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;
        setLoading(true);

        const totals = calculateTotals();

        try {
            await inventoryService.createSale({
                clientId: clientId || undefined,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    discount: i.discount,
                    total: i.total
                })),
                subtotal: totals.subtotal,
                taxRate: totals.taxRate,
                taxAmount: totals.taxAmount,
                total: totals.total,
                paymentMethod,
                paymentStatus: 'PAID', // Assuming immediate payment for POS
                saleDate: new Date().toISOString(),
                staffId: 'current-user', // TODO: Get from auth context
                notes
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to create sale:', error);
            alert('Failed to process sale. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotals();
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If showing scanner, render overlay
    if (showScanner) {
        return (
            <div className="fixed inset-0 z-[60] bg-black">
                <div className="p-4">
                    <button
                        onClick={() => setShowScanner(false)}
                        className="absolute top-4 right-4 text-white bg-gray-800 p-2 rounded-full z-50"
                    >
                        <X size={24} />
                    </button>
                    <Scanner onScan={handleScan} />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-white">New Sale</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Product Selection */}
                    <div className="w-1/2 border-r border-gray-700 flex flex-col p-4">
                        <div className="relative mb-4">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addItem(product)}
                                    className="w-full text-left bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg border border-gray-600 transition group flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-white">{product.name}</p>
                                        <p className="text-xs text-gray-400">Stock: {product.currentStock} {product.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-bold">L {product.unitPrice}</p>
                                        <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 justify-end">
                                            <Plus size={12} /> Add
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Cart & Checkout */}
                    <div className="w-1/2 flex flex-col p-4 bg-gray-900/50">
                        {/* Client Select with Scanner */}
                        <div className="mb-4 flex gap-2">
                            <select
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">Select Client (Optional)</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition"
                                title="Scan Client QR"
                            >
                                <QrCode size={20} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                    <ShoppingCart size={48} className="opacity-20" />
                                    <p>Cart is empty</p>
                                </div>
                            ) : (
                                items.map(item => (
                                    <div key={item.productId} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col gap-2 group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-white text-sm">{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.currentStock}
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.productId, { quantity: parseInt(e.target.value) || 1 })}
                                                        className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                                    />
                                                    <span className="text-gray-400 text-xs">x L {item.unitPrice}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <p className="font-bold text-white text-sm">L {item.total.toFixed(2)}</p>
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row for Discount */}
                                        <div className="flex items-center gap-2 border-t border-gray-700/50 pt-2 mt-1">
                                            <span className="text-xs text-gray-500">Discount:</span>
                                            {discountLocked ? (
                                                <button
                                                    onClick={() => setShowAdminPin(true)}
                                                    className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300"
                                                >
                                                    <Lock size={12} /> Unlock
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <Unlock size={12} className="text-green-500" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.quantity * item.unitPrice}
                                                        value={item.discount}
                                                        onChange={e => updateItem(item.productId, { discount: parseFloat(e.target.value) || 0 })}
                                                        className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-0.5 text-xs text-white"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Admin PIN Modal (Nested) */}
                        {showAdminPin && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 rounded-xl">
                                <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 shadow-xl w-72">
                                    <div className="flex items-center gap-2 mb-4 text-white">
                                        <Shield size={20} className="text-yellow-500" />
                                        <h3 className="font-bold">Admin Approval</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4">Enter Admin PIN to unlock discounts.</p>

                                    <input
                                        type="password"
                                        value={adminPin}
                                        onChange={e => setAdminPin(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white mb-2 text-center tracking-widest"
                                        placeholder="PIN"
                                        autoFocus
                                    />

                                    {authError && <p className="text-red-400 text-xs mb-2 text-center">{authError}</p>}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowAdminPin(false); setAuthError(''); setAdminPin(''); }}
                                            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUnlockDiscount}
                                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                                        >
                                            Unlock
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Totals & Payment */}
                        <div className="border-t border-gray-700 pt-4 space-y-3">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>L {totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Tax (15%)</span>
                                <span>L {totals.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-white border-t border-gray-700 pt-2">
                                <span>Total</span>
                                <span>L {totals.total.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as any)}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="TRANSFER">Transfer</option>
                                    <option value="CREDIT">Credit</option>
                                </select>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || items.length === 0}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-4 py-2 font-bold flex items-center justify-center gap-2 transition"
                                >
                                    {loading ? 'Processing...' : 'Complete Sale'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShoppingCart(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
    );
}
