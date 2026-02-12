"use client";

import React from 'react';
import { Wallet } from 'lucide-react';
import { FeatureGate } from '@/components/auth/FeatureProvider';
import { FeatureKey } from '@/lib/constants/features';
import Navigation from '@/components/navigation/Navigation';

export default function PayrollPage() {
    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <FeatureGate feature={FeatureKey.PAYROLL} fallback={
                    <div className="p-8 text-center bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                        <Wallet size={64} className="text-gray-700 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Payroll Module Disabled</h2>
                        <p className="text-gray-400 max-w-md">
                            Advanced reporting and staff payroll automation is available in the **ENTERPRISE** tier.
                        </p>
                    </div>
                }>
                    <div className="p-8 text-center text-white">
                        <h1 className="text-2xl font-bold">Staff Payroll</h1>
                        <p className="text-gray-400 mt-4">Feature implementation in progress...</p>
                    </div>
                </FeatureGate>
            </div>
        </div>
    );
}
