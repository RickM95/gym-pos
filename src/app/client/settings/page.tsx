"use client";

import { useState } from "react";
import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { Lock, Key, Fingerprint, Eye, EyeOff, Shield } from "lucide-react";

export default function ClientSettingsPage() {
    const { clientUser, updateCredentials, error, clearError } = useClientAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newPin, setNewPin] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (newPassword !== confirmPassword) {
            return;
        }

        if (newPassword.length < 6) {
            return;
        }

        setIsSubmitting(true);
        const success = await updateCredentials({ password: newPassword });
        setIsSubmitting(false);

        if (success) {
            setNewPassword("");
            setConfirmPassword("");
        }
    };

    const handlePinUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (!/^\d{4,6}$/.test(newPin)) {
            return;
        }

        setIsSubmitting(true);
        const success = await updateCredentials({ pin: newPin });
        setIsSubmitting(false);

        if (success) {
            setNewPin("");
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setNewPin(value);
    };

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
                            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                            <p className="text-gray-400">Manage your security and authentication</p>
                        </div>
                        
                        <a 
                            href="/client/dashboard"
                            className="text-gray-400 hover:text-white"
                        >
                            ← Back to Dashboard
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Account Overview */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Account Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-400 text-sm">Name</p>
                                <p className="text-white font-medium">{clientUser.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Client ID</p>
                                <p className="text-white font-medium">{clientUser.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Email</p>
                                <p className="text-white font-medium">{clientUser.email || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Phone</p>
                                <p className="text-white font-medium">{clientUser.phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Security Methods */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Security Methods</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Key className="text-blue-500" size={24} />
                                    <div>
                                        <p className="text-white font-medium">Password</p>
                                        <p className="text-gray-400 text-sm">Traditional password authentication</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                                    Enabled
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Lock className="text-green-500" size={24} />
                                    <div>
                                        <p className="text-white font-medium">PIN</p>
                                        <p className="text-gray-400 text-sm">4-6 digit security PIN</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                                    Enabled
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="text-purple-500" size={24} />
                                    <div>
                                        <p className="text-white font-medium">Biometric</p>
                                        <p className="text-gray-400 text-sm">Fingerprint or face ID</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-sm rounded-full">
                                    Not Available
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Password Update */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Update Password</h2>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white pr-12"
                                        placeholder="Enter new password"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {newPassword && newPassword.length < 6 && (
                                    <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white pr-12"
                                        placeholder="Confirm new password"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || 
                                    !newPassword || 
                                    !confirmPassword || 
                                    newPassword !== confirmPassword || 
                                    newPassword.length < 6
                                }
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition"
                            >
                                {isSubmitting ? 'Updating Password...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    {/* PIN Update */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Update Security PIN</h2>
                        <form onSubmit={handlePinUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">New PIN (4-6 digits)</label>
                                <div className="relative">
                                    <input
                                        type={showPin ? "text" : "password"}
                                        value={newPin}
                                        onChange={handlePinChange}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12 font-mono text-center text-lg tracking-widest"
                                        placeholder="••••"
                                        minLength={4}
                                        maxLength={6}
                                        pattern="\d*"
                                        inputMode="numeric"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {/* PIN Dots Display */}
                                <div className="flex justify-center gap-2 mt-3">
                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                                i < newPin.length ? 'bg-green-500 scale-125' : 'bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>
                                {newPin && !/^\d{4,6}$/.test(newPin) && (
                                    <p className="text-red-400 text-xs mt-1">PIN must be 4-6 digits</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || 
                                    !newPin || 
                                    !/^\d{4,6}$/.test(newPin)
                                }
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition"
                            >
                                {isSubmitting ? 'Updating PIN...' : 'Update PIN'}
                            </button>
                        </form>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Security Tips */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-start gap-3">
                            <Shield className="text-yellow-500 mt-1" size={20} />
                            <div>
                                <h3 className="text-white font-medium mb-2">Security Tips</h3>
                                <ul className="text-gray-400 text-sm space-y-1">
                                    <li>• Use a strong password with at least 6 characters</li>
                                    <li>• Choose a PIN that&apos;s easy to remember but hard to guess</li>
                                    <li>• Never share your credentials with anyone</li>
                                    <li>• Enable biometric authentication when available</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}