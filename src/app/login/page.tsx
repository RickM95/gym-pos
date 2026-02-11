"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBranding } from "@/components/auth/BrandingProvider";
import { Lock, Delete, AlertCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const { login, authError, clearAuthError } = useAuth();
    const { config } = useBranding();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            if (authError) clearAuthError();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length === 4) {
            e.preventDefault();
            performLogin(pin);
        } else if (e.key === 'Backspace') {
            handleDelete();
        }
    };

    const performLogin = async (pinValue: string) => {
        setLoading(true);
        try {
            const result = await login(pinValue);
            if (!result.success) {
                setPin("");
            }
        } catch (error) {
            console.error('Login error:', error);
            setPin("");
        } finally {
            setLoading(false);
        }
    };

    // Auto-Login on 4 digits
    useEffect(() => {
        if (pin.length === 4 && !loading) {
            const t = setTimeout(() => {
                performLogin(pin);
            }, 150);
            return () => clearTimeout(t);
        }
    }, [pin, loading]);

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        if (authError) clearAuthError();
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0 text-white flex items-center justify-center">
                <Image
                    src="/login-bg.png"
                    alt="Gym Background"
                    fill
                    className="object-cover opacity-60 scale-105 animate-slow-zoom"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Login Card (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-md p-8 m-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-[1.01]">

                    {/* Header/Logo */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 rounded-full mb-4 border border-blue-500/30 shadow-inner">
                            {config.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                                <ShieldCheck size={40} className="text-blue-500" />
                            )}
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                            {config.gymName || 'Spartan Gym'}
                        </h1>
                        <p className="text-blue-400 font-medium tracking-widest uppercase text-xs mt-1 text-center">
                            Enterprise Access Control
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* PIN Display */}
                        <div className="flex justify-center gap-6 mb-8 group">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`w-5 h-5 rounded-full transition-all duration-300 border-2 ${i < pin.length
                                            ? 'bg-blue-500 border-blue-400 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                                            : 'bg-white/10 border-white/20 group-hover:border-white/40'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {authError && (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-100 text-sm animate-shake">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span className="font-bold">{authError}</span>
                            </div>
                        )}

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-3 text-white">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, idx) => (
                                <button
                                    key={num}
                                    onClick={() => handleDigit(num.toString())}
                                    disabled={loading}
                                    className={`h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-600/50 transition-all duration-200 text-2xl font-bold flex items-center justify-center border border-white/5 
                                        ${num === 0 ? 'col-start-2' : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleDelete}
                                disabled={loading || pin.length === 0}
                                className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-600/50 text-red-500 transition-all duration-200 flex items-center justify-center border border-red-500/10 col-start-3 row-start-4"
                            >
                                <Delete size={24} />
                            </button>
                        </div>

                        {/* Status / Submit Button */}
                        <div className="text-center pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center gap-3 text-blue-400 font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                    <span>Decrypting Session...</span>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest text-center">
                                    Secure Terminal Alpha-V1
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center text-white/20 text-[10px] space-y-1">
                    <p>© 2026 SPARTAN OS BY GOOGLE DEEPMIND AGENTIC</p>
                    <p>ENCRYPTION: AES-256 + SHA-256 HASHING</p>
                </div>
            </div>

            {/* Global Styles for Animations */}
            <style jsx global>{`
                @keyframes slow-zoom {
                    from { transform: scale(1); }
                    to { transform: scale(1.1); }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 20s infinite alternate ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
