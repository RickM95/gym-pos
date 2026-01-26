"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Calendar,
    DollarSign,
    RefreshCw,
    Trash2,
    Edit,
    CheckCircle,
    AlertCircle,
    Clock,
    History
} from "lucide-react";
import { RecurringExpenseConfig, recurringService } from "@/lib/services/recurringService";
import { analyticsService, Expense } from "@/lib/services/analyticsService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function RecurringExpensesManager() {
    const [configs, setConfigs] = useState<RecurringExpenseConfig[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'manage' | 'history'>('upcoming');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Form State for Add/Edit
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<RecurringExpenseConfig>>({
        name: '',
        amount: 0,
        category: 'OTHER',
        frequency: 'MONTHLY',
        dueDay: 1,
        isActive: true,
        vendor: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [configsData, allExpenses] = await Promise.all([
                recurringService.getConfigs(),
                analyticsService.getExpenses() // We might want to filter this for performance later
            ]);
            setConfigs(configsData);

            // Filter expenses that look generic or are marked as recurring in description
            // For now, just getting all expenses to show history matching the config names could be tricky without a link.
            // Better to just show all expenses in history or filter by "[Recurring]" string in description as implemented in service.
            setExpenses(allExpenses.filter(e => e.description.includes('[Recurring]')));
        } catch (error) {
            console.error("Failed to load recurring data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async (config: RecurringExpenseConfig) => {
        if (!confirm(`Confirm payment of L ${config.amount} for ${config.name}?`)) return;

        setProcessingId(config.id);
        try {
            await recurringService.processPayment(config.id, 'CASH'); // Defaulting to CASH, could ask user
            await loadData();
            alert('Payment recorded successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to process payment');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await recurringService.deleteConfig(id);
            await loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (config: RecurringExpenseConfig) => {
        setFormData(config);
        setEditingId(config.id);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await recurringService.updateConfig(editingId, formData);
            } else {
                await recurringService.addConfig(formData as any);
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                name: '',
                amount: 0,
                category: 'OTHER',
                frequency: 'MONTHLY',
                dueDay: 1,
                isActive: true,
                vendor: '',
                originalAmount: 0,
                interestRate: 0
            });
            await loadData();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save configuration");
        }
    };

    const getDueStatus = (config: RecurringExpenseConfig) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const createdDate = new Date(config.createdAt);

        // Determine the target due date for the CURRENT cycle
        let targetDueDate = new Date(currentYear, currentMonth, config.dueDay);

        // Check if we already paid this month (or cycle)
        let isPaid = false;
        if (config.lastPaidDate) {
            const lastPaid = new Date(config.lastPaidDate);
            if (lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear) {
                isPaid = true;
            }
        }

        // Check if overdue
        const daysOverdue = Math.floor((now.getTime() - targetDueDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = !isPaid && daysOverdue > 0;
        const isUpcoming = !isPaid && daysOverdue <= 0;

        return { isPaid, isOverdue, isUpcoming, daysOverdue, targetDueDate };
    };

    if (loading) return <LoadingSpinner message="Prepping Recurring Expenses..." />;

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'upcoming' ? 'bg-gray-700/50 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Upcoming & Due
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'manage' ? 'bg-gray-700/50 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Manage Configurations
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 text-sm font-medium transition ${activeTab === 'history' ? 'bg-gray-700/50 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    History
                </button>
            </div>

            <div className="p-6">
                {/* UPCOMING TAB */}
                {activeTab === 'upcoming' && (
                    <div className="space-y-4">
                        {configs.filter(c => c.isActive).length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No active recurring expenses configured.
                                <br />
                                <button onClick={() => setActiveTab('manage')} className="text-blue-400 hover:underline mt-2">
                                    Configure now
                                </button>
                            </div>
                        )}

                        {configs.filter(c => c.isActive).map(config => {
                            const status = getDueStatus(config);
                            if (status.isPaid) return null; // Don't show paid items here

                            return (
                                <div key={config.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${status.isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{config.name}</h4>
                                            <p className="text-sm text-gray-400">
                                                Due: {status.targetDueDate.toLocaleDateString()}
                                                {status.isOverdue && <span className="text-red-400 ml-2 font-medium">({status.daysOverdue} days overdue)</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-white">L {config.amount.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">{config.frequency}</p>
                                        </div>
                                        <button
                                            onClick={() => handleProcessPayment(config)}
                                            disabled={!!processingId}
                                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-green-900/20 transition flex items-center gap-2"
                                        >
                                            {processingId === config.id ? <LoadingSpinner size="xs" /> : <CheckCircle size={16} />}
                                            Pay Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MANAGE TAB */}
                {activeTab === 'manage' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Configurations</h3>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        name: '',
                                        amount: 0,
                                        category: 'OTHER',
                                        frequency: 'MONTHLY',
                                        dueDay: 1,
                                        isActive: true,
                                        vendor: '',
                                        originalAmount: 0,
                                        interestRate: 0
                                    });
                                    setShowForm(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Config
                            </button>
                        </div>

                        {showForm && (
                            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 mb-6">
                                <h4 className="text-white font-bold mb-4">{editingId ? 'Edit Configuration' : 'New Configuration'}</h4>
                                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                                            placeholder="e.g. Monthly Rent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Amount (L)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
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
                                        <label className="block text-xs text-gray-400 mb-1">Due Day</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={formData.dueDay}
                                            onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                    </div>

                                    {formData.category === 'LOAN' && (
                                        <>
                                            <div>
                                                <label className="block text-xs text-blue-400 font-bold mb-1 uppercase">Original Loan Amount</label>
                                                <input
                                                    required
                                                    type="number"
                                                    value={formData.originalAmount || 0}
                                                    onChange={e => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) })}
                                                    className="w-full bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2 text-white placeholder-blue-300/30"
                                                    placeholder="Total Debt"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-blue-400 font-bold mb-1 uppercase">Interest Rate (%)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.interestRate || 0}
                                                    onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                                                    className="w-full bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2 text-white placeholder-blue-300/30"
                                                    placeholder="e.g. 5.5"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-end gap-2 md:col-span-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold"
                                        >
                                            Save Configuration
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Loan Debt Overview (Relocated from Sales) */}
                        {configs.some(c => c.category === 'LOAN') && (
                            <div className="mb-6 bg-gray-900/40 rounded-lg border border-gray-700 p-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Relocated Loan Debt Overview</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {configs.filter(c => c.category === 'LOAN').map(config => {
                                        // Filter expenses (payments) for this specific recurring config
                                        // We use the config name to filter history for now.
                                        const loanPayments = expenses.filter(e => e.description.includes(config.name));
                                        const totalPaid = loanPayments.reduce((sum, e) => sum + e.amount, 0);
                                        const originalAmount = config.originalAmount || 0;
                                        const interestRate = config.interestRate || 0;
                                        const totalWithInterest = originalAmount * (1 + (interestRate / 100));
                                        const remainingDebt = Math.max(0, totalWithInterest - totalPaid);
                                        const progress = totalWithInterest > 0 ? (totalPaid / totalWithInterest) * 100 : 0;

                                        return (
                                            <div key={config.id} className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-white truncate pr-2">{config.name}</p>
                                                        <p className="text-[10px] text-gray-400">Int Rate: {interestRate}%</p>
                                                    </div>
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Debt</span>
                                                </div>
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Total with Interest</span>
                                                        <span className="text-gray-300 font-medium">L {totalWithInterest.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Total Paid to Date</span>
                                                        <span className="text-green-400 font-medium">L {totalPaid.toLocaleString()}</span>
                                                    </div>
                                                    <div className="border-t border-gray-700/50 pt-2 flex justify-between items-center mt-2">
                                                        <span className="text-gray-400 text-xs font-normal">Remaining Debt</span>
                                                        <span className="text-blue-400 text-lg font-black tracking-tighter">L {remainingDebt.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden ring-1 ring-gray-700">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                                        style={{ width: `${Math.min(100, progress)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-right text-gray-500 mt-1 font-medium">{progress.toFixed(1)}% paid</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {configs.map(config => (
                                <div key={config.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded border border-gray-700">
                                    <div>
                                        <p className="font-bold text-white">{config.name}</p>
                                        <p className="text-xs text-gray-400">Due day: {config.dueDay} • L {config.amount}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(config)} className="p-2 text-blue-400 hover:bg-gray-700 rounded">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(config.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-2">
                        {expenses.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No payment history found.</p>
                        ) : (
                            expenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="text-green-500">
                                            <CheckCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{expense.description}</p>
                                            <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-red-400">- L {expense.amount.toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
