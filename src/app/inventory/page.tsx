"use client";

import { Suspense } from "react";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import Navigation from "@/components/navigation/Navigation";

export default function InventoryPage() {
    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto text-white">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        }>
                            <InventoryManagement />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}