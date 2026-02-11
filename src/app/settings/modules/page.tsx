"use client";

import React from 'react';
import { useFeatures } from '@/components/auth/FeatureProvider';
import { FeatureKey, DEFAULT_FEATURES } from '@/lib/constants/features';
import { ToggleRight, ToggleLeft, Info, ShieldCheck, Box, Zap } from 'lucide-react';

export default function ModularSettingsPage() {
    const { features, updateFeature, isLoading } = useFeatures();

    const toggleFeature = async (key: FeatureKey) => {
        try {
            await updateFeature(key, !features[key]);
        } catch (error) {
            alert('Failed to update feature.');
        }
    };

    if (isLoading) return <div className="p-8 text-white">Loading modules...</div>;

    const categories = {
        'BASIC': Object.values(DEFAULT_FEATURES).filter(f => f.tier === 'BASIC'),
        'PRO': Object.values(DEFAULT_FEATURES).filter(f => f.tier === 'PRO'),
        'ENTERPRISE': Object.values(DEFAULT_FEATURES).filter(f => f.tier === 'ENTERPRISE'),
    };

    return (
        <div className="max-w-4xl mx-auto p-8 text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Module Management</h1>
                <p className="text-gray-400 mt-1">Enable or disable features based on your client's budget and requirements.</p>
            </div>

            <div className="space-y-12">
                {Object.entries(categories).map(([tier, moduleList]) => (
                    <section key={tier}>
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-2">
                            {tier === 'BASIC' && <Box className="text-blue-400" size={20} />}
                            {tier === 'PRO' && <Zap className="text-purple-400" size={20} />}
                            {tier === 'ENTERPRISE' && <ShieldCheck className="text-orange-400" size={20} />}
                            <h2 className="text-xl font-bold uppercase tracking-wider">{tier} Modules</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {moduleList.map(module => (
                                <div
                                    key={module.id}
                                    className={`p-6 rounded-xl border transition-all ${features[module.id]
                                            ? 'bg-gray-800/80 border-blue-500/50 shadow-lg shadow-blue-500/5'
                                            : 'bg-gray-900/50 border-gray-800 grayscale opacity-60'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
                                            {tier === 'BASIC' && <Box size={24} className="text-blue-500" />}
                                            {tier === 'PRO' && <Zap size={24} className="text-purple-500" />}
                                            {tier === 'ENTERPRISE' && <ShieldCheck size={24} className="text-orange-500" />}
                                        </div>
                                        <button
                                            onClick={() => toggleFeature(module.id)}
                                            className="transition-colors outline-none"
                                        >
                                            {features[module.id] ? (
                                                <ToggleRight size={44} className="text-blue-500" />
                                            ) : (
                                                <ToggleLeft size={44} className="text-gray-600" />
                                            )}
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold mb-1">{module.label}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                        {module.description}
                                    </p>

                                    <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-gray-900 w-fit border border-gray-700">
                                        <Info size={12} className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            Pricing Impact: {tier}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-12 p-6 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                    <Info className="text-white" size={24} />
                </div>
                <p className="text-blue-200 text-sm">
                    <strong>Client Setup Mode:</strong> As the system administrator, you can toggle these modules before handing the platform to your client. This directly controls the navigation menu and dashboard widgets.
                </p>
            </div>
        </div>
    );
}
