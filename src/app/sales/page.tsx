"use client";

import { Suspense } from "react";
import SalesExpenseManager from "@/components/sales/SalesExpenseManager";
import Navigation from "@/components/navigation/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SalesPage() {
    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto text-white">
                        <Suspense fallback={<LoadingSpinner message="Loading Sales data..." />}>
                            <SalesExpenseManager />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}