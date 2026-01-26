"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscriptionService, Plan } from "@/lib/services/subscriptionService";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: "", price: "", durationDays: "30" });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await subscriptionService.getPlans();
            setPlans(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlan.name || !newPlan.price) return;

        await subscriptionService.createPlan({
            name: newPlan.name,
            price: parseFloat(newPlan.price),
            durationDays: parseInt(newPlan.durationDays)
        });

        setNewPlan({ name: "", price: "", durationDays: "30" });
        setShowForm(false);
        loadPlans();
    };

    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                                <ArrowLeft size={20} /> Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-blue-500">Membership Plans</h1>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Plus size={20} /> New Plan
                            </button>
                        </div>

                        {showForm && (
                            <div className="mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700 animate-in slide-in-from-top-4">
                                <h3 className="text-xl font-semibold mb-4">Create New Plan</h3>
                                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Plan Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Monthly Gold"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                            value={newPlan.name}
                                            onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
                                        <input
                                            type="number"
                                            placeholder="50.00"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                            value={newPlan.price}
                                            onChange={e => setNewPlan({ ...newPlan, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Duration (Days)</label>
                                        <input
                                            type="number"
                                            placeholder="30"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                            value={newPlan.durationDays}
                                            onChange={e => setNewPlan({ ...newPlan, durationDays: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
                                        Save Plan
                                    </button>
                                </form>
                            </div>
                        )}

                        {loading ? (
                            <LoadingSpinner message="Loading Plan Options..." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <div key={plan.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                                            <p className="text-gray-400 mt-2">{plan.durationDays} Days Access</p>
                                        </div>
                                        <div className="mt-6 flex justify-between items-end">
                                            <span className="text-3xl font-bold text-blue-400">${plan.price}</span>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">ID: {plan.id.substring(0, 4)}</span>
                                        </div>
                                    </div>
                                ))}

                                {plans.length === 0 && !showForm && (
                                    <div className="col-span-full text-center py-10 text-gray-500">
                                        No plans found. Create one to get started.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
