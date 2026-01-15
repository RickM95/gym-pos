"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const Notification = ({ id, type, message, duration = 5000, onClose }: NotificationProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Trigger entrance animation
        const entranceTimer = setTimeout(() => setIsVisible(true), 50);

        // Auto-dismiss timer - use consistent duration to avoid hydration mismatch
        const dismissTimer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
        }, duration);

        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / (duration / 100))));
        }, 100);

        return () => {
            clearTimeout(entranceTimer);
            clearTimeout(dismissTimer);
            clearInterval(progressInterval);
        };
    }, [id, duration, onClose, mounted]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case "error":
                return <XCircle className="w-6 h-6 text-red-500" />;
            case "warning":
                return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            case "info":
                return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "success":
                return "bg-green-900/90 border-green-500";
            case "error":
                return "bg-red-900/90 border-red-500";
            case "warning":
                return "bg-yellow-900/90 border-yellow-500";
            case "info":
                return "bg-blue-900/90 border-blue-500";
        }
    };

    return (
        <div
            className={`
                fixed top-4 right-4 z-50 max-w-sm
                transform transition-all duration-300 ease-in-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <div className={`
                ${getBgColor()} backdrop-blur-sm
                border rounded-lg shadow-xl p-4
                flex items-start gap-3
                animate-in slide-in-from-right
            `}>
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium break-words">
                        {message}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white/50 transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

interface NotificationContainerProps {
    notifications: Array<{
        id: string;
        type: NotificationType;
        message: string;
        duration?: number;
    }>;
    onClose: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onClose }: NotificationContainerProps) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <Notification
                        id={notification.id}
                        type={notification.type}
                        message={notification.message}
                        duration={notification.duration}
                        onClose={onClose}
                    />
                </div>
            ))}
        </div>
    );
};

// Hook for managing notifications
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        type: NotificationType;
        message: string;
        duration?: number;
    }>>([]);

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, type, message, duration }]);
        return id;
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll
    };
};