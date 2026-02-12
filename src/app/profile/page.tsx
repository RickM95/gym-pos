'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { profileService } from '@/lib/services/profileService';
import { User, Camera, Lock, Activity, Mail, Phone } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'activity'>('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile data
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: '',
        phone: '',
        photoUrl: user?.photoUrl || ''
    });

    // Password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    const handleProfileUpdate = async () => {
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const userType = user.role === 'PLATFORM_ADMIN' ? 'platform_admin' : 'staff';
            await profileService.updateProfile(user.id, userType, {
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!user) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 4) {
            setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const userType = user.role === 'PLATFORM_ADMIN' ? 'platform_admin' : 'staff';
            const success = await profileService.changePassword(
                user.id,
                userType,
                passwordData.currentPassword,
                passwordData.newPassword
            );

            if (success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordModal(false);
            } else {
                setMessage({ type: 'error', text: 'Current password is incorrect' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            setLoading(true);

            try {
                const userType = user.role === 'PLATFORM_ADMIN' ? 'platform_admin' : 'staff';
                const photoUrl = await profileService.updateProfilePhoto(user.id, userType, dataUrl);
                setProfileData(prev => ({ ...prev, photoUrl }));
                setMessage({ type: 'success', text: 'Profile photo updated!' });
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to upload photo' });
            } finally {
                setLoading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    if (!user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <BackButton fallbackPath="/" className="mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            {[
                                { id: 'general', label: 'General', icon: User },
                                { id: 'security', label: 'Security', icon: Lock },
                                { id: 'activity', label: 'Activity', icon: Activity }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                {/* Profile Photo */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {profileData.photoUrl ? (
                                                <img src={profileData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-gray-400" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                                            <Camera className="w-4 h-4" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-600">@{user.username}</p>
                                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>

                                {/* Profile Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={user.username}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleProfileUpdate}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">Password</p>
                                                <p className="text-sm text-gray-600">Change your account password</p>
                                            </div>
                                            <button
                                                onClick={() => setShowPasswordModal(true)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Change Password
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Change Modal */}
                                    {showPasswordModal && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                                <h3 className="text-lg font-semibold mb-4">Change Password</h3>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Current Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            New Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Confirm New Password
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    <button
                                                        onClick={handlePasswordChange}
                                                        disabled={loading}
                                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {loading ? 'Changing...' : 'Change Password'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowPasswordModal(false);
                                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                        }}
                                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                <div className="text-gray-600 text-center py-8">
                                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p>Activity logging coming soon!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
