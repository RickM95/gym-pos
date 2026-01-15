"use client";

import { AddClientForm } from "@/components/clients/AddClientForm";
import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";
import Navigation from "@/components/navigation/Navigation";

export default function AddClientPage() {
    return (
        <GlobalNotificationProvider>
            <div className="flex h-screen bg-gray-900">
                <Navigation />

                <div className="flex-1 lg:ml-0 overflow-auto">
                    <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                        <div className="max-w-4xl mx-auto">
                            <AddClientForm />
                        </div>
                    </div>
                </div>
            </div>
        </GlobalNotificationProvider>
    );
}
