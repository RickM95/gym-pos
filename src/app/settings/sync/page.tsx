"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDB } from "@/lib/db";
import { syncService } from "@/lib/services/syncService";
import { ArrowLeft, RefreshCw, Trash2, Database } from "lucide-react";
import { SyncEvent } from "@/lib/sync";

export default function SyncSettingsPage() {
    const [events, setEvents] = useState<SyncEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        const db = await getDB();
        const allEvents = await db.getAll('events');
        // Sort by timestamp desc
        setEvents((allEvents as any as SyncEvent[]).sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleForceSync = async () => {
        setLoading(true);
        await syncService.syncEvents();
        await loadEvents();
        setLoading(false);
    };

    const handleClearSynced = async () => {
        if (!confirm("Delete all synced events from local log? This cannot be undone.")) return;
        const db = await getDB();
        const tx = db.transaction('events', 'readwrite');
        const store = tx.objectStore('events');

        // Iterate and delete synced
        const synced = events.filter(e => e.synced === 1);
        for (const e of synced) {
            await store.delete(e.id);
        }
        await tx.done;
        loadEvents();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                        <ArrowLeft size={20} /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-purple-500">Sync Debugger</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleForceSync}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            Force Sync
                        </button>
                        <button
                            onClick={handleClearSynced}
                            className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-700"
                        >
                            <Trash2 size={18} />
                            Clear Logs
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="font-bold flex items-center gap-2"><Database size={18} /> Event Log</h2>
                        <span className="text-sm text-gray-400">{events.length} Total / {events.filter(e => e.synced === 0).length} Pending</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/50 text-gray-400 uppercase">
                                <tr>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Payload (ID)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {events.map(event => (
                                    <tr key={event.id} className="hover:bg-gray-700/50">
                                        <td className="p-4">
                                            {event.synced === 1 ? (
                                                <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs border border-green-900">Synced</span>
                                            ) : (
                                                <span className="bg-orange-900/30 text-orange-400 px-2 py-1 rounded text-xs border border-orange-900">Pending</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-gray-300">{event.type}</td>
                                        <td className="p-4 text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                                        <td className="p-4 font-mono text-gray-500">
                                            {/* @ts-ignore */}
                                            {event.payload?.id || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">Log is empty.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
