"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { staffService, StaffMember } from "@/lib/services/staffService";
import { PERMISSION_ITEMS, PermissionKey, permissionService } from "@/lib/services/permissionService";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { Plus, Edit, Trash2, Shield, Save, X } from "lucide-react";
import { ProfilePicture } from "@/components/ui/ProfilePicture";
import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";
import AppProviders from "@/components/layout/AppProviders";

const ROLES_TO_EDIT: any[] = ['TRAINER', 'STAFF', 'CLIENT'];

export default function StaffPage() {
    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [saving, setSaving] = useState(false);
    const [showStaffPhotoMode, setShowStaffPhotoMode] = useState(false);

    // Check if current user can edit photos
    const canEditPhotos = user?.permissions?.edit_photos || user?.role === 'ADMIN';

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        pin: "",
        role: "STAFF"
    });
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            const staffData = await staffService.getAllStaff();
            setStaff(staffData);
        } catch (error) {
            console.error("Failed to load staff", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", username: "", pin: "", role: "STAFF" });
        setPermissions({});
        setPhotoUrl(null);
        setEditingStaff(null);
    };

    const handleAddStaff = () => {
        resetForm();
        setPhotoUrl(null);
        // Set default permissions based on role
        const defaultPerms = permissionService.getDefaultPermissions(formData.role as any);
        setPermissions(defaultPerms);
        setShowAddModal(true);
    };

    const handleEditStaff = (staffMember: StaffMember) => {
        setFormData({
            name: staffMember.name,
            username: staffMember.username || "",
            pin: staffMember.pin,
            role: staffMember.role
        });
        setPermissions(staffMember.permissions);
        setPhotoUrl(staffMember.photoUrl || null);
        setEditingStaff(staffMember);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.username || !formData.pin || formData.pin.length !== 4) {
            addNotification("warning", "Please fill in all fields (Name, Username, PIN). PIN must be 4 digits.", 4000);
            return;
        }

        setSaving(true);
        try {
            const staffData = {
                ...formData,
                permissions: permissions as Record<PermissionKey, boolean>,
                photoUrl: photoUrl || undefined,
                locationId: 'main-gym',
                hireDate: new Date().toISOString(),
                email: '',
                phone: ''
            };

            if (editingStaff) {
                await staffService.updateStaff(editingStaff.id, staffData);
            } else {
                await staffService.createStaff(staffData);
            }

            setShowAddModal(false);
            resetForm();
            await loadStaff();
            addNotification("success", "Staff member saved successfully!", 3000);
        } catch (error) {
            console.error("Failed to save staff", error);
            addNotification("error", "Failed to save staff member.", 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await staffService.deleteStaff(id);
            await loadStaff();
            addNotification("success", "Staff member deleted successfully", 3000);
        } catch (error) {
            console.error("Failed to delete staff", error);
            addNotification("error", "Failed to delete staff member.", 5000);
        }
    };

    const togglePermission = (permission: string) => {
        setPermissions(prev => ({
            ...prev,
            [permission]: !prev[permission]
        }));
    };

    if (loading) return <div className="p-6 text-white">Loading staff...</div>;

    // Simple protection: only ADMIN can access this page
    if (user?.role !== 'ADMIN') {
        return (
            <AppProviders>
                <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
                    <Shield size={64} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-gray-400 mb-8">Only Administrators can modify access controls.</p>
                    <Link href="/" className="text-primary hover:underline">Return to Dashboard</Link>
                </div>
            </AppProviders>
        );
    }

    return (
        <AppProviders>
            <div className="min-h-screen bg-gray-900 text-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <Link href="/" className="text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                            <h1 className="text-3xl font-bold text-green-500">Staff Management</h1>
                        </div>
                        <button
                            onClick={handleAddStaff}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add Staff
                        </button>
                    </div>

                    <div className="space-y-4">
                        {staff.length === 0 ? (
                            <div className="text-center py-10 bg-gray-800/50 rounded-xl border border-gray-800">
                                <p className="text-gray-400">No staff members found.</p>
                                <p className="text-sm text-gray-500 mt-2">Add your first staff member to get started.</p>
                            </div>
                        ) : (
                            staff.map(member => (
                                <div key={member.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4 flex-1">
                                            <ProfilePicture
                                                currentPhoto={member.photoUrl}
                                                onPhotoChange={async (photoUrl) => {
                                                    if (canEditPhotos && photoUrl !== undefined) {
                                                        try {
                                                            await staffService.updateStaff(member.id, { photoUrl: photoUrl || undefined });
                                                            await loadStaff(); // Refresh the list
                                                            addNotification("success", "Photo updated successfully", 3000);
                                                        } catch (error) {
                                                            console.error('Failed to update staff photo:', error);
                                                            addNotification("error", "Failed to update photo. Please try again.", 5000);
                                                        }
                                                    }
                                                }}
                                                editable={canEditPhotos}
                                                size={64}
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-400">PIN:</span>
                                                        <span className="ml-2 font-mono">{member.pin}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Role:</span>
                                                        <span className="ml-2">{member.role}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Status:</span>
                                                        <span className={`ml-2 ${member.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                            {member.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Created:</span>
                                                        <span className="ml-2">{new Date(member.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Shield size={16} className="text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-300">Permissions:</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PERMISSION_ITEMS.filter(item => member.permissions[item.id]).map(item => (
                                                            <span key={item.id} className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                                                                {item.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditStaff(member)}
                                                className="p-2 bg-primary hover:bg-primary/90 rounded-lg text-white"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id, member.name)}
                                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">
                                        {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            resetForm();
                                        }}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {canEditPhotos && (
                                        <div className="flex justify-center mb-6">
                                            <ProfilePicture
                                                currentPhoto={photoUrl || undefined}
                                                onPhotoChange={setPhotoUrl}
                                                size={120}
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                                placeholder="Staff member name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Username *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                                placeholder="jdoe"
                                                disabled={!!editingStaff}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">4-Digit PIN *</label>
                                            <input
                                                type="text"
                                                maxLength={4}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 font-mono"
                                                value={formData.pin}
                                                onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                                placeholder="0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                                            <select
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500"
                                                value={formData.role}
                                                onChange={e => {
                                                    const newRole = e.target.value;
                                                    setFormData({ ...formData, role: newRole });
                                                    // Update default permissions when role changes
                                                    const defaultPerms = permissionService.getDefaultPermissions(newRole as any);
                                                    setPermissions(defaultPerms);
                                                }}
                                            >
                                                <option value="STAFF">Staff</option>
                                                <option value="FRONT_DESK">Front Desk</option>
                                                <option value="TRAINER">Trainer</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-3">Permissions</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {PERMISSION_ITEMS.map(item => (
                                                <label key={item.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={permissions[item.id] || false}
                                                        onChange={() => togglePermission(item.id)}
                                                        className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                                                    />
                                                    <span className="text-white">{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                        >
                                            {saving ? 'Saving...' : <><Save size={20} /> Save Staff Member</>}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddModal(false);
                                                resetForm();
                                            }}
                                            className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppProviders>
    );
}