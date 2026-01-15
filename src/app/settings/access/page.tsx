"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Shield, Camera, Users } from "lucide-react";
import { permissionService, PERMISSION_ITEMS } from "@/lib/services/permissionService";
import { UserRole } from "@/lib/services/authService";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { staffService } from "@/lib/services/staffService";

const ROLES_TO_EDIT: UserRole[] = ['TRAINER', 'STAFF', 'CLIENT'];

export default function AccessControlPage() {
    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [permissions, setPermissions] = useState<Record<UserRole, Record<string, boolean>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showStaffPhotoMode, setShowStaffPhotoMode] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        const newPerms: any = {};
        for (const role of ROLES_TO_EDIT) {
            newPerms[role] = await permissionService.getPermissions(role);
        }
        setPermissions(newPerms);
        setLoading(false);
    };

    const handleToggle = (role: UserRole, key: string) => {
        if (!permissions) return;
        setPermissions({
            ...permissions,
            [role]: {
                ...permissions[role],
                [key]: !permissions[role][key]
            }
        });
    };

const handleSave = async () => {
        if (!permissions) return;
        setSaving(true);
        try {
            for (const role of ROLES_TO_EDIT) {
                await permissionService.updatePermissions(role, permissions[role]);
            }
            addNotification("success", "Permissions updated successfully!", 3000);
        } catch (e) {
            console.error(e);
            addNotification("error", "Error saving permissions.", 5000);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !permissions) return <div className="p-6 text-white">Loading...</div>;

    // Simple protection: only ADMIN can access this page
    if (user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
                <Shield size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-gray-400 mb-8">Only Administrators can modify access controls.</p>
                <Link href="/" className="text-blue-400 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                        <ArrowLeft size={20} /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-purple-500">Access Control</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
                    >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 uppercase text-sm">
                                <tr>
                                    <th className="p-4">Feature / Permission</th>
                                    {ROLES_TO_EDIT.map(role => (
                                        <th key={role} className="p-4 text-center">{role}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {PERMISSION_ITEMS.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-700/30 transition">
                                        <td className="p-4 font-medium text-gray-200">
                                            <div className="flex items-center gap-2">
                                                {item.id === 'edit_photos' && <Camera size={16} className="text-blue-400" />}
                                                {item.label}
                                            </div>
                                        </td>
                                        {ROLES_TO_EDIT.map(role => (
                                            <td key={role} className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[role][item.id] || false}
                                                    onChange={() => handleToggle(role, item.id)}
                                                    className="w-5 h-5 rounded border-gray-600 text-blue-600 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-900"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Staff Photo Management Section for Admins */}
                {user?.permissions?.edit_photos && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Users className="text-blue-400" size={24} />
                                <h2 className="text-xl font-bold text-white">Staff Photo Management</h2>
                            </div>
                            <button
                                onClick={() => setShowStaffPhotoMode(!showStaffPhotoMode)}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    showStaffPhotoMode 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                            >
                                {showStaffPhotoMode ? 'Hide' : 'Show'} Photo Editor
                            </button>
                        </div>
                        
                        {showStaffPhotoMode && (
                            <div className="text-sm text-gray-400 mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                <p className="mb-2">📸 <strong>Admin Photo Editing Access:</strong></p>
                                <p>As an admin, you have permission to edit photos for:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>All staff members (via Staff page)</li>
                                    <li>All clients (via Client pages)</li>
                                    <li>Camera upload and file upload options</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
