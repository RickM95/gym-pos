"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Scanner } from "@/components/scanner/Scanner";
import { GlobalNotificationProvider, useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { checkinService, CheckinResult } from "@/lib/services/checkinService";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Calendar, CreditCard, AlertTriangle, Camera } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";

function ScanPageContent() {
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState<CheckinResult | null>(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
    const [clientPhoto, setClientPhoto] = useState<string | null>(null);
    const { addNotification } = useGlobalNotifications();

    const handleScan = async (clientId: string) => {
        try {
            const checkinResult = await checkinService.checkIn(clientId);
            setResult(checkinResult);
            setScanning(false);

            if (checkinResult.success && checkinResult.client) {
                // Load subscription info
                try {
                    const subscription = await subscriptionService.getActiveSubscription(checkinResult.client.id);
                    if (subscription) {
                        setSubscriptionInfo(subscription);
                    }
                } catch (error) {
                    console.error('Failed to load subscription:', error);
                }

                addNotification("success", `Welcome ${checkinResult.client.name}!`, 3000);
            } else {
                addNotification("error", checkinResult.message || "Check-in failed", 5000);
            }
        } catch (error) {
            console.error('Check-in error:', error);
            setResult({
                success: false,
                message: "Failed to process check-in. Please try again."
            });
            setScanning(false);
            addNotification("error", "Check-in failed", 5000);
        }
    };

    const handleClientPhoto = (photoDataUrl: string) => {
        setClientPhoto(photoDataUrl);
    };

    const resetScanner = () => {
        setScanning(true);
        setResult(null);
        setSubscriptionInfo(null);
        setClientPhoto(null);
    };

    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="p-6 flex flex-col">
                            <div className="mb-6 flex items-center justify-between">
                                <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                                    <ArrowLeft size={20} /> Dashboard
                                </Link>
                                <h1 className="text-2xl font-bold text-blue-500">Check-In</h1>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center">
                                {scanning ? (
                                    <Scanner onScan={handleScan} onClientPhoto={handleClientPhoto} />
                                ) : (
                                    <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center animate-in fade-in zoom-in duration-300">
                                        {result?.success ? (
                                            <>
                                                <div className="mx-auto mb-4 bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center text-green-400">
                                                    <CheckCircle size={48} />
                                                </div>
                                                <h2 className="text-3xl font-bold text-white mb-2">Access Granted</h2>
                                                <p className="text-xl text-green-400 mb-6">{result.message}</p>

                                                {result.client && (
                                                    <div className="bg-gray-900 p-4 rounded-lg mb-6 text-left">
                                                        <div className="flex items-center gap-4 mb-3">
                                                            {(clientPhoto || result.client.photoUrl) ? (
                                                                <img
                                                                    src={clientPhoto || result.client.photoUrl}
                                                                    alt={result.client.name}
                                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                                                                    <Camera className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <p className="text-gray-500 text-sm">Client Name</p>
                                                                <p className="font-semibold text-lg">{result.client.name}</p>
                                                                {clientPhoto && (
                                                                    <p className="text-xs text-green-400 mt-1">✓ Photo captured during check-in</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {subscriptionInfo && (
                                                            <div className="bg-green-900/20 border border-green-500/50 p-3 rounded-lg mb-3">
                                                                <div className="flex items-center gap-2 text-green-400 mb-1">
                                                                    <CreditCard size={16} />
                                                                    <span className="font-semibold">{subscriptionInfo.planName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar size={12} />
                                                                        Ends: {new Date(subscriptionInfo.endDate).toLocaleDateString()}
                                                                    </span>
                                                                    <span>
                                                                        {Math.ceil((new Date(subscriptionInfo.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {result.client.notes && (
                                                            <div className="text-sm text-yellow-500 bg-yellow-900/20 p-2 rounded border border-yellow-900/50">
                                                                ⚠ Note: {result.client.notes}
                                                            </div>
                                                        )}

                                                        {!subscriptionInfo && (
                                                            <div className="bg-red-900/20 border border-red-500/50 p-2 rounded flex items-center gap-2 text-red-400">
                                                                <AlertTriangle size={16} />
                                                                <span className="text-sm">No active subscription</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="mx-auto mb-4 bg-red-900/30 w-20 h-20 rounded-full flex items-center justify-center text-red-500">
                                                    <XCircle size={48} />
                                                </div>
                                                <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
                                                <p className="text-xl text-red-400 mb-6">{result?.message}</p>
                                            </>
                                        )}

                                        <button
                                            onClick={resetScanner}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={20} />
                                            Scan Next Client
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ScanPage() {
    return (
        <GlobalNotificationProvider>
            <ScanPageContent />
        </GlobalNotificationProvider>
    );
}