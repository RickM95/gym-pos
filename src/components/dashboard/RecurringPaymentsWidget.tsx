"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { RecurringExpenseConfig, recurringService } from "@/lib/services/recurringService";

export default function RecurringPaymentsWidget() {
    const [dueConfigs, setDueConfigs] = useState<RecurringExpenseConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDueConfigs();
    }, []);

    const loadDueConfigs = async () => {
        try {
            const allConfigs = await recurringService.getConfigs();
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Filter for active configs that haven't been paid this month
            const due = allConfigs.filter(config => {
                if (!config.isActive) return false;

                if (config.lastPaidDate) {
                    const lastPaid = new Date(config.lastPaidDate);
                    if (lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear) {
                        return false; // Already paid
                    }
                }
                return true; // Not paid this month
            });

            // Sort by due day
            due.sort((a, b) => a.dueDay - b.dueDay);
            setDueConfigs(due.slice(0, 3)); // Only show top 3
        } catch (error) {
            console.error("Failed to load dashboard recurring configs", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse h-48 flex items-center justify-center text-gray-500">
            Checking recurring payments...
        </div>
    );

    if (dueConfigs.length === 0) return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-blue-400" />
                    Recurring Payments
                </h3>
            </div>
            <div className="flex flex-col items-center justify-center py-4 text-center">
                <CheckCircle size={32} className="text-green-500/30 mb-2" />
                <p className="text-sm text-gray-400">All recurring payments for this month are recorded.</p>
            </div>
            <Link
                href="/analytics"
                className="mt-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-center transition"
            >
                Manage Configs <ArrowRight size={12} />
            </Link>
        </div>
    );

    const now = new Date();
    const today = now.getDate();

    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-blue-400" />
                    Recurring Payments
                </h3>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {dueConfigs.length} Pending
                </span>
            </div>

            <div className="space-y-3 flex-1">
                {dueConfigs.map(config => {
                    const isOverdue = today > config.dueDay;
                    return (
                        <div key={config.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50 border border-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                    {isOverdue ? <AlertCircle size={14} /> : <Clock size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white line-clamp-1">{config.name}</p>
                                    <p className="text-[10px] text-gray-500">Day {config.dueDay} • L {config.amount.toLocaleString()}</p>
                                </div>
                            </div>
                            {isOverdue && <span className="text-[10px] font-bold text-red-500 uppercase">Overdue</span>}
                        </div>
                    );
                })}
            </div>

            <Link
                href="/analytics"
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-center transition font-medium border-t border-gray-700 pt-4"
            >
                View All & Pay <ArrowRight size={14} />
            </Link>
        </div>
    );
}

function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
