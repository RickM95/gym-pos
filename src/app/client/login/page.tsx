"use client";

import { useState } from "react";
import { useClientAuth } from "@/components/auth/ClientAuthProvider";
import { Lock, Fingerprint, User, Eye, EyeOff, Key, ChevronLeft } from "lucide-react";

export default function ClientLoginPage() {
    const { signIn, signInWithBiometric, isLoading, error, clearError } = useClientAuth();
    const [clientId, setClientId] = useState("");
    const [authMethod, setAuthMethod] = useState<'password' | 'pin' | 'biometric'>('password');
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (authMethod === 'biometric') {
            setIsSubmitting(true);
            await signInWithBiometric(clientId);
            setIsSubmitting(false);
        } else {
            if (!clientId || (!password && authMethod === 'password') || (!pin && authMethod === 'pin')) {
                return;
            }

            setIsSubmitting(true);
            
            if (authMethod === 'password') {
                await signIn(clientId, { password, authMethod });
            } else if (authMethod === 'pin') {
                await signIn(clientId, { pin, authMethod });
            }
            
            setIsSubmitting(false);
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPin(value);
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
                <div className="bg-blue-600 p-4 rounded-full inline-block mb-4 shadow-lg shadow-blue-900/50">
                    <Lock size={32} />
                </div>
                <h1 className="text-3xl font-bold">Client Login</h1>
                <p className="text-gray-400">Spartan Gym Member Portal</p>
            </div>

            <div className="w-full max-w-md space-y-6">
                {/* Auth Method Selection */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Choose Authentication Method</h2>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setAuthMethod('password')}
                            className={`p-3 rounded-lg border transition flex flex-col items-center gap-2 ${
                                authMethod === 'password'
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <Key size={20} />
                            <span className="text-xs">Password</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setAuthMethod('pin')}
                            className={`p-3 rounded-lg border transition flex flex-col items-center gap-2 ${
                                authMethod === 'pin'
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <Lock size={20} />
                            <span className="text-xs">PIN</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setAuthMethod('biometric')}
                            className={`p-3 rounded-lg border transition flex flex-col items-center gap-2 ${
                                authMethod === 'biometric'
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <Fingerprint size={20} />
                            <span className="text-xs">Biometric</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Client ID Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Client ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white pl-12"
                                    placeholder="Enter your Client ID"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        {authMethod === 'password' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white pr-12"
                                        placeholder="Enter your password"
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
                            </div>
                        )}

                        {/* PIN Field */}
                        {authMethod === 'pin' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Security PIN</label>
                                <div className="relative">
                                    <input
                                        type={showPin ? "text" : "password"}
                                        value={pin}
                                        onChange={handlePinChange}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white pr-12 font-mono text-center text-lg tracking-widest"
                                        placeholder="••••"
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
                                                i < pin.length ? 'bg-blue-500 scale-125' : 'bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Biometric Info */}
                        {authMethod === 'biometric' && (
                            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                                <Fingerprint className="mx-auto mb-2 text-blue-400" size={40} />
                                <p className="text-sm text-gray-300">
                                    Click the button below to authenticate using your fingerprint or face ID
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Make sure your device supports biometric authentication
                                </p>
                            </div>
                        )}

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
                                !clientId || 
                                (authMethod === 'password' && !password) || 
                                (authMethod === 'pin' && !pin)
                            }
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>Authenticating...</>
                            ) : authMethod === 'biometric' ? (
                                <>
                                    <Fingerprint size={20} />
                                    Use Biometric
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-gray-400">
                    <p className="text-sm">
                        Don&apos;t have an account?{' '}
                        <a href="/client/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                            Sign Up
                        </a>
                    </p>
                </div>

                {/* Back to Staff Login */}
                <div className="text-center">
                    <a 
                        href="/login" 
                        className="text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1"
                    >
                        <ChevronLeft size={16} />
                        Back to Staff Login
                    </a>
                </div>
            </div>
        </div>
    );
}