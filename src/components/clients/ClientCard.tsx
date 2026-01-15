"use client";

import { useState, useEffect } from "react";
import { Client } from "@/lib/services/clientService";
import { subscriptionService, Subscription, Plan } from "@/lib/services/subscriptionService";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { Calendar, CreditCard, AlertTriangle, RefreshCw, Camera } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProfilePicture } from "@/components/ui/ProfilePicture";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";

interface ClientCardProps {
    client: Client;
    onUpdate?: () => void;
}

export const ClientCard = ({ client, onUpdate }: ClientCardProps) => {
    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewing, setRenewing] = useState(false);

    // Parse phone number to extract country code
    const getCountryFromPhone = (phone: string) => {
        if (!phone) return null;
        
        // Remove non-digit characters
        const digits = phone.replace(/\D/g, '');
        
        // Check for common prefixes
        const prefixes = {
            '+1': ['US', 'CA'], // North America
            '+44': ['GB'], // United Kingdom
            '+49': ['DE'], // Germany
            '+52': ['MX'], // Mexico
            '+54': ['AR'], // Argentina
            '+55': ['BR'], // Brazil
            '+56': ['CL'], // Chile
            '+57': ['CO'], // Colombia
            '+58': ['VE'], // Venezuela
            '+34': ['ES'], // Spain
            '+39': ['IT'], // Italy
            '+33': ['FR'], // France
            '+43': ['AT'], // Austria
            '+31': ['NL'], // Netherlands
            '+46': ['SE'], // Sweden
            '+47': ['NO'], // Norway
            '+45': ['DK'], // Denmark
            '+354': ['IE'], // Ireland
            '+41': ['CH'], // Switzerland
            '+48': ['PL'], // Poland
            '+420': ['CZ'], // Czech Republic
            '+36': ['HU'], // Hungary
            '+90': ['TR'], // Turkey
            '+20': ['EG'], // Egypt
            '+27': ['ZA'], // South Africa
            '+91': ['IN'], // India
            '+62': ['ID'], // Indonesia
            '+63': ['PH'], // Philippines
            '+66': ['SG'], // Singapore
            '+60': ['MY'], // Malaysia
            '+81': ['JP'], // Japan
            '+86': ['CN'], // China
            '+82': ['KR'], // South Korea
            '+7': ['RU'], // Russia
            '+65': ['AU'], // Australia
            '+64': ['NZ'], // New Zealand
            '+254': ['KE'], // Kenya
        };
        
        for (const [code, countries] of Object.entries(prefixes)) {
            if (digits.startsWith(code) && countries.length === 1) {
                return countries[0]; // Return first country for simplicity
            }
        }
        
        return null;
    };

    // Check if current user can edit photos
    const canEditPhotos = user?.permissions?.edit_photos || user?.role === 'ADMIN';

    useEffect(() => {
        loadSubscriptionData();
    }, [client.id]);

    const loadSubscriptionData = async () => {
        try {
            const [sub, plansData] = await Promise.all([
                subscriptionService.getActiveSubscription(client.id),
                subscriptionService.getPlans()
            ]);
            setActiveSub(sub);
            setPlans(plansData);
        } catch (error) {
            console.error("Failed to load subscription data", error);
        }
    };

    const handleRenew = async (planId: string) => {
        if (!confirm("Assign this plan? Use this only if payment is collected.")) return;
        
        setRenewing(true);
        try {
            await subscriptionService.assignSubscription(client.id, planId);
            await loadSubscriptionData();
            setShowRenewModal(false);
            onUpdate?.();
            addNotification("success", "Subscription renewed successfully!", 3000);
        } catch (error) {
            console.error("Failed to renew subscription", error);
            addNotification("error", "Error renewing subscription", 5000);
        } finally {
            setRenewing(false);
        }
    };

    const getSubscriptionStatus = () => {
        if (!activeSub) {
            return { 
                status: "NO SUBSCRIPTION", 
                color: "text-red-400", 
                bgColor: "bg-red-900/20", 
                borderColor: "border-red-500/50",
                daysRemaining: null,
                expiryDate: null,
                isActive: false
            };
        }
        
        const now = new Date();
        const endDate = new Date(activeSub.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isActive = daysLeft > 0;
        
        if (!isActive) {
            return { 
                status: "EXPIRED", 
                color: "text-red-400", 
                bgColor: "bg-red-900/20", 
                borderColor: "border-red-500/50",
                daysRemaining: Math.abs(daysLeft),
                expiryDate: activeSub.endDate,
                isActive: false
            };
        }
        
        return { 
            status: "ACTIVE", 
            color: "text-green-400", 
            bgColor: "bg-green-900/20", 
            borderColor: "border-green-500/50",
            daysRemaining: daysLeft,
            expiryDate: activeSub.endDate,
            isActive: true
        };
    };

    const subStatus = getSubscriptionStatus();

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="flex flex-col items-center gap-3">
                    <ProfilePicture 
                        currentPhoto={client.photoUrl}
                        onPhotoChange={async (photoUrl) => {
                            if (canEditPhotos && photoUrl !== undefined) {
                                try {
                                    // Update client with new photo
                                    const { clientService } = await import('@/lib/services/clientService');
                                    await clientService.updateClient(client.id, { photoUrl: photoUrl || undefined });
                                    onUpdate?.(); // Refresh the client list
                                    addNotification("success", "Photo updated successfully", 3000);
        } catch (error) {
            console.error('Failed to update client photo:', error);
            addNotification('error', 'Failed to update photo. Please try again.', 3000);
        }
                            }
                        }}
                        editable={canEditPhotos}
                        size={128}
                    />
                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG value={client.qrCode} size={80} />
                    </div>
                </div>
                
                <div className="flex-1">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                        <h3 className="text-xl font-bold text-white mb-3">{client.name}</h3>
                    </Link>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="space-y-1">
                            <p className="text-gray-500">Client ID</p>
                            <p className="font-mono text-white">{client.id.substring(0, 8)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Phone</p>
                            <p className="text-white">{client.phone || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Email</p>
                            <p className="text-white">{client.email || 'N/A'}</p>
                        </div>
                        
                        {/* Subscription Type - to the right of email */}
                        {activeSub && (
                            <div className="md:col-span-1 space-y-1">
                                <p className="text-gray-500">Subscription</p>
                                <p className="font-semibold text-blue-400">{activeSub.planName}</p>
                            </div>
                        )}
                        
                        {client.notes && (
                            <div className="md:col-span-3 space-y-1">
                                <p className="text-gray-500">Notes</p>
                                <p className="italic text-gray-400 text-xs">"{client.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium flex items-center justify-center gap-2 ${
                        client.status === 'active' || (!client.status && activeSub) 
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
                            : 'bg-red-900/30 text-red-400 border border-red-500/30'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            client.status === 'active' || (!client.status && activeSub) ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        {client.status === 'active' || (!client.status && activeSub) ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    
                    <div className="mt-3 space-y-3">
                        {activeSub ? (
                            <div className={`p-3 rounded-lg border ${
                                subStatus.isActive 
                                    ? 'bg-green-900/20 border-green-500/50' 
                                    : 'bg-red-900/20 border-red-500/50'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium px-2 py-1 rounded ${subStatus.bgColor}`}>
                                        {subStatus.isActive ? 'ACTIVE' : 'EXPIRED'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Expires</span>
                                    <span className="text-white">{new Date(subStatus.expiryDate!).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{subStatus.isActive ? "Days left" : "Days expired"}</span>
                                    <span className={`font-medium ${subStatus.color}`}>{subStatus.daysRemaining} days</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/50">
                                <div className="text-sm text-red-400">
                                    Client cannot check in
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setShowRenewModal(true)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={12} />
                        Renew/Change
                    </button>
                </div>
            </div>

            {/* Renew/Change Modal */}
            {showRenewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <RefreshCw size={20} />
                            Renew/Change Subscription
                        </h3>
                        <p className="text-gray-400 mb-4">Select a new plan for {client.name}</p>
                        
                        <div className="space-y-3 mb-4">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => handleRenew(plan.id)}
                                    disabled={renewing}
                                    className="w-full flex justify-between items-center p-3 rounded-lg border border-gray-600 hover:bg-gray-700 hover:border-blue-500 transition"
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-white">{plan.name}</div>
                                        <div className="text-xs text-gray-400">{plan.durationDays} Days</div>
                                    </div>
                                    <div className="text-blue-400 font-bold">${plan.price}</div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRenewModal(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};