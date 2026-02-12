"use client";

import { FeatureGate } from "@/components/auth/FeatureProvider";
import { FeatureKey } from "@/lib/constants/features";
import Navigation from "@/components/navigation/Navigation";
import { Tag, Plus, TrendingUp, DollarSign } from "lucide-react";

export default function PromotionsPage() {
    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto text-white">
                        <FeatureGate feature={FeatureKey.POS_PROMOTIONS} fallback={
                            <div className="p-8 text-center text-gray-500">
                                This module is not enabled for your current plan.
                            </div>
                        }>
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white">Promotions & Bundles</h1>
                                        <p className="text-gray-400 mt-1">Manage discounts, promotions, and product bundles</p>
                                    </div>
                                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition">
                                        <Plus size={18} />
                                        Create Promotion
                                    </button>
                                </div>

                                {/* Placeholder */}
                                <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-3xl p-20 text-center">
                                    <Tag size={64} className="text-gray-600 mx-auto mb-6" />
                                    <h2 className="text-2xl font-bold text-gray-400 mb-3">Promotions Management</h2>
                                    <p className="text-gray-500 max-w-lg mx-auto">
                                        This module allows you to create discounts, bundle products, and run promotional campaigns.
                                        Feature is currently under development.
                                    </p>
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                                            <div className="inline-flex p-3 bg-primary/20 rounded-lg mb-4">
                                                <Tag className="text-primary" size={24} />
                                            </div>
                                            <h3 className="text-white font-bold mb-2">Discount Codes</h3>
                                            <p className="text-gray-400 text-sm">Create percentage or fixed-amount discounts for members.</p>
                                        </div>
                                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                                            <div className="inline-flex p-3 bg-green-500/20 rounded-lg mb-4">
                                                <TrendingUp className="text-green-400" size={24} />
                                            </div>
                                            <h3 className="text-white font-bold mb-2">Product Bundles</h3>
                                            <p className="text-gray-400 text-sm">Bundle multiple products together at a special price.</p>
                                        </div>
                                        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                                            <div className="inline-flex p-3 bg-purple-500/20 rounded-lg mb-4">
                                                <DollarSign className="text-purple-400" size={24} />
                                            </div>
                                            <h3 className="text-white font-bold mb-2">Campaign Analytics</h3>
                                            <p className="text-gray-400 text-sm">Track redemption rates and revenue impact.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FeatureGate>
                    </div>
                </div>
            </div>
        </div>
    );
}