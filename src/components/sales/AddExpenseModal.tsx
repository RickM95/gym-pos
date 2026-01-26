"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { analyticsService, Expense } from "@/lib/services/analyticsService";

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: () => void;
}

export default function AddExpenseModal({ onClose, onSave }: AddExpenseModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Expense>>({
        description: '',
        category: 'OTHER',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        paymentMethod: 'CASH',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await analyticsService.createExpense({
                description: formData.description!,
                category: formData.category as any,
                amount: Number(formData.amount),
                originalAmount: formData.category === 'LOAN' ? Number(formData.originalAmount) : undefined,
                interestRate: formData.category === 'LOAN' ? Number(formData.interestRate) : undefined,
                date: new Date(formData.date!).toISOString(),
                vendor: formData.vendor,
                paymentMethod: formData.paymentMethod as any,
                notes: formData.notes,
                createdBy: 'current-user', // TODO: Get from auth context
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to create expense:', error);
            alert('Failed to save expense. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Add New Expense</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Utility Bill, Cleaning Supplies"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="RENT">Rent</option>
                                <option value="UTILITIES">Utilities</option>
                                <option value="SALARIES">Salaries</option>
                                <option value="EQUIPMENT">Equipment</option>
                                <option value="MARKETING">Marketing</option>
                                <option value="SUPPLIES">Supplies</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="LOAN">Loan</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                {formData.category === 'LOAN' ? 'Payment Amount (HNL)' : 'Amount (HNL)'}
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {formData.category === 'LOAN' && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Original Loan Amount</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.originalAmount || 0}
                                    onChange={e => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) })}
                                    className="w-full bg-gray-900/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Total Debt"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.interestRate || 0}
                                    onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                                    className="w-full bg-gray-900/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. 5.5"
                                />
                            </div>
                            <p className="col-span-2 text-[10px] text-blue-300/70 mt-1">
                                This info will be used to calculate your remaining debt across all payments with the same description.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 relative"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
                            <select
                                value={formData.paymentMethod}
                                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="TRANSFER">Transfer</option>
                                <option value="CREDIT">Credit</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Vendor (Optional)</label>
                        <input
                            type="text"
                            value={formData.vendor}
                            onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Vendor Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                            placeholder="Additional details..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
