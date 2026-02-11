'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    TrendingUp,
    ShoppingCart,
    Users,
    GraduationCap,
    BarChart3,
    Target,
    CheckCircle2,
    Search,
    Plus,
    Filter
} from 'lucide-react';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { FeatureKey } from '@/lib/constants/features';
import { paymentService } from '@/lib/services/paymentService';
import { insightsService } from '@/lib/services/insightsService';
import { marketplaceService } from '@/lib/services/marketplaceService';
import { corporateService } from '@/lib/services/corporateService';

const EcosystemPage = () => {
    const [activeTab, setActiveTab] = useState('payments');

    const tabs = [
        { id: 'payments', label: 'Payments', icon: CreditCard, feature: FeatureKey.SPARTAN_PAYMENTS },
        { id: 'financing', label: 'Financing', icon: TrendingUp, feature: FeatureKey.FINANCING },
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart, feature: FeatureKey.MARKETPLACE },
        { id: 'trainers', label: 'Trainers', icon: Target, feature: FeatureKey.TRAINER_SERVICES },
        { id: 'corporate', label: 'Corporate', icon: Users, feature: FeatureKey.CORPORATE_WELLNESS },
        { id: 'insights', label: 'Insights', icon: BarChart3, feature: FeatureKey.REGIONAL_INSIGHTS },
        { id: 'academy', label: 'Academy', icon: GraduationCap, feature: FeatureKey.ACADEMY }
    ];

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Ecosystem Control Center</h1>
                    <p className="text-gray-400">Manage revenue streams and infrastructure modules.</p>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-gray-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                            ? 'text-blue-500 border-blue-500'
                            : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'payments' && <PaymentsSection />}
                {activeTab === 'financing' && <FinancingSection />}
                {activeTab === 'marketplace' && <MarketplaceSection />}
                {activeTab === 'trainers' && <TrainersSection />}
                {activeTab === 'corporate' && <CorporateSection />}
                {activeTab === 'insights' && <InsightsSection />}
                {activeTab === 'academy' && <AcademySection />}
            </div>
        </div>
    );
};

/* --- Sub-Sections --- */

const PaymentsSection = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        paymentService.getRevenueStats('default').then(setStats);
    }, []);

    return (
        <FeatureGate feature={FeatureKey.SPARTAN_PAYMENTS}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <p className="text-sm text-gray-400">Monthly Volume</p>
                    <h3 className="text-2xl font-bold text-white mt-1">${stats?.totalVolume.toFixed(2) || '0.00'}</h3>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <p className="text-sm text-gray-400">Payment Success Rate</p>
                    <h3 className="text-2xl font-bold text-green-400 mt-1">{stats?.successRate.toFixed(1) || '0'}%</h3>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <p className="text-sm text-gray-400">Estimated Commission (1%)</p>
                    <h3 className="text-2xl font-bold text-blue-400 mt-1">${(stats?.totalVolume * 0.01).toFixed(2) || '0.00'}</h3>
                </div>
            </div>

            <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h4 className="font-medium text-white">Recent Transactions</h4>
                    <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                        <Filter className="w-3 h-3" />
                        <span>Filter Ledger</span>
                    </button>
                </div>
                <div className="p-12 text-center text-gray-500">
                    <p>No transactions found in this period.</p>
                </div>
            </div>
        </FeatureGate>
    );
};

const MarketplaceSection = () => {
    const [vendors, setVendors] = useState<any[]>([]);

    useEffect(() => {
        marketplaceService.getVendors().then(setVendors);
    }, []);

    return (
        <FeatureGate feature={FeatureKey.MARKETPLACE}>
            <div className="flex justify-between items-center mb-6 animate-in fade-in duration-300">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Search trainers, brands..."
                    />
                </div>
                <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full font-medium border border-blue-500/20">All Categories</span>
                    <span className="px-3 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-full border border-gray-700">Supplements</span>
                    <span className="px-3 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-full border border-gray-700">Equipment</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                    <div key={vendor.id} className="bg-gray-800/40 p-5 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center font-bold text-gray-300">
                                {vendor.name[0]}
                            </div>
                            {vendor.sponsored && (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Sponsored</span>
                            )}
                        </div>
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{vendor.name}</h4>
                        <p className="text-sm text-gray-400 mb-4">{vendor.category}</p>
                        <div className="flex items-center text-xs text-green-400 font-medium bg-green-500/10 w-fit px-2 py-1 rounded">
                            {(vendor.commissionRate * 100)}% Rev Share
                        </div>
                    </div>
                ))}
                <div className="border shadow-none bg-gray-800/30 p-5 rounded-xl border-dashed border-gray-700 hover:border-gray-500 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Suggest a Vendor</span>
                </div>
            </div>
        </FeatureGate>
    );
};

const InsightsSection = () => {
    const [benchmarks, setBenchmarks] = useState<any>(null);

    useEffect(() => {
        insightsService.getRegionalBenchmarks('Tegucigalpa').then(setBenchmarks);
    }, []);

    return (
        <FeatureGate feature={FeatureKey.REGIONAL_INSIGHTS}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                <div className="space-y-6">
                    <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-2 underline decoration-blue-500/30 underline-offset-4 decoration-2">Market Pulse: Central America</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">Aggregated data from 150+ gyms in the region to give you a strategic advantage.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Price</h4>
                            <p className="text-xl font-bold text-white">${benchmarks?.avgMembershipPrice}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Market Trend</h4>
                            <p className="text-xl font-bold text-green-400">{benchmarks?.marketTrend}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Peak Hour</h4>
                            <p className="text-xl font-bold text-white">{benchmarks?.peakHour}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Retention</h4>
                            <p className="text-xl font-bold text-blue-400">{benchmarks?.avgRetentionMonths} mo</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800/80">
                    <h4 className="font-bold text-white mb-6">Popular Classes Regionally</h4>
                    <div className="space-y-4">
                        {benchmarks?.popularCategories.map((cat: string, i: number) => (
                            <div key={i} className="flex justify-between items-center group">
                                <span className="text-sm text-gray-300 font-medium group-hover:text-blue-400 transition-colors uppercase tracking-wide">{cat}</span>
                                <div className="h-2 w-48 bg-gray-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${90 - (i * 15)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
};

const AcademySection = () => {
    return (
        <FeatureGate feature={FeatureKey.ACADEMY}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {[
                    { title: 'Scaling Your Gym', lessons: 12, progress: 45, icon: TrendingUp },
                    { title: 'Staff Motivation Mastery', lessons: 8, progress: 100, icon: Users },
                    { title: 'Advanced Digital Marketing', lessons: 15, progress: 0, icon: Target }
                ].map((course, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-500 transition-all flex flex-col group grayscale hover:grayscale-0 duration-500">
                        <div className="h-32 bg-gray-700/50 flex items-center justify-center">
                            <course.icon className="w-12 h-12 text-gray-500 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h4 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{course.title}</h4>
                            <p className="text-xs text-gray-400 mb-4">{course.lessons} Progressive Lessons</p>

                            <div className="mt-auto pt-4">
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 mb-1.5 tracking-wider">
                                    <span>Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                                </div>
                                {course.progress === 100 && (
                                    <div className="mt-3 flex items-center space-x-1.5 text-xs text-green-400 font-bold bg-green-500/10 w-fit px-2 py-1 rounded">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Certified</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </FeatureGate>
    );
};

// Placeholders for remaining sections to maintain clean structure
const FinancingSection = () => {
    return (
        <FeatureGate feature={FeatureKey.FINANCING}>
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center bg-gray-800/20 p-6 rounded-2xl border border-gray-700/50">
                    <div>
                        <h3 className="text-xl font-bold text-white">Active Financing Portfolio</h3>
                        <p className="text-gray-400 text-sm">Monitor installment health and credit risk.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                        Configure APR Rules
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Financed', value: '$12,450', color: 'text-white' },
                        { label: 'Active Contracts', value: '28', color: 'text-blue-400' },
                        { label: 'Default Rate', value: '2.1%', color: 'text-red-400' },
                        { label: 'Revenue (Interest)', value: '$840', color: 'text-green-400' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{stat.label}</p>
                            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Paid</th>
                                <th className="px-6 py-3">Next Due</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {[
                                { name: 'Carlos Morales', amount: '$450', paid: '3/6', due: 'Feb 15', status: 'ON_TRACK' },
                                { name: 'Elena Gomez', amount: '$600', paid: '1/12', due: 'Feb 12', status: 'OVERDUE' },
                                { name: 'Roberto Sanchez', amount: '$300', paid: '5/6', due: 'Feb 20', status: 'ON_TRACK' }
                            ].map((row, i) => (
                                <tr key={i} className="text-sm hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{row.name}</td>
                                    <td className="px-6 py-4 text-gray-400">{row.amount}</td>
                                    <td className="px-6 py-4 text-gray-400">{row.paid}</td>
                                    <td className="px-6 py-4 text-gray-400">{row.due}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'ON_TRACK' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </FeatureGate>
    );
};

const TrainersSection = () => {
    return (
        <FeatureGate feature={FeatureKey.TRAINER_SERVICES}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                <div className="bg-gray-800/30 p-8 rounded-3xl border border-gray-700/50 space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 underline decoration-green-500/30 underline-offset-4">Trainer Multi-Store</h3>
                        <p className="text-gray-400 text-sm">Empower trainers to sell digital programs while you earn automated commissions.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'Marcus "The Bull" Steel', sales: '$2,450', gymCut: '$735' },
                            { name: 'Sarah "Yoga" Flow', sales: '$1,800', gymCut: '$540' },
                            { name: 'David Coach', sales: '$900', gymCut: '$270' }
                        ].map((t, i) => (
                            <div key={i} className="flex justify-between items-center p-3 h-16 bg-gray-900/50 rounded-xl border border-gray-700/50 group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        {t.name[0]}
                                    </div>
                                    <span className="text-sm font-medium text-gray-300">{t.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Gym Profit</p>
                                    <p className="text-sm font-bold text-green-400">{t.gymCut}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-3xl text-white flex flex-col justify-between shadow-2xl shadow-blue-500/20">
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold">Monetization Logic</h3>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Every time a trainer sells a PT package or a Digital Program, the platform automatically routes 30% to the Gym treasury.
                        </p>
                    </div>
                    <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
                        Adjust Commission Splits
                    </button>
                </div>
            </div>
        </FeatureGate>
    );
};

const CorporateSection = () => {
    return (
        <FeatureGate feature={FeatureKey.CORPORATE_WELLNESS}>
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: 'Global Tech Corp', employees: 45, plan: 'Enterprise Gold', status: 'ACTIVE' },
                        { name: 'Innova Solutions', employees: 12, plan: 'Standard Corporate', status: 'ACTIVE' },
                        { name: 'City Bank', employees: 89, plan: 'Premium Access', status: 'PENDING_RENEWAL' }
                    ].map((corp, i) => (
                        <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg">🏢</div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${corp.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                                    }`}>{corp.status}</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">{corp.name}</h4>
                            <p className="text-xs text-gray-400 mb-4">{corp.employees} Monthly Active Users</p>
                            <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">{corp.plan}</span>
                                <button className="text-blue-400 text-xs font-bold hover:underline">HR Reports →</button>
                            </div>
                        </div>
                    ))}
                    <div className="border border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 grayscale opacity-30 cursor-pointer">
                        <Users className="w-8 h-8 text-gray-500" />
                        <span className="text-sm font-bold text-gray-500">Add New Partner</span>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
};

export default EcosystemPage;
