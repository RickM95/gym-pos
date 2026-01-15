"use client";

import { useState, useEffect } from "react";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { NotificationContainer } from "@/components/ui/NotificationSystem";

export default function GlobalNotificationContainer() {
    const { notifications, removeNotification } = useGlobalNotifications();
    
    return (
        <NotificationContainer 
            notifications={notifications} 
            onClose={removeNotification} 
        />
    );
}