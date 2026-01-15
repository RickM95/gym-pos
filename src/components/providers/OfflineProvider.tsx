"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface OfflineContextType {
    isOnline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({ isOnline: true });

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOnline }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => useContext(OfflineContext);
