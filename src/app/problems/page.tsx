"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bug, RefreshCw, Terminal } from "lucide-react";
import { loggerService, LogEntry } from "@/lib/services/loggerService";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProblemsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await loggerService.getLogs();
        // Sort descending
        setLogs(data.reverse());
        setLoading(false);
    };

    // Strictly restrict to TECH role
    if (user?.role !== 'TECH') {
        return (
            <div className="min-h-screen bg-black text-green-500 font-mono p-6 flex flex-col items-center justify-center">
                <Terminal size={64} className="mb-4 animate-pulse" />
                <h1 className="text-4xl font-bold mb-2">ACCESS DENIED</h1>
                <p>System Level Clearance Required.</p>
                <p className="text-sm mt-4 text-green-700">User: {user?.name}</p>
                <Link href="/" className="mt-8 hover:underline">&lt; Return to Surface</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-6">
            <header className="flex justify-between items-center mb-8 border-b border-green-800 pb-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-green-700 hover:text-green-500 hover:no-underline">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bug /> SYSTEM LOGS
                    </h1>
                </div>
                <button
                    onClick={loadLogs}
                    className="flex items-center gap-2 hover:bg-green-900/30 px-3 py-1 rounded transition"
                >
                    <RefreshCw size={16} /> REFRESH
                </button>
            </header>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-green-800 text-green-700">
                            <th className="p-3">TIME</th>
                            <th className="p-3">TYPE</th>
                            <th className="p-3">USER</th>
                            <th className="p-3">MESSAGE</th>
                            <th className="p-3">DETAILS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b border-green-900/50 hover:bg-green-900/10">
                                <td className="p-3 whitespace-nowrap text-green-600">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'ERROR' ? 'bg-red-900/50 text-red-500' : 'bg-yellow-900/50 text-yellow-500'}`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-3 text-sm">
                                    <div>{log.user}</div>
                                    <div className="text-xs text-green-800">[{log.role}]</div>
                                </td>
                                <td className="p-3 font-bold">{log.message}</td>
                                <td className="p-3 text-xs text-green-600 max-w-md truncate" title={log.details}>
                                    {log.details || '-'}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-green-800">
                                    NO ANOMALIES DETECTED.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
