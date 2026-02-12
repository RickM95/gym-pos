"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { User, Delete } from "lucide-react";

export default function ClientKioskPage() {
    const { login } = useAuth();
    const [clientId, setClientId] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'client' | 'pin'>('client');

    const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setClientId(value);
        setError(false);
    };

    const handleDigit = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleClientIdSubmit = () => {
        if (clientId.length >= 3) {
            setStep('pin');
        }
    };

    const performLogin = async (pinValue: string) => {
        setLoading(true);
        try {
            // Use special client authentication method
            const result = await login(clientId, pinValue); // This will be combined clientId:pin
            if (!result.success) {
                setError(true);
                setPin("");
            }
        } catch (error) {
            console.error('Client login error:', error);
            setError(true);
            setPin("");
        } finally {
            setLoading(false);
        }
    };

    // Auto-Login when PIN is complete
    const pinComplete = pin.length >= 4 && !loading;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="mb-8 text-center">
                <div className="bg-green-600 p-4 rounded-full inline-block mb-4 shadow-lg shadow-green-900/50">
                    <User size={32} />
                </div>
                <h1 className="text-3xl font-bold">Client Check-In</h1>
                <p className="text-gray-400">Spartan Gym Member Portal</p>
            </div>

            <div className="w-full max-w-md space-y-6">
                {step === 'client' && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-semibold mb-4">Enter Client ID</h2>
                        
                        <input
                            type="text"
                            value={clientId}
                            onChange={handleClientIdChange}
                            onKeyPress={(e) => e.key === 'Enter' && handleClientIdSubmit()}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white text-center text-lg font-mono uppercase"
                            placeholder="Enter your Client ID"
                            autoFocus
                            autoComplete="off"
                        />

                        <button
                            onClick={handleClientIdSubmit}
                            disabled={clientId.length < 3}
                            className="w-full mt-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {step === 'pin' && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Enter PIN</h2>
                            <button
                                onClick={() => {
                                    setStep('client');
                                    setClientId("");
                                    setPin("");
                                    setError(false);
                                }}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                ← Back
                            </button>
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-400">Client ID: <span className="text-white font-mono">{clientId}</span></p>
                        </div>

                        {/* PIN Display */}
                        <div className="flex justify-center gap-3 mb-6 bg-gray-700 p-4 rounded-xl border border-gray-600">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-green-500 scale-125 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="text-red-500 text-center text-sm font-bold animate-pulse mb-4">
                                Invalid PIN. Please try again.
                            </div>
                        )}

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleDigit(num.toString())}
                                    className="h-14 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-green-600 transition text-xl font-bold flex items-center justify-center border border-gray-600"
                                >
                                    {num}
                                </button>
                            ))}

                            <div className="col-span-1"></div> {/* Spacer */}

                            <button
                                onClick={() => handleDigit("0")}
                                className="h-14 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-green-600 transition text-xl font-bold flex items-center justify-center border border-gray-600"
                            >
                                0
                            </button>

                            <button
                                onClick={handleDelete}
                                className="h-14 rounded-lg bg-gray-700 hover:bg-red-900/40 text-red-400 transition flex items-center justify-center border border-gray-600"
                            >
                                <Delete size={20} />
                            </button>
                        </div>

                        <button
                            onClick={() => performLogin(pin)}
                            disabled={pin.length < 4 || loading || (pin.length >= 4 && pinComplete)}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-600 text-white font-bold py-3 rounded-xl transition text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : 'Check In'}
                        </button>
                    </div>
                )}

                <div className="text-center">
                    <a 
                        href="/login" 
                        className="text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1"
                    >
                        ← Staff Login
                    </a>
                </div>
            </div>
        </div>
    );
}