"use client";

import { useState, useEffect } from "react";
import { Lock, User as UserIcon, LogOut, AlertCircle, ShieldAlert } from "lucide-react";
import { User } from "@/lib/services/authService";
import { useAuth } from "./AuthProvider";

interface LockScreenProps {
    user: User;
    onUnlock: (pin: string) => Promise<{ success: boolean; error?: string }>;
    onSignOut: () => void;
}

export default function LockScreen({ user, onUnlock, onSignOut }: LockScreenProps) {
    const { authError, clearAuthError } = useAuth();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            if (authError) clearAuthError();
        }
    };

    // Auto-submit on 4th digit
    useEffect(() => {
        if (pin.length === 4 && !loading) {
            const submit = async () => {
                setLoading(true);
                try {
                    const result = await onUnlock(pin);
                    if (!result.success) {
                        setPin("");
                    }
                } finally {
                    setLoading(false);
                }
            };
            submit();
        }
    }, [pin, onUnlock, loading]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden bg-black/40 backdrop-blur-md">
            <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 transform animate-in zoom-in-95 duration-300">

                <div className="mb-8 text-center text-white">
                    <div className="relative inline-block mb-4">
                        <div className="bg-yellow-500/20 p-5 rounded-full border border-yellow-500/30">
                            <Lock size={32} className="text-yellow-500" />
                        </div>
                        {authError && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-gray-900">
                                <ShieldAlert size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Session Locked</h2>
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse text-center" />
                        <span>Connected: {user.name}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* PIN Display */}
                    <div className="flex justify-center gap-5 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-300 border ${i < pin.length
                                        ? 'bg-yellow-500 border-yellow-400 scale-125 shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                                        : 'bg-white/5 border-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    {authError && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-200 text-xs animate-shake">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            <span className="font-bold">{authError}</span>
                        </div>
                    )}

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-3 text-white">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleDigit(num.toString())}
                                disabled={loading}
                                className={`h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-yellow-600/50 transition-all text-xl font-bold flex items-center justify-center border border-white/5 
                                    ${num === 0 ? 'col-start-2' : ''}`}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setPin(prev => prev.slice(0, -1));
                                clearAuthError();
                            }}
                            className="h-14 rounded-2xl bg-white/5 hover:bg-red-900/40 text-red-400 transition flex items-center justify-center border border-white/5 text-xs font-bold uppercase tracking-widest"
                        >
                            Del
                        </button>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-4">
                        <button
                            onClick={onSignOut}
                            className="text-gray-500 hover:text-red-400 text-xs font-bold uppercase tracking-tighter flex items-center gap-2 transition"
                        >
                            <LogOut size={14} />
                            Terminate Session
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
