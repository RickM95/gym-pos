"use client";

import { useEffect, useState } from "react";
import { syncService } from "@/lib/services/syncService";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";
import { useOffline } from "@/components/providers/OfflineProvider";

export default function SyncIndicator() {
    const { isOnline } = useOffline();
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Poll for pending changes every 5s
    useEffect(() => {
        const checkPending = async () => {
            const count = await syncService.getPendingCount();
            setPendingCount(count);
        };

        checkPending();
        const interval = setInterval(checkPending, 5000);
        return () => clearInterval(interval);
    }, []);

    // Trigger auto-sync if online and have pending changes
    useEffect(() => {
        if (isOnline && pendingCount > 0 && !isSyncing) {
            handleSync();
        }
    }, [isOnline, pendingCount, isSyncing]);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncService.syncEvents();
        const remain = await syncService.getPendingCount();
        setPendingCount(remain);
        if (remain === 0) setLastSynced(new Date());
        setIsSyncing(false);
    };

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
                <CloudOff size={16} />
                <span>Offline ({pendingCount} pending)</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
                <RefreshCw size={16} className="animate-spin" />
                <span>Syncing...</span>
            </div>
        );
    }

    if (pendingCount === 0) {
        return (
            <div className="flex items-center gap-2 text-green-500 text-sm">
                <Check size={16} />
                <span>Synced</span>
            </div>
        );
    }

    return (
        <button onClick={handleSync} className="flex items-center gap-2 text-orange-400 text-sm hover:text-orange-300">
            <Cloud size={16} />
            <span>{pendingCount} Pending (Click to Sync)</span>
        </button>
    );
}
