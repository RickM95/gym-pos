"use client";

import ClientAuthProvider from "@/components/auth/ClientAuthProvider";
import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClientAuthProvider>
            <GlobalNotificationProvider>
                {children}
            </GlobalNotificationProvider>
        </ClientAuthProvider>
    );
}