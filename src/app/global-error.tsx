"use client";

import { useEffect } from "react";
import { loggerService } from "@/lib/services/loggerService";
import { useAuth } from "@/components/auth/AuthProvider";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { user } = useAuth();

    useEffect(() => {
        // Log exception automatically
        loggerService.logError(error, user);
    }, [error, user]);

    return (
        <html>
            <body className="bg-gray-900 text-white flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <h2 className="text-3xl font-bold text-red-500 mb-4">System Critical Failure</h2>
                <p className="max-w-md text-gray-400 mb-8">
                    A fatal anomaly has been detected. The event has been logged for Tech Support (`9999`).
                </p>
                <button
                    onClick={() => reset()}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold"
                >
                    Attempt System Reset
                </button>
            </body>
        </html>
    );
}
