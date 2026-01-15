"use client";

import { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/components/ui/NotificationSystem";

interface NotificationContextType {
    notifications: Array<{
        id: string;
        type: "success" | "error" | "warning" | "info";
        message: string;
        duration?: number;
    }>;
    addNotification: (type: "success" | "error" | "warning" | "info", message: string, duration?: number) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationsContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotificationsContext must be used within NotificationProvider");
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const notificationHook = useNotifications();

    return (
        <NotificationContext.Provider value={notificationHook}>
            {children}
        </NotificationContext.Provider>
    );
};