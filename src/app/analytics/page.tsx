"use client";

import { Suspense } from "react";
import BusinessDashboard from "@/components/analytics/BusinessDashboard";
import Navigation from "@/components/navigation/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
    const router = useRouter();

    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => router.back()}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border border-gray-700 transition"
                                title="Go Back"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Business Analytics</h1>
                                <p className="text-gray-400 mt-1">Deep dive into gym performance and financial metrics</p>
                            </div>
                        </div>

                        <Suspense fallback={<LoadingSpinner message="Calculating Gains..." />}>
                            <BusinessDashboard />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}