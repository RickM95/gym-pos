"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Activity,
  CreditCard,
  ScanLine,
  Database,
  Plus,
  DollarSign,
  CheckCircle,
  LogOut,
  Shield,
  Bug,
  Book,
  UserCog,
  Lock,
  FileText,
  Package,
  BarChart3
} from "lucide-react";
import { ProfilePicture } from "@/components/ui/ProfilePicture";
import { reportService, DashboardStats } from "@/lib/services/reportService";
import { useAuth } from "@/components/auth/AuthProvider";
import { permissionService } from "@/lib/services/permissionService";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import Navigation from "@/components/navigation/Navigation";
import SyncIndicator from "@/components/sync/SyncIndicator";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import BugReportModal from "@/components/ui/BugReportModal";

function UserProfile() {
  const { user, logout, setIsLocked } = useAuth();

  if (!user) return null;

  const handleLock = () => {
    if (setIsLocked) {
      setIsLocked(true);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gray-800 p-2 pr-4 rounded-full border border-gray-700">
      <ProfilePicture
        currentPhoto={user.photoUrl}
        onPhotoChange={() => { }} // Read-only in header
        editable={false}
        size={32}
        className="flex-shrink-0"
      />
      <div className="text-sm">
        <div className="font-bold">{user.name}</div>
        <div className="text-xs text-gray-400">{user.role}</div>
      </div>
      <button
        onClick={handleLock}
        className="p-1 text-gray-400 hover:text-yellow-400"
        title="Lock Screen"
      >
        <Lock size={16} />
      </button>
      <button
        onClick={logout}
        className="p-1 text-red-400 hover:text-red-300"
        title="Sign Out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    todaysCheckins: 0
  });
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load Permissions
    let p: Record<string, boolean> = {};

    // Use individual permissions if available
    if (user.permissions) {
      p = user.permissions;
    } else {
      // Fallback to role-based permissions
      p = await permissionService.getPermissions(user.role);
    }

    setPerms(p);

    // Load Stats only if allowed
    if (p.view_financials || p.check_in || p.manage_clients) {
      // We load stats anyway but might hide specific numbers in UI
      const data = await reportService.getStats();
      setStats(data);
    }
  };

  if (!user) return null; // AuthProvider handles redirect

  // Conditionally render Client Dashboard
  if (user.role === 'CLIENT') {
    return (
      <GlobalNotificationProvider>
        <OfflineProvider>
          <div className="flex h-screen bg-gray-900">
            <Navigation />

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-0 overflow-auto">
              {/* Header for global status */}
              <div className="fixed top-0 right-0 p-4 z-30">
                <SyncIndicator />
              </div>

              <div className="pt-16 lg:pt-0">
                <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
                  <header className="mb-8 flex justify-between items-center max-w-4xl mx-auto w-full">
                    <div>
                      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Spartan Gym
                      </h1>
                      <p className="text-gray-400">Member Portal</p>
                    </div>
                    <UserProfile />
                  </header>
                  <ClientDashboard user={user} />
                </div>
              </div>
            </div>

            <OfflineIndicator />
          </div>
        </OfflineProvider>
      </GlobalNotificationProvider>
    );
  }

  return (
    <GlobalNotificationProvider>
      <OfflineProvider>
        <div className="flex h-screen bg-gray-900">
          <Navigation />

          <div className="flex-1 lg:ml-0 overflow-auto relative">
            {/* Header for global status indicators */}
            <div className="fixed top-0 right-0 p-4 z-30 flex gap-2">
              <SyncIndicator />
            </div>

            <div className="min-h-screen text-white p-6 pb-24 lg:pt-6 pt-16">
              <header className="mb-8 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Spartan Gym
                  </h1>
                  <div className="flex items-center gap-4">
                    <Link href="/help" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition mr-4">
                      <Book size={16} /> Help Center
                    </Link>
                    <p className="text-gray-400">Manager Dashboard</p>
                  </div>
                </div>
                <UserProfile />
              </header>

              <main className="max-w-6xl mx-auto space-y-8">
                {/* KPI Row */}
                {perms.view_financials && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Clients */}
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <Users size={16} /> Total Clients
                      </div>
                      <div className="text-2xl font-bold">{stats.totalClients}</div>
                    </div>

                    {/* Active Members */}
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <CheckCircle size={16} /> Active Members
                      </div>
                      <div className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</div>
                    </div>

                    {/* Today's Checkins */}
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <ScanLine size={16} /> Check-ins Today
                      </div>
                      <div className="text-2xl font-bold text-blue-400">{stats.todaysCheckins}</div>
                    </div>

                    {/* Est. Revenue */}
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                        <DollarSign size={16} /> Est. Revenue/Mo
                      </div>
                      <div className="text-2xl font-bold text-purple-400">${stats.monthlyRevenue}</div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {perms.check_in && (
                    <Link href="/scan" className="group">
                      <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 p-6 rounded-xl border border-blue-500/30 hover:border-blue-400 transition flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-blue-600 rounded-full text-white shadow-lg group-hover:scale-110 transition">
                            <ScanLine size={32} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-blue-200">Quick Check-In</h2>
                            <p className="text-blue-200/60 text-sm">Scan QR code for entry</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {perms.manage_clients && (
                    <Link href="/clients/add" className="group">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 p-6 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-gray-700 rounded-full text-white group-hover:bg-gray-600 transition">
                            <Plus size={32} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">New Client</h2>
                            <p className="text-gray-400 text-sm">Register a new member</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Management Grid */}
                <h3 className="text-xl font-bold pt-4">Management</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {perms.manage_clients && (
                    <Link href="/clients" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition text-center">
                      <Users className="mx-auto mb-2 text-gray-400" size={24} />
                      <span className="font-semibold block">Clients</span>
                    </Link>
                  )}

                  {/* Added Inventory Link */}
                  {(user.role === 'ADMIN' || perms.manage_inventory) && (
                    <Link href="/inventory" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-blue-500 transition text-center">
                      <Package className="mx-auto mb-2 text-blue-400" size={24} />
                      <span className="font-semibold block">Inventory</span>
                    </Link>
                  )}

                  {/* Added Analytics Link */}
                  {(user.role === 'ADMIN' || perms.view_financials) && (
                    <Link href="/analytics" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-blue-500 transition text-center">
                      <BarChart3 className="mx-auto mb-2 text-blue-400" size={24} />
                      <span className="font-semibold block">Analytics</span>
                    </Link>
                  )}

                  {perms.manage_plans && (
                    <Link href="/plans" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-purple-500 transition text-center">
                      <CreditCard className="mx-auto mb-2 text-purple-400" size={24} />
                      <span className="font-semibold block">Plans</span>
                    </Link>
                  )}

                  {perms.manage_workouts && (
                    <Link href="/workouts" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-orange-500 transition text-center">
                      <Activity className="mx-auto mb-2 text-orange-400" size={24} />
                      <span className="font-semibold block">Workouts</span>
                    </Link>
                  )}

                  {perms.sync_data && (
                    <Link href="/settings/sync" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-blue-500 transition text-center">
                      <Database className="mx-auto mb-2 text-blue-400" size={24} />
                      <span className="font-semibold block">Sync Data</span>
                    </Link>
                  )}

                  {/* Admin Only: Staff Management Link */}
                  {user.role === 'ADMIN' && (
                    <Link href="/staff" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-green-500 transition text-center">
                      <UserCog className="mx-auto mb-2 text-green-400" size={24} />
                      <span className="font-semibold block">Staff</span>
                    </Link>
                  )}

                  {/* Admin Only: Access Control Link */}
                  {user.role === 'ADMIN' && (
                    <Link href="/settings/access" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-red-500 transition text-center">
                      <Shield className="mx-auto mb-2 text-red-400" size={24} />
                      <span className="font-semibold block">Access Control</span>
                    </Link>
                  )}

                  {/* TECH Only: System Logs */}
                  {user.role === 'TECH' && (
                    <Link href="/problems" className="bg-black p-4 rounded-xl border border-green-700 hover:bg-gray-900 transition text-center">
                      <Bug className="mx-auto mb-2 text-green-500" size={24} />
                      <span className="font-semibold block text-green-500 font-mono">SYSTEM LOGS</span>
                    </Link>
                  )}

                  {/* Reports Section */}
                  {(user?.permissions?.view_financials || user.role === 'ADMIN') && (
                    <Link href="/reports" className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-blue-500 transition text-center">
                      <FileText className="mx-auto mb-2 text-blue-400" size={24} />
                      <span className="font-semibold block">Reports</span>
                    </Link>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>

        <OfflineIndicator />
        <BugReportModal />
      </OfflineProvider>
    </GlobalNotificationProvider>
  );
}