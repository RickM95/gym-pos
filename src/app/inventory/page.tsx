"use client";

import { Suspense } from "react";
import { FeatureGate } from "@/components/auth/FeatureProvider";
import { FeatureKey } from "@/lib/constants/features";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import Navigation from "@/components/navigation/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function InventoryPage() {
    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto text-white">
                        <FeatureGate feature={FeatureKey.INVENTORY} fallback={<div className="p-8 text-center text-gray-500">This module is not enabled for your current plan.</div>}>
                            <Suspense fallback={<LoadingSpinner message="Checking Stock..." />}>
                                <InventoryManagement />
                            </Suspense>
                        </FeatureGate>
                    </div>
                </div>
            </div>
        </div>
    );
}