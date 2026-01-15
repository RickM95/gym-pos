"use client";

import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { User, LogOut, Calendar, Activity, Settings, CreditCard } from "lucide-react";
import Link from "next/link";

export default function ClientDashboardPage() {
    const { clientUser, signOut } = useClientAuth();

    if (!clientUser) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Spartan Gym</h1>
                            <p className="text-gray-400">Client Portal</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-white font-medium">{clientUser.name}</p>
                                <p className="text-gray-400 text-sm">ID: {clientUser.id}</p>
                            </div>
                            
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                {clientUser.photoUrl ? (
                                    <img 
                                        src={clientUser.photoUrl} 
                                        alt={clientUser.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Section */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Welcome back, {clientUser.name}!
                    </h2>
                    <p className="text-gray-400">
                        Track your workouts, manage your membership, and stay connected with Spartan Gym.
                    </p>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link 
                        href="/client/workouts"
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:bg-gray-750 transition hover:border-blue-500"
                    >
                        <Activity className="text-blue-500 mb-4" size={32} />
                        <h3 className="text-white font-semibold mb-2">My Workouts</h3>
                        <p className="text-gray-400 text-sm">View and log your training sessions</p>
                    </Link>

                    <Link 
                        href="/client/schedule"
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:bg-gray-750 transition hover:border-green-500"
                    >
                        <Calendar className="text-green-500 mb-4" size={32} />
                        <h3 className="text-white font-semibold mb-2">Schedule</h3>
                        <p className="text-gray-400 text-sm">Book classes and appointments</p>
                    </Link>

                    <Link 
                        href="/client/membership"
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:bg-gray-750 transition hover:border-purple-500"
                    >
                        <CreditCard className="text-purple-500 mb-4" size={32} />
                        <h3 className="text-white font-semibold mb-2">Membership</h3>
                        <p className="text-gray-400 text-sm">Manage your subscription</p>
                    </Link>

                    <Link 
                        href="/client/settings"
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:bg-gray-750 transition hover:border-orange-500"
                    >
                        <Settings className="text-orange-500 mb-4" size={32} />
                        <h3 className="text-white font-semibold mb-2">Settings</h3>
                        <p className="text-gray-400 text-sm">Account and security settings</p>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-white text-sm">Last login: Today at {new Date().toLocaleTimeString()}</p>
                                <p className="text-gray-400 text-xs">Authentication method: {clientUser.auth.password ? 'Password' : 'PIN'}</p>
                            </div>
                        </div>
                        
                        <div className="text-center py-8">
                            <Activity className="mx-auto text-gray-600 mb-2" size={40} />
                            <p className="text-gray-400 text-sm">No recent workout activity</p>
                            <Link 
                                href="/client/workouts" 
                                className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                                Start your first workout
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sign Out Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={signOut}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </main>
        </div>
    );
}