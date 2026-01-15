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
import { Check, X } from "lucide-react";

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

    // Modal Flow State
    const [renewalStep, setRenewalStep] = useState<'SELECT_PLAN' | 'PAYMENT_METHOD' | 'PAYMENT_DETAILS'>('SELECT_PLAN');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'POS' | 'COMPLIMENTARY' | null>(null);
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentImage, setPaymentImage] = useState("");

    // Complimentary Duration State
    const [complimentaryDuration, setComplimentaryDuration] = useState<number>(30);
    const [customDurationValue, setCustomDurationValue] = useState("");

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

    const handleRenew = async () => {
        if (!selectedPlan && paymentMethod !== 'COMPLIMENTARY') return;

        setRenewing(true);
        try {
            const planId = paymentMethod === 'COMPLIMENTARY' ? 'complimentary' : selectedPlan!.id;
            const amount = paymentMethod === 'COMPLIMENTARY' ? 0 : selectedPlan!.price;
            const durationDays = paymentMethod === 'COMPLIMENTARY' ? complimentaryDuration : undefined;

            await subscriptionService.assignSubscription(client.id, planId, {
                method: paymentMethod!,
                amount: amount,
                reference: paymentReference,
                image: paymentImage,
                durationDays: durationDays,
                adminName: user?.name || "Admin"
            });

            await loadSubscriptionData();
            setShowRenewModal(false);
            setRenewalStep('SELECT_PLAN');
            setSelectedPlan(null);
            setPaymentMethod(null);
            setPaymentReference("");
            setPaymentImage("");
            onUpdate?.();
            addNotification("success", "Subscription assigned successfully!", 3000);
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
                    <span className={`px-3 py-1 rounded text-sm font-medium flex items-center justify-center gap-2 ${client.status === 'active' || (!client.status && activeSub)
                        ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                        : 'bg-red-900/30 text-red-400 border border-red-500/30'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${client.status === 'active' || (!client.status && activeSub) ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                        {client.status === 'active' || (!client.status && activeSub) ? 'ACTIVE' : 'INACTIVE'}
                    </span>

                    <div className="mt-3 space-y-3">
                        {activeSub ? (
                            <div className={`p-3 rounded-lg border ${subStatus.isActive
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
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <RefreshCw className={`${renewing ? 'animate-spin' : ''} text-blue-500`} size={24} />
                                {renewalStep === 'SELECT_PLAN' && "Select Plan"}
                                {renewalStep === 'PAYMENT_METHOD' && "Payment Method"}
                                {renewalStep === 'PAYMENT_DETAILS' && "Payment Details"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRenewModal(false);
                                    setRenewalStep('SELECT_PLAN');
                                }}
                                className="text-gray-500 hover:text-white transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {renewalStep === 'SELECT_PLAN' && (
                            <div className="space-y-4">
                                <p className="text-gray-400 mb-2">Choose a membership plan for {client.name}</p>
                                <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => {
                                                setSelectedPlan(plan);
                                                setRenewalStep('PAYMENT_METHOD');
                                            }}
                                            className="w-full flex justify-between items-center p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500 hover:scale-[1.02] transition-all group"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-white group-hover:text-blue-400">{plan.name}</div>
                                                <div className="text-xs text-gray-400">{plan.durationDays} Days</div>
                                            </div>
                                            <div className="text-blue-400 font-bold text-lg">${plan.price}</div>
                                        </button>
                                    ))}
                                    {user?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => {
                                                setPaymentMethod('COMPLIMENTARY');
                                                setRenewalStep('PAYMENT_DETAILS');
                                            }}
                                            className="w-full flex justify-between items-center p-4 rounded-xl border border-dashed border-yellow-600/50 bg-yellow-900/10 hover:bg-yellow-900/20 hover:border-yellow-500 transition-all group"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-yellow-500">Complimentary</div>
                                                <div className="text-xs text-yellow-600/70">Special access for extraordinary cases</div>
                                            </div>
                                            <div className="text-yellow-500 font-bold">FREE</div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {renewalStep === 'PAYMENT_METHOD' && (
                            <div className="space-y-4">
                                <p className="text-gray-400 mb-2">How will the client pay?</p>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => {
                                            setPaymentMethod('CASH');
                                            setRenewalStep('PAYMENT_DETAILS');
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:border-green-500 transition-all"
                                    >
                                        <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                                            <CreditCard size={20} />
                                        </div>
                                        <span className="font-bold text-white">Cash</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPaymentMethod('TRANSFER');
                                            setRenewalStep('PAYMENT_DETAILS');
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500 transition-all"
                                    >
                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                                            <RefreshCw size={20} />
                                        </div>
                                        <span className="font-bold text-white">Bank Transfer</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPaymentMethod('POS');
                                            setRenewalStep('PAYMENT_DETAILS');
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-800/50 hover:bg-gray-800 hover:border-purple-500 transition-all"
                                    >
                                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                                            <CreditCard size={20} />
                                        </div>
                                        <span className="font-bold text-white">POS / Credit Card</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setRenewalStep('SELECT_PLAN')}
                                    className="w-full mt-4 text-sm text-gray-500 hover:text-white transition"
                                >
                                    ← Back to Plans
                                </button>
                            </div>
                        )}

                        {renewalStep === 'PAYMENT_DETAILS' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-sm">Target Plan</span>
                                        <span className="text-white font-bold">{paymentMethod === 'COMPLIMENTARY' ? 'Complimentary' : selectedPlan?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Method</span>
                                        <span className="text-blue-400 font-bold">{paymentMethod}</span>
                                    </div>
                                </div>

                                {(paymentMethod === 'TRANSFER' || paymentMethod === 'POS') && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Reference Number</label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="Enter transaction ID or reference"
                                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>
                                )}

                                {paymentMethod === 'TRANSFER' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Proof of Payment</label>
                                        {paymentImage ? (
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-700 bg-black group">
                                                <img src={paymentImage} className="w-full h-full object-contain" />
                                                <button
                                                    onClick={() => setPaymentImage("")}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800 transition cursor-pointer group">
                                                <Camera className="w-8 h-8 text-gray-600 group-hover:text-blue-400 mb-2" />
                                                <span className="text-sm text-gray-500 group-hover:text-gray-300">Upload screenshot</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setPaymentImage(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                )}

                                {paymentMethod === 'CASH' && (
                                    <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-xl text-center">
                                        <p className="text-green-400 text-sm">Please ensure you have received <strong>${selectedPlan?.price}</strong> in cash before confirming.</p>
                                    </div>
                                )}

                                {paymentMethod === 'COMPLIMENTARY' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                                            <p className="text-yellow-500 text-sm mb-4">Extraordinary access. Choose the duration for this complimentary subscription.</p>

                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                {[
                                                    { label: '30 Days', val: 30 },
                                                    { label: '6 Months', val: 180 },
                                                    { label: '1 Year', val: 365 },
                                                    { label: '2 Years', val: 730 }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.val}
                                                        onClick={() => {
                                                            setComplimentaryDuration(opt.val);
                                                            setPaymentReference(`Direct Contract - ${opt.label} (${user?.name || 'Admin'})`);
                                                        }}
                                                        className={`p-2 rounded-lg border text-sm transition-all ${complimentaryDuration === opt.val
                                                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500">Or enter custom days</label>
                                                <input
                                                    type="number"
                                                    value={customDurationValue}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setCustomDurationValue(e.target.value);
                                                        if (!isNaN(val)) {
                                                            setComplimentaryDuration(val);
                                                            setPaymentReference(`Direct Contract - Custom ${val} days (${user?.name || 'Admin'})`);
                                                        }
                                                    }}
                                                    placeholder="Custom days..."
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setRenewalStep(paymentMethod === 'COMPLIMENTARY' ? 'SELECT_PLAN' : 'PAYMENT_METHOD')}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleRenew}
                                        disabled={renewing || ((paymentMethod === 'TRANSFER' || paymentMethod === 'POS') && !paymentReference)}
                                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {renewing ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
                                        Confirm & Activate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};