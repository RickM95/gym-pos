"use client";

import { useEffect, useState } from "react";
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Users, 
    ShoppingCart,
    Target,
    BarChart3,
    PieChart,
    Activity,
    Clock,
    Calendar,
    Package,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { analyticsService, BusinessMetrics } from "@/lib/services/analyticsService";
import { inventoryService } from "@/lib/services/inventoryService";

interface DashboardCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
    format?: 'currency' | 'percentage' | 'number';
}

function DashboardCard({ title, value, change, icon, color = 'blue', format = 'number' }: DashboardCardProps) {
    const formatValue = (val: number | string) => {
        if (typeof val !== 'number') return val;
        
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(val);
            case 'percentage':
                return `${val.toFixed(1)}%`;
            default:
                return val.toLocaleString();
        }
    };

    const isPositive = change && change > 0;

    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                    {icon}
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-white">{formatValue(value)}</p>
            </div>
        </div>
    );
}

export default function BusinessDashboard() {
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [peakHours, setPeakHours] = useState<any>(null);
    const [retention, setRetention] = useState<any>(null);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [cashFlow, setCashFlow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'members' | 'operations'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                businessMetrics,
                peakHoursData,
                retentionData,
                lowStockProducts,
                cashFlowData
            ] = await Promise.all([
                analyticsService.getBusinessMetrics(),
                analyticsService.getPeakHoursAnalysis(),
                analyticsService.getMemberRetentionAnalysis(),
                inventoryService.getLowStockProducts(),
                analyticsService.getCashFlowProjections(6)
            ]);

            setMetrics(businessMetrics);
            setPeakHours(peakHoursData);
            setRetention(retentionData);
            setLowStock(lowStockProducts);
            setCashFlow(cashFlowData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 animate-pulse">
                Loading Analytics Dashboard...
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="p-12 text-center text-red-500">
                Failed to load dashboard data
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Business Analytics</h1>
                    <p className="text-gray-400 mt-1">Comprehensive insights and metrics for Spartan Gym</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    Last updated: {new Date().toLocaleString()}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-1 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
                    { id: 'revenue', label: 'Revenue & Profit', icon: <DollarSign size={18} /> },
                    { id: 'members', label: 'Members', icon: <Users size={18} /> },
                    { id: 'operations', label: 'Operations', icon: <Activity size={18} /> }
                ].map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
                            activeTab === id 
                                ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard
                            title="Monthly Revenue"
                            value={metrics.monthlyRevenue}
                            change={5.2}
                            icon={<DollarSign size={20} className="text-blue-400" />}
                            color="blue"
                            format="currency"
                        />
                        <DashboardCard
                            title="Monthly Profit"
                            value={metrics.monthlyProfit}
                            change={8.7}
                            icon={<TrendingUp size={20} className="text-green-400" />}
                            color="green"
                            format="currency"
                        />
                        <DashboardCard
                            title="Active Members"
                            value={metrics.memberCount}
                            change={3.1}
                            icon={<Users size={20} className="text-purple-400" />}
                            color="purple"
                        />
                        <DashboardCard
                            title="Profit Margin"
                            value={metrics.profitMargin}
                            change={-2.3}
                            icon={<Target size={20} className="text-orange-400" />}
                            color="orange"
                            format="percentage"
                        />
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard
                            title="Avg. Revenue per Member"
                            value={metrics.averageRevenuePerMember}
                            icon={<DollarSign size={20} className="text-cyan-400" />}
                            color="cyan"
                            format="currency"
                        />
                        <DashboardCard
                            title="Customer Acquisition Cost"
                            value={metrics.customerAcquisitionCost}
                            icon={<Target size={20} className="text-yellow-400" />}
                            color="yellow"
                            format="currency"
                        />
                        <DashboardCard
                            title="Lifetime Value"
                            value={metrics.lifetimeValue}
                            icon={<TrendingUp size={20} className="text-emerald-400" />}
                            color="emerald"
                            format="currency"
                        />
                        <DashboardCard
                            title="Inventory Turnover"
                            value={metrics.inventoryTurnover}
                            icon={<Package size={20} className="text-indigo-400" />}
                            color="indigo"
                            format="number"
                        />
                    </div>

                    {/* Alert Section */}
                    {lowStock.length > 0 && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle size={20} className="text-red-400" />
                                <h3 className="text-lg font-semibold text-red-400">Low Inventory Alert</h3>
                                <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
                                    {lowStock.length} items
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {lowStock.slice(0, 6).map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-950/30 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">{product.name}</p>
                                            <p className="text-red-300 text-sm">Stock: {product.currentStock}</p>
                                        </div>
                                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                                            Min: {product.minStockLevel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* REVENUE TAB */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Break-Even Point"
                            value={metrics.breakEvenPoint}
                            icon={<Target size={20} className="text-red-400" />}
                            color="red"
                            format="currency"
                        />
                        <DashboardCard
                            title="Gross Margin"
                            value={metrics.grossMargin}
                            icon={<PieChart size={20} className="text-green-400" />}
                            color="green"
                            format="percentage"
                        />
                        <DashboardCard
                            title="Cash Flow"
                            value={metrics.cashFlow}
                            icon={<DollarSign size={20} className="text-blue-400" />}
                            color="blue"
                            format="currency"
                        />
                    </div>

                    {/* Cash Flow Projections */}
                    {cashFlow && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="text-blue-400" size={24} />
                                Cash Flow Projections (6 Months)
                            </h3>
                            <div className="space-y-3">
                                {cashFlow.projections.map((projection: any, index: number) => (
                                    <div key={projection.month} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{new Date(projection.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                            <p className="text-gray-400 text-sm">Revenue: {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(projection.projectedRevenue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${projection.projectedCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL' }).format(projection.projectedCashFlow)}
                                            </p>
                                            <p className="text-xs text-gray-500">Net Flow</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Total Members"
                            value={metrics.memberCount}
                            change={3.1}
                            icon={<Users size={20} className="text-blue-400" />}
                            color="blue"
                        />
                        <DashboardCard
                            title="New This Month"
                            value={metrics.newMembersThisMonth}
                            icon={<TrendingUp size={20} className="text-green-400" />}
                            color="green"
                        />
                        <DashboardCard
                            title="Churn Rate"
                            value={metrics.memberChurnRate}
                            icon={<TrendingDown size={20} className="text-red-400" />}
                            color="red"
                            format="percentage"
                        />
                    </div>

                    {/* Retention Analysis */}
                    {retention && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="text-purple-400" size={24} />
                                Member Retention Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-purple-950/30 rounded-lg">
                                        <span className="text-gray-300">Overall Retention Rate</span>
                                        <span className="text-2xl font-bold text-purple-400">{retention.overallRetentionRate}%</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Members</span>
                                            <span className="text-white">{retention.totalMembers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Active Members</span>
                                            <span className="text-green-400">{retention.activeMembers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Churned Members</span>
                                            <span className="text-red-400">{retention.churnedMembers}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-white font-medium mb-3">Recent Cohort Performance</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {retention.cohortAnalysis.slice(0, 6).map((cohort: any, index: number) => (
                                            <div key={cohort.month} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                                <div>
                                                    <p className="text-white text-sm">{new Date(cohort.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-gray-400 text-xs">Joined: {cohort.joined}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-medium">{cohort.retentionRate}%</p>
                                                    <p className="text-gray-400 text-xs">Retention</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* OPERATIONS TAB */}
            {activeTab === 'operations' && (
                <div className="space-y-6">
                    {/* Peak Hours Analysis */}
                    {peakHours && (
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="text-cyan-400" size={24} />
                                Peak Hours Analysis (Last 30 Days)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="text-white font-medium mb-3">Peak Hour</h4>
                                    <div className="text-center p-4 bg-cyan-950/30 rounded-lg">
                                        <p className="text-3xl font-bold text-cyan-400">{peakHours.peakHour}</p>
                                        <p className="text-cyan-300 text-sm mt-1">Busiest time</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-3">Peak Day</h4>
                                    <div className="text-center p-4 bg-purple-950/30 rounded-lg">
                                        <p className="text-3xl font-bold text-purple-400">{peakHours.peakDay}</p>
                                        <p className="text-purple-300 text-sm mt-1">Busiest day</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium mb-3">Daily Average</h4>
                                    <div className="text-center p-4 bg-green-950/30 rounded-lg">
                                        <p className="text-3xl font-bold text-green-400">{peakHours.averageDaily}</p>
                                        <p className="text-green-300 text-sm mt-1">Check-ins per day</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Inventory Summary */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Package className="text-orange-400" size={24} />
                                Inventory Status
                            </h3>
                            <div className="space-y-3">
                                {lowStock.length > 0 ? (
                                    <>
                                        <div className="flex justify-between items-center p-3 bg-red-950/30 rounded-lg">
                                            <span className="text-red-300">Low Stock Items</span>
                                            <span className="text-red-400 font-bold">{lowStock.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-yellow-950/30 rounded-lg">
                                            <span className="text-yellow-300">Needs Reorder</span>
                                            <span className="text-yellow-400 font-bold">{lowStock.length}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between items-center p-3 bg-green-950/30 rounded-lg">
                                        <span className="text-green-300">Inventory Status</span>
                                        <span className="text-green-400 font-bold">Healthy</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Operational Metrics */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="text-blue-400" size={24} />
                                Operational Efficiency
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-950/30 rounded-lg">
                                    <span className="text-blue-300">Total Check-ins (30 days)</span>
                                    <span className="text-blue-400 font-bold">{peakHours?.totalCheckins || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-indigo-950/30 rounded-lg">
                                    <span className="text-indigo-300">Inventory Turnover</span>
                                    <span className="text-indigo-400 font-bold">{metrics.inventoryTurnover.toFixed(2)}x</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}