"use client";

import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import Navigation from "@/components/navigation/Navigation";
import SyncIndicator from "@/components/sync/SyncIndicator";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import BugReportModal from "@/components/ui/BugReportModal";
import GlobalNotificationContainer from "@/app/GlobalNotificationContainer";

export default function AppProviders({
    children,
}: {
    children: React.ReactNode;
    }) {
    return (
        <GlobalNotificationProvider>
            <OfflineProvider>
                <div className="flex h-screen">
                    <Navigation />
                    
                    {/* Main Content Area */}
                    <div className="flex-1 lg:ml-0 overflow-auto">
                        {/* Header for global status */}
                        <div className="fixed top-0 right-0 p-4 z-30">
                            <SyncIndicator />
                        </div>

                        <div className="pt-16 lg:pt-0">
                            {children}
                        </div>
                    </div>
                </div>
                
                <OfflineIndicator />
                <BugReportModal />
                <GlobalNotificationContainer />
            </OfflineProvider>
        </GlobalNotificationProvider>
    );
}