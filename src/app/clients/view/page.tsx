"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { clientService, Client } from "@/lib/services/clientService";
import { subscriptionService, Plan, Subscription } from "@/lib/services/subscriptionService";
import { sessionService, Session } from "@/lib/services/sessionService";
import { ArrowLeft, User, Calendar, Star, AlertTriangle, Clock, CheckCircle, Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ProfilePicture } from "@/components/ui/ProfilePicture";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";

import { useSearchParams } from "next/navigation";

export default function ClientDetailsPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [client, setClient] = useState<Client | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activeSub, setActiveSub] = useState<Subscription | null>(null);
    const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    // Check if current user can edit photos
    const canEditPhotos = user?.permissions?.edit_photos || user?.role === 'ADMIN';

    const getSubscriptionStatus = () => {
        if (!activeSub) {
            return {
                status: "No Active Subscription",
                color: "text-red-400",
                bgColor: "bg-red-900/20",
                borderColor: "border-red-500/50",
                icon: AlertTriangle,
                message: "Client cannot check in",
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
                status: "Expired",
                color: "text-red-400",
                bgColor: "bg-red-900/20",
                borderColor: "border-red-500/50",
                icon: AlertTriangle,
                message: `Expired ${Math.abs(daysLeft)} days ago`,
                daysRemaining: Math.abs(daysLeft),
                expiryDate: activeSub.endDate,
                isActive: false
            };
        } else {
            return {
                status: "Active",
                color: "text-green-400",
                bgColor: "bg-green-900/20",
                borderColor: "border-green-500/50",
                icon: CheckCircle,
                message: `${daysLeft} days remaining`,
                daysRemaining: daysLeft,
                expiryDate: activeSub.endDate,
                isActive: true
            };
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            const [c, p] = await Promise.all([
                clientService.getClient(id),
                subscriptionService.getPlans()
            ]);
            setClient(c || null);
            setPlans(p);

            if (c) {
                const [sub, allSubs, sess] = await Promise.all([
                    subscriptionService.getActiveSubscription(c.id),
                    subscriptionService.getAllClientSubscriptions(c.id),
                    sessionService.getClientSessions(c.id)
                ]);
                setActiveSub(sub);
                setAllSubscriptions(allSubs);
                setSessions(sess);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (planId: string) => {
        if (!client) return;
        if (!confirm("Assign this plan? Use this only if payment is collected.")) return;

        setAssigning(true);
        try {
            const plan = plans.find(p => p.id === planId);
            await subscriptionService.assignSubscription(client.id, planId, {
                method: 'CASH',
                amount: plan?.price || 0,
                adminName: user?.name || 'Admin'
            }, client.locationId, client.companyId);
            await loadData(); // Reload to see new sub
            addNotification("success", "Subscription assigned successfully!", 3000);
        } catch (e) {
            console.error(e);
            addNotification("error", "Error assigning plan", 5000);
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return <div className="p-6 text-white">Loading...</div>;
    if (!client) return <div className="p-6 text-white">Client not found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <Link href="/clients" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6">
                <ArrowLeft size={20} /> Back to Clients
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Profile & QR */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                        <div className="flex justify-center mb-4">
                            <ProfilePicture
                                currentPhoto={client.photoUrl}
                                onPhotoChange={async (photoUrl) => {
                                    if (canEditPhotos && photoUrl !== undefined) {
                                        try {
                                            // Update client with new photo
                                            await clientService.updateClient(client.id, { photoUrl: photoUrl || undefined });
                                            setClient({ ...client, photoUrl: photoUrl || undefined }); // Update local state
                                            addNotification("success", "Photo updated successfully", 3000);
                                        } catch (error) {
                                            console.error('Failed to update client photo:', error);
                                            addNotification("error", "Failed to update photo. Please try again.", 5000);
                                        }
                                    }
                                }}
                                editable={canEditPhotos}
                                size={120}
                            />
                        </div>
                        <h1 className="text-2xl font-bold mt-4">{client.name}</h1>
                        <p className="text-gray-400 font-mono text-sm">{client.id.substring(0, 8)}</p>

                        <div className="mt-6 text-left space-y-2 border-t border-gray-700 pt-4">
                            <div className="flex items-center gap-2 text-gray-300">
                                <User size={16} /> <span>{client.phone || "No Phone"}</span>
                            </div>
                            <div className="text-sm text-gray-500 italic">
                                {client.notes || "No notes provided."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Subscription Status & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Subscription Card */}
                    <div className={`p-6 rounded-xl border ${getSubscriptionStatus().bgColor} ${getSubscriptionStatus().borderColor}`}>
                        <div className="flex items-center gap-4 mb-4">
                            {(() => {
                                const StatusIcon = getSubscriptionStatus().icon;
                                return <StatusIcon className={getSubscriptionStatus().color} size={24} />;
                            })()}
                            <h2 className="text-xl font-bold text-white">Current Membership</h2>
                        </div>

                        {activeSub ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-2xl font-bold text-white">{activeSub.planName}</p>
                                    <p className={`text-lg font-medium ${getSubscriptionStatus().color}`}>
                                        Status: {getSubscriptionStatus().status}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Start Date:</span>
                                            <span>{new Date(activeSub.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Expiration Date:</span>
                                            <span>{new Date(activeSub.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Days Remaining:</span>
                                            <span className={`font-medium ${getSubscriptionStatus().color}`}>
                                                {getSubscriptionStatus().daysRemaining}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Can Check In:</span>
                                            <span className={getSubscriptionStatus().isActive ? "text-green-400" : "text-red-400"}>
                                                {getSubscriptionStatus().isActive ? "Yes" : "No"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className={`text-lg font-medium ${getSubscriptionStatus().color}`}>
                                    {getSubscriptionStatus().status}
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {getSubscriptionStatus().message}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Assign New Plan */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold mb-4">Sell / Assign Plan</h3>
                        <p className="text-sm text-gray-400 mb-4">Select a plan to assign. This checks the client in immediately if used today.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => handleAssign(plan.id)}
                                    disabled={assigning}
                                    className="flex justify-between items-center p-4 rounded-lg border border-gray-600 hover:bg-gray-700 hover:border-blue-500 transition text-left group"
                                >
                                    <div>
                                        <div className="font-bold">{plan.name}</div>
                                        <div className="text-xs text-gray-400">{plan.durationDays} Days</div>
                                    </div>
                                    <div className="text-blue-400 font-bold group-hover:text-white">
                                        ${plan.price}
                                    </div>
                                </button>
                            ))}

                            {plans.length === 0 && (
                                <div className="col-span-full text-gray-500 text-sm">
                                    No plans available. <Link href="/plans" className="text-blue-500">Create a plan</Link> first.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subscription History */}
                    {allSubscriptions.length > 1 && (
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-bold mb-4">Subscription History</h3>
                            <div className="space-y-3">
                                {allSubscriptions.map((sub, index) => {
                                    const isActive = sub.id === activeSub?.id;
                                    const now = new Date();
                                    const endDate = new Date(sub.endDate);
                                    const isExpired = endDate < now;

                                    return (
                                        <div
                                            key={sub.id}
                                            className={`p-3 rounded-lg border ${isActive
                                                ? 'bg-green-900/20 border-green-500/50'
                                                : isExpired
                                                    ? 'bg-gray-900 border-gray-700'
                                                    : 'bg-gray-900 border-gray-700'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold text-white flex items-center gap-2">
                                                        {sub.planName}
                                                        {isActive && (
                                                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Current</span>
                                                        )}
                                                        {isExpired && !isActive && (
                                                            <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">Expired</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-400 mt-1">
                                                        {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Workout History */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Workout History</h3>
                            <Link href={`/sessions/create?clientId=${client.id}`}> {/* Pass client ID to create session */}
                                <button className="text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-600 hover:text-white transition">
                                    + Log New
                                </button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {sessions.map(session => (
                                <div key={session.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg">{session.workoutName}</h4>
                                        <span className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {session.logs.reduce((acc, log) => acc + log.weight * log.reps, 0)} lbs total volume
                                    </p>
                                </div>
                            ))}
                            {sessions.length === 0 && <p className="text-gray-500 text-sm">No workout history.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
