"use client";

import { useState } from "react";
import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { UserPlus, Eye, EyeOff, Lock, Check } from "lucide-react";
import { clientService } from "@/lib/services/clientService";

export default function ClientSignUpPage() {
    const { signUp, isLoading, error, clearError } = useClientAuth();
    const [clientId, setClientId] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pin, setPin] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientExists, setClientExists] = useState<{ id: string; name: string; email?: string; phone?: string } | null>(null);
    const [step, setStep] = useState<'verify' | 'create'>('verify');

    const handleClientVerification = async () => {
        if (clientId.length < 3) return;
        
        try {
            const client = await clientService.getClient(clientId);
            setClientExists(client || null);
        } catch {
            setClientExists(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (password !== confirmPassword) {
            return;
        }

        if (password.length < 6) {
            return;
        }

        if (!/^\d{4,6}$/.test(pin)) {
            return;
        }

        setIsSubmitting(true);
        const success = await signUp(clientId, password, pin);
        
        if (success) {
            // Redirect will be handled by the auth provider
        }
        
        setIsSubmitting(false);
    };

    const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientId(e.target.value);
        setClientExists(null);
        if (e.target.value.length >= 3) {
            setTimeout(() => handleClientVerification(), 300);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="mb-8 text-center">
                <div className="bg-green-600 p-4 rounded-full inline-block mb-4 shadow-lg shadow-green-900/50">
                    <UserPlus size={32} />
                </div>
                <h1 className="text-3xl font-bold">Create Your Account</h1>
                <p className="text-gray-400">Spartan Gym Client Portal</p>
            </div>

            <div className="w-full max-w-md space-y-6">
                {/* Step 1: Verify Client ID */}
                {step === 'verify' && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Verify Your Client ID</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Client ID</label>
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={handleClientIdChange}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                                    placeholder="Enter your Client ID"
                                    autoComplete="off"
                                />
                            </div>

                            {clientExists && (
                                <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <Check className="text-green-400 mt-1" size={20} />
                                        <div>
                                            <p className="font-medium text-green-400">Client Verified</p>
                                            <p className="text-sm text-gray-300">{clientExists.name}</p>
                                            {clientExists.email && <p className="text-sm text-gray-400">{clientExists.email}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep('create')}
                                        className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition"
                                    >
                                        Continue to Create Account
                                    </button>
                                </div>
                            )}

                            {clientId && !clientExists && clientId.length >= 3 && (
                                <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg">
                                    <p className="text-red-400 text-sm">Client ID not found. Please check your ID or visit the front desk.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Create Account */}
                {step === 'create' && clientExists && (
                    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Create Account</h2>
                            <button
                                type="button"
                                onClick={() => setStep('verify')}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                Back
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Client Info Display */}
                            <div className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400">Creating account for:</p>
                                <p className="font-medium">{clientExists.name}</p>
                                <p className="text-sm text-gray-400">ID: {clientExists.id}</p>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12"
                                        placeholder="Create a strong password"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {password && password.length < 6 && (
                                    <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters</p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pr-12"
                                        placeholder="Confirm your password"
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
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                )}
                            </div>

                            {/* PIN Field */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Security PIN (4-6 digits)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={pin}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            setPin(value);
                                        }}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white pl-12"
                                        placeholder="Enter PIN"
                                        minLength={4}
                                        maxLength={6}
                                        pattern="\d{4,6}"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                                {pin && !/^\d{4,6}$/.test(pin) && (
                                    <p className="text-red-400 text-xs mt-1">PIN must be 4-6 digits</p>
                                )}
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || 
                                    !password || 
                                    !confirmPassword || 
                                    !pin || 
                                    password !== confirmPassword || 
                                    password.length < 6 || 
                                    !/^\d{4,6}$/.test(pin)
                                }
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Login Link */}
                <div className="text-center text-gray-400">
                    <p className="text-sm">
                        Already have an account?{' '}
                        <a href="/client/login" className="text-green-400 hover:text-green-300 font-medium">
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}