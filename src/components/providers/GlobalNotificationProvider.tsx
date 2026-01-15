"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { NotificationType } from "@/components/ui/NotificationSystem";

interface GlobalNotification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: GlobalNotification[];
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useGlobalNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useGlobalNotifications must be used within GlobalNotificationProvider");
    }
    return context;
};

interface GlobalNotificationProviderProps {
    children: ReactNode;
}

export const GlobalNotificationProvider = ({ children }: GlobalNotificationProviderProps) => {
    const [notifications, setNotifications] = useState<GlobalNotification[]>([]);

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = `notification-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        setNotifications(prev => [...prev, { id, type, message, duration }]);
        
        // Auto-remove after duration
        if (duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration || 5000);
        }
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};