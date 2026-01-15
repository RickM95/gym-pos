"use client";

import { useOffline } from "@/components/providers/OfflineProvider";
import { WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
    const { isOnline } = useOffline();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
            <WifiOff size={20} />
            <span className="font-semibold">You are offline</span>
        </div>
    );
};
