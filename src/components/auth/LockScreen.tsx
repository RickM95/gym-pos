"use client";

import { useState, useEffect } from "react";
import { Lock, User as UserIcon, LogOut } from "lucide-react";
import { User } from "@/lib/services/authService";

interface LockScreenProps {
    user: User;
    onUnlock: (pin: string) => Promise<boolean> | boolean;
    onSignOut: () => void;
}

export default function LockScreen({ user, onUnlock, onSignOut }: LockScreenProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (pin.length > 0) {
                const success = onUnlock(pin);
                if (!success) {
                    setError(true);
                    setPin("");
                }
            }
        }
    };

    // Auto-submit on 4th digit
    useEffect(() => {
        if (pin.length === 4) {
            const t = setTimeout(() => {
                const success = onUnlock(pin);
                if (!success) {
                    setError(true);
                    setPin("");
                }
            }, 100);
            return () => clearTimeout(t);
        }
    }, [pin, onUnlock]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6">
            <div className="mb-8 text-center animate-fade-in">
                <div className="bg-yellow-600/20 p-6 rounded-full inline-block mb-4 border border-yellow-600/50">
                    <Lock size={48} className="text-yellow-500" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Session Locked</h2>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <UserIcon size={16} />
                    <span>{user.name}</span>
                </div>
            </div>

            <div className="w-full max-w-xs space-y-8">
                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700 relative">
                    {/* Invisible Input for Keyboard Support */}
                    <input
                        autoFocus
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={pin}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val) && val.length <= 4) setPin(val);
                            setError(false);
                        }}
                        onKeyDown={handleKeyDown}
                        inputMode="numeric"
                        autoComplete="off"
                    />
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-yellow-500 scale-125 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-700'}`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-red-500 text-center text-sm font-bold animate-pulse mb-4">
                        Incorrect PIN
                    </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleDigit(num.toString())}
                            className="h-16 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-yellow-600/50 transition text-2xl font-bold flex items-center justify-center border border-gray-700"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="col-span-1"></div>
                    <button
                        onClick={() => handleDigit("0")}
                        className="h-16 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-yellow-600/50 transition text-2xl font-bold flex items-center justify-center border border-gray-700"
                    >
                        0
                    </button>
                    <button
                        onClick={() => setPin(prev => prev.slice(0, -1))}
                        className="h-16 rounded-xl bg-gray-800 hover:bg-red-900/40 text-red-400 transition flex items-center justify-center border border-gray-700"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <button
                onClick={onSignOut}
                className="mt-8 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg flex items-center gap-2 transition"
            >
                <LogOut size={16} />
                Sign Out
            </button>
            <p className="mt-4 text-gray-500 text-sm">Enter your PIN to resume</p>
        </div>
    );
}
