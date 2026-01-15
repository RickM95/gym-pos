"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Lock, Delete } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

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
                // Auto-submit on Enter
                performLogin(pin);
            }
        }
    };

    const performLogin = async (pinValue: string) => {
        setLoading(true);
        try {
            const success = await login(pinValue);
            if (!success) {
                setError(true);
                setPin("");
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(true);
            setPin("");
        } finally {
            setLoading(false);
        }
    };

    // Auto-Login if 4 digits entered via pasting or typing fast
    useEffect(() => {
        if (pin.length === 4 && !loading) {
            // Small delay for UI feedback
            const t = setTimeout(() => {
                performLogin(pin);
            }, 100);
            return () => clearTimeout(t);
        }
    }, [pin, loading]);

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        performLogin(pin);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="mb-8 text-center">
                <div className="bg-blue-600 p-4 rounded-full inline-block mb-4 shadow-lg shadow-blue-900/50">
                    <Lock size={32} />
                </div>
                <h1 className="text-3xl font-bold">Spartan Gym</h1>
                <p className="text-gray-400">Restricted Access</p>
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
                            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-blue-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-700'}`}
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-red-500 text-center text-sm font-bold animate-pulse mb-4">
                        Invalid PIN. Try again.
                    </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleDigit(num.toString())}
                            className="h-16 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-blue-600 transition text-2xl font-bold flex items-center justify-center border border-gray-700"
                        >
                            {num}
                        </button>
                    ))}

                    <div className="col-span-1"></div> {/* Spacer */}

                    <button
                        onClick={() => handleDigit("0")}
                        className="h-16 rounded-xl bg-gray-800 hover:bg-gray-700 active:bg-blue-600 transition text-2xl font-bold flex items-center justify-center border border-gray-700"
                    >
                        0
                    </button>

                    <button
                        onClick={handleDelete}
                        className="h-16 rounded-xl bg-gray-800 hover:bg-red-900/40 text-red-400 transition flex items-center justify-center border border-gray-700"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={pin.length !== 4 || loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-4 rounded-xl transition text-lg mt-4 flex items-center justify-center gap-2"
                >
                    {loading ? 'Authenticating...' : 'Unlock System'}
                </button>
            </div>

            <div className="mt-8 text-xs text-gray-600">
                <p>Default PINS:</p>
                <p>Admin: 0000 | Trainer: 1111 | Front Desk: 2222 | Tech: 9999</p>
                <p>Client Kiosk: 3333</p>
            </div>
        </div>
    );
}
