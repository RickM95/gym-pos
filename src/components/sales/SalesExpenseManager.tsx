"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Calendar,
    DollarSign,
    ShoppingCart,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    Receipt,
    Users,
    ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { analyticsService, Expense } from "@/lib/services/analyticsService";
import { inventoryService, Sale } from "@/lib/services/inventoryService";
import AddSaleModal from "./AddSaleModal";
import AddExpenseModal from "./AddExpenseModal";
import RecurringExpensesManager from "./RecurringExpensesManager";

export default function SalesExpenseManager() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'summary' | 'recurring'>('summary');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('month');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [dateFilter]);

    useEffect(() => {
        filterData();
    }, [sales, expenses, searchTerm]);

    const loadData = async () => {
        try {
            const [startDate, endDate] = getDateRange();

            const [salesData, expensesData] = await Promise.all([
                inventoryService.getSales(startDate, endDate),
                analyticsService.getExpenses(startDate, endDate)
            ]);

            setSales(salesData);
            setExpenses(expensesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return [startDate.toISOString(), now.toISOString()];
    };

    const filterData = () => {
        if (!searchTerm) {
            setFilteredSales(sales);
            setFilteredExpenses(expenses);
            return;
        }

        const lowerSearch = searchTerm.toLowerCase();

        const filteredSalesData = sales.filter(sale =>
            sale.id.toLowerCase().includes(lowerSearch) ||
            sale.paymentMethod.toLowerCase().includes(lowerSearch) ||
            sale.items.some(item => item.productId.toLowerCase().includes(lowerSearch))
        );

        const filteredExpensesData = expenses.filter(expense =>
            expense.description.toLowerCase().includes(lowerSearch) ||
            expense.category.toLowerCase().includes(lowerSearch) ||
            expense.vendor?.toLowerCase().includes(lowerSearch)
        );

        setFilteredSales(filteredSalesData);
        setFilteredExpenses(filteredExpensesData);
    };

    const calculateTotals = () => {
        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const netProfit = totalSales - totalExpenses;
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

        return { totalSales, totalExpenses, netProfit, profitMargin };
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH': return <DollarSign size={16} className="text-green-400" />;
            case 'CARD': return <CreditCard size={16} className="text-blue-400" />;
            case 'TRANSFER': return <TrendingUp size={16} className="text-purple-400" />;
            default: return <Receipt size={16} className="text-gray-400" />;
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'RENT': 'bg-blue-900/50 text-blue-400',
            'UTILITIES': 'bg-yellow-900/50 text-yellow-400',
            'SALARIES': 'bg-purple-900/50 text-purple-400',
            'EQUIPMENT': 'bg-green-900/50 text-green-400',
            'MARKETING': 'bg-red-900/50 text-red-400',
            'SUPPLIES': 'bg-indigo-900/50 text-indigo-400',
            'MAINTENANCE': 'bg-orange-900/50 text-orange-400',
            'LOAN': 'bg-pink-900/50 text-pink-400',
            'OTHER': 'bg-gray-700 text-gray-400'
        };
        return colors[category] || colors['OTHER'];
    };

    const router = useRouter();

    if (loading) {
        return <LoadingSpinner message="Fetching Sales & Revenue..." />;
    }

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border border-gray-700 transition"
                        title="Go Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Sales & Revenue</h1>
                        <p className="text-gray-400 mt-1">Track revenue, expenses, and profitability</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="week">Last Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <ShoppingCart size={20} className="text-green-400" />
                        </div>
                        <TrendingUp size={16} className="text-green-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(totals.totalSales)}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <Receipt size={20} className="text-red-400" />
                        </div>
                        <TrendingDown size={16} className="text-red-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(totals.totalExpenses)}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <DollarSign size={20} className="text-blue-400" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {totals.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${totals.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(totals.netProfit)}
                    </p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <TrendingUp size={20} className="text-purple-400" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${totals.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {totals.profitMargin >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Profit Margin</p>
                    <p className={`text-2xl font-bold ${totals.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totals.profitMargin.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Search and Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2">
                    {[
                        { id: 'summary', label: 'Summary', icon: <DollarSign size={18} /> },
                        { id: 'sales', label: `Sales (${filteredSales.length})`, icon: <ShoppingCart size={18} /> },
                        { id: 'expenses', label: `Expenses (${filteredExpenses.length})`, icon: <Receipt size={18} /> },
                        { id: 'recurring', label: 'Recurring', icon: <Calendar size={18} /> }
                    ].map(({ id, label, icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                                }`}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                </div>
            </div>

            {/* RECURRING TAB */}
            {activeTab === 'recurring' && (
                <RecurringExpensesManager />
            )}

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-lg font-bold text-white">Recent Sales</h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {filteredSales.slice(0, 5).map(sale => (
                                <div key={sale.id} className="p-4 hover:bg-gray-700/50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getPaymentMethodIcon(sale.paymentMethod)}
                                            <div>
                                                <p className="text-white font-medium">{sale.id}</p>
                                                <p className="text-gray-400 text-sm">{new Date(sale.saleDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-bold">
                                                {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(sale.total)}
                                            </p>
                                            <p className="text-gray-400 text-xs">{sale.items.length} items</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredSales.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No sales recorded for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Expenses */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-lg font-bold text-white">Recent Expenses</h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {filteredExpenses.slice(0, 5).map(expense => (
                                <div key={expense.id} className="p-4 hover:bg-gray-700/50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(expense.category)}`}>
                                                {expense.category}
                                            </span>
                                            <div>
                                                <p className="text-white font-medium">{expense.description}</p>
                                                <p className="text-gray-400 text-sm">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                    {expense.vendor && ` • ${expense.vendor}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-400 font-bold">
                                                -{new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(expense.amount)}
                                            </p>
                                            <p className="text-gray-400 text-xs">{expense.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No expenses recorded for this period
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SALES TAB */}
            {activeTab === 'sales' && (
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                    <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Sales Transactions</h3>
                        <button
                            onClick={() => setShowSaleModal(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Sale
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredSales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{sale.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(sale.saleDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            <div>
                                                <p>{sale.items.length} items</p>
                                                <p className="text-xs text-gray-500">
                                                    {sale.items.slice(0, 2).map(item => item.productId).join(', ')}
                                                    {sale.items.length > 2 && '...'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getPaymentMethodIcon(sale.paymentMethod)}
                                                <span className="text-sm text-gray-300">{sale.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${sale.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-400' :
                                                sale.paymentStatus === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400' :
                                                    'bg-gray-700 text-gray-400'
                                                }`}>
                                                {sale.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-400">
                                            {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(sale.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSales.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No sales found matching your criteria
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                    <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Expense Transactions</h3>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Expense
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{expense.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(expense.category)}`}>
                                                {expense.category}
                                            </span>
                                            {expense.category === 'LOAN' && expense.originalAmount && (
                                                <div className="mt-1 text-[10px] text-blue-400 font-bold">
                                                    INT: {expense.interestRate}%
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {expense.vendor || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <div>
                                                <p>{expense.paymentMethod}</p>
                                                {expense.category === 'LOAN' && (
                                                    <p className="text-[10px] text-yellow-500 font-medium">Debt Pmt</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-400">
                                            -{new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(expense.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredExpenses.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No expenses found matching your criteria
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showSaleModal && (
                <AddSaleModal
                    onClose={() => setShowSaleModal(false)}
                    onSave={() => loadData()}
                />
            )}

            {showExpenseModal && (
                <AddExpenseModal
                    onClose={() => setShowExpenseModal(false)}
                    onSave={() => loadData()}
                />
            )}
        </div>
    );
}