"use client";

import { Suspense } from "react";
import SalesExpenseManager from "@/components/sales/SalesExpenseManager";

export default function SalesPage() {
    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                }>
                    <SalesExpenseManager />
                </Suspense>
            </div>
        </div>
    );
}