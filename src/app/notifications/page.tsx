"use client";

import React, { useState, useEffect } from 'react';
import {
    Bell,
    MessageSquare,
    Mail,
    History,
    Settings,
    Zap,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronDown,
    Filter,
    Send
} from 'lucide-react';
import { FeatureGate } from '@/components/auth/FeatureProvider';
import { FeatureKey } from '@/lib/constants/features';
import { getDB } from '@/lib/db';

interface NotificationLog {
    id: string;
    clientId: string;
    type: string;
    channel: 'WHATSAPP' | 'EMAIL';
    status: 'SENT' | 'FAILED' | 'PENDING';
    message: string;
    scheduledFor: string;
    sentAt?: string;
    error?: string;
}

export default function NotificationsPage() {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'PENDING'>('ALL');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const db = await getDB();
            const allLogs = await db.getAll('notifications');
            setLogs(allLogs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as any);
        } catch (error) {
            console.error('Failed to load notification logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.status === filter);

    const stats = {
        total: logs.length,
        sent: logs.filter(l => l.status === 'SENT').length,
        failed: logs.filter(l => l.status === 'FAILED').length,
        pending: logs.filter(l => l.status === 'PENDING').length
    };

    return (
        <FeatureGate feature={FeatureKey.NOTIFICATIONS} fallback={
            <div className="p-8 text-center bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <Bell size={64} className="text-gray-700 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Automated Communications Disabled</h2>
                <p className="text-gray-400 max-w-md">
                    This module handles automated WhatsApp and Email reminders.
                    Please upgrade to the **ENTERPRISE** tier to enable this feature.
                </p>
            </div>
        }>
            <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Automation Control Center</h1>
                        <p className="text-gray-400">Monitor automated communications and member engagement.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Total Attempted</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                        <p className="text-green-400 text-sm mb-1">Successfully Sent</p>
                        <p className="text-2xl font-bold text-white">{stats.sent}</p>
                    </div>
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                        <p className="text-red-400 text-sm mb-1">Errors / Failed</p>
                        <p className="text-2xl font-bold text-white">{stats.failed}</p>
                    </div>
                    <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                        <p className="text-blue-400 text-sm mb-1">Scheduled / Pending</p>
                        <p className="text-2xl font-bold text-white">{stats.pending}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History size={20} className="text-gray-400" />
                        Communication Logs
                    </h2>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="SENT">Sent Successfully</option>
                            <option value="FAILED">Failed Attempt</option>
                            <option value="PENDING">Pending Delivery</option>
                        </select>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Channel</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Message Preview</th>
                                    <th className="px-6 py-4">Date/Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading logs...</td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No logs found for the selected filter.</td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-700/20 transition-colors">
                                            <td className="px-6 py-4">
                                                {log.status === 'SENT' ? (
                                                    <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                                                        <CheckCircle2 size={14} /> Sent
                                                    </span>
                                                ) : log.status === 'FAILED' ? (
                                                    <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                                                        <XCircle size={14} /> Failed
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                                                        <Clock size={14} /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-sm text-gray-300">
                                                    {log.channel === 'WHATSAPP' ? (
                                                        <MessageSquare size={16} className="text-green-500" />
                                                    ) : (
                                                        <Mail size={16} className="text-blue-500" />
                                                    )}
                                                    {log.channel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-200">
                                                {log.type.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                                                {log.message}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(log.sentAt || log.scheduledFor).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
