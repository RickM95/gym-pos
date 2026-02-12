"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { User } from "@/lib/services/authService";
import { clientService, Client } from "@/lib/services/clientService";
import { subscriptionService, Subscription } from "@/lib/services/subscriptionService";
import { workoutService, WorkoutExercise } from "@/lib/services/workoutService";
import { sessionService, Session } from "@/lib/services/sessionService";
import { getDB } from "@/lib/db";
import { CheckCircle, Clock, CreditCard, Dumbbell, User as UserIcon, AlertCircle, Calendar, ChevronRight, PlayCircle } from "lucide-react";

interface ClientDashboardProps {
    user: User;
}

interface AssignedWorkoutDisplay {
    id: string; // Assignment ID
    workoutId: string;
    workoutName: string;
    exercises: WorkoutExercise[];
    assignedDate: string;
    notes?: string;
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
    const [client, setClient] = useState<Client | null>(null);
    const [sub, setSub] = useState<Subscription | null>(null);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [programs, setPrograms] = useState<AssignedWorkoutDisplay[]>([]);
    const [history, setHistory] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'program' | 'history'>('overview');

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user.linkedClientId) {
            setLoading(false);
            return;
        }

        try {
            // 1. Get Client Profile
            let clientData = await clientService.getClient(user.linkedClientId);

            // DEMO MODE
            if (!clientData && user.linkedClientId === 'demo-client-001') {
                const demoClient: Client = {
                    id: 'demo-client-001',
                    name: user.name,
                    email: 'demo@spartan.gym',
                    phone: '555-0100',
                    qrCode: 'CLIENT:demo-client-001',
                    updatedAt: new Date().toISOString(),
                    synced: 0,
                    status: 'active',
                    joinedDate: new Date().toISOString(),
                    locationId: 'main-gym'
                };
                const db = await getDB();
                await db.add('clients', demoClient);
                clientData = demoClient;
            }

            setClient(clientData || null);

            if (clientData) {
                // 2. Sub
                const activeSub = await subscriptionService.getActiveSubscription(clientData.id);
                setSub(activeSub);

                // 3. Checkins
                const db = await getDB();
                const allCheckins = await db.getAllFromIndex('checkins', 'by-client', clientData.id);
                setCheckins(allCheckins.reverse().slice(0, 5));

                // 4. Assigned Programs
                const assigned = await workoutService.getAssignedWorkouts(clientData.id);
                setPrograms(assigned);

                // 5. Workout History
                const previousSessions = await sessionService.getClientSessions(clientData.id);
                setHistory(previousSessions);
            }

        } catch (e) {
            console.error("Failed to load client profile", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading Member Portal...</div>;
    if (!client) return <div className="p-12 text-center text-red-500">Profile Not Found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Member Card */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-700/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="bg-white p-3 rounded-xl shadow-lg z-10">
                    <QRCodeSVG value={client.qrCode} size={120} />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h2 className="text-3xl font-bold text-white mb-1">{client.name}</h2>
                    <p className="text-blue-200 text-sm mb-4">Member ID: {client.id.substring(0, 8)}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-400/30">
                            {sub ? <span className="text-green-400 text-sm font-bold">{sub.planName}</span> : <span className="text-yellow-400 text-sm">No Plan</span>}
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-400/30">
                            <Dumbbell size={14} className="text-primary" />
                            <span className="text-blue-100 text-sm">{history.length} Workouts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition ${activeTab === 'overview' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('program')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition ${activeTab === 'program' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                    My Program <span className="ml-1 bg-blue-600 text-xs px-1.5 rounded-full">{programs.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-t-lg font-medium transition ${activeTab === 'history' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                    History
                </button>
            </div>

            {/* CONTENT */}
            <div className="min-h-[300px]">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
                                <Clock className="text-primary" size={20} /> Recent Check-ins
                            </h3>
                            <div className="space-y-3">
                                {checkins.length > 0 ? checkins.map((c, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-300">Gym Visit</span>
                                        <span className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleDateString()}</span>
                                    </div>
                                )) : <p className="text-gray-500 text-center py-4">No recent visits.</p>}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900/20 to-gray-800 rounded-xl p-5 border border-purple-500/20">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
                                <CreditCard className="text-purple-400" size={20} /> Plan Status
                            </h3>
                            {sub ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Current Plan</span>
                                        <span className="text-white font-bold">{sub.planName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Expires</span>
                                        <span className="text-white">{new Date(sub.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-2 rounded-full mt-4">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-1">45% of cycle completed</p>
                                </div>
                            ) : <p className="text-gray-500">No active subscription.</p>}
                        </div>
                    </div>
                )}

                {/* PROGRAM TAB */}
                {activeTab === 'program' && (
                    <div className="space-y-4">
                        {programs.length > 0 ? programs.map(p => (
                            <div key={p.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition">{p.workoutName}</h3>
                                         <p className="text-sm text-gray-400">Assigned: {new Date(p.assignedDate).toLocaleDateString()}</p>
                                    </div>
                                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition">
                                        <PlayCircle size={18} /> Start
                                    </button>
                                </div>

                                {p.notes && (
                                    <div className="bg-blue-900/20 text-blue-200 p-3 rounded-lg text-sm mb-4 border border-blue-500/20">
                                        NOTE: {p.notes}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {p.exercises.map((ex, i) => (
                                        <div key={i} className="bg-gray-900/50 p-3 rounded flex items-center justify-between">
                                             <span className="font-medium text-gray-300">Exercise {ex.exerciseId}</span>
                                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{ex.sets} x {ex.reps}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                                <Dumbbell size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">No Workouts Assigned</h3>
                                <p className="text-gray-500 mt-2">Your trainer hasn't assigned a program yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {history.length > 0 ? history.map(h => (
                            <div key={h.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{h.workoutName || 'Freestyle Session'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Calendar size={14} />
                                        {new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">{h.logs.length}</div>
                                        <div className="text-xs text-gray-500 uppercase font-bold">Exercises</div>
                                    </div>
                                    <button className="text-gray-400 hover:text-white p-2">
                                        <ChevronRight />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-gray-500">
                                Start your first workout to see your history here!
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
