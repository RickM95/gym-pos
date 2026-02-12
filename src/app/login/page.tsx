"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBranding } from "@/components/auth/BrandingProvider";
import { Lock, Delete, AlertCircle, ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const { login, loginWithPassword, authError, clearAuthError } = useAuth();
    const { config } = useBranding();
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [password, setPassword] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'ID' | 'PIN' | 'PASSWORD'>('ID');

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            if (authError) clearAuthError();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (step === 'ID' && username) setStep('PIN');
            else if (step === 'PIN' && pin.length === 4) performLogin(username, pin);
        } else if (e.key === 'Backspace' && step === 'PIN') {
            handleDelete();
        }
    };

    const performLogin = async (userValue: string, pinValue: string) => {
        setLoading(true);
        try {
            const result = await login(userValue, pinValue);
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

    const performPasswordLogin = async () => {
        if (!password) return;
        setLoading(true);
        try {
            const result = await loginWithPassword(username, password);
            if (!result.success) {
                setPassword("");
            }
        } catch (error) {
            console.error('Password Login error:', error);
            setPassword("");
        } finally {
            setLoading(false);
        }
    };

    // Auto-Login on 4 digits
    useEffect(() => {
        if (pin.length === 4 && !loading) {
            const t = setTimeout(() => {
                performLogin(username, pin);
            }, 150);
            return () => clearTimeout(t);
        }
    }, [pin, loading, username]);

    // Keyboard PIN Support
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (step !== 'PIN' || loading) return;

            if (e.key >= '0' && e.key <= '9') {
                handleDigit(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Enter' && pin.length === 4) {
                performLogin(username, pin);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [step, loading, pin, username]);

    const handleDelete = () => {
        if (pin.length > 0) {
            setPin(prev => prev.slice(0, -1));
        } else {
            setStep('ID');
        }
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
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4 border-primary/30 shadow-inner">
                            {config.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                                <ShieldCheck size={40} className="text-primary" />
                            )}
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                            {config.gymName || 'Spartan Gym'}
                        </h1>
                        <p className="text-primary font-medium tracking-widest uppercase text-xs mt-1 text-center">
                            Enterprise Access Control
                        </p>
                    </div>

                    <div className="space-y-8">
                        {step === 'ID' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <label className="text-primary text-xs font-black uppercase tracking-[0.2em] ml-1">Identity Terminal</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                            <Lock size={20} className="text-white/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="USERNAME OR EMPLOYEE ID"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold tracking-widest uppercase text-sm placeholder:text-white/20"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('PIN')}
                                    disabled={!username}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95"
                                >
                                    Initialize Security Check
                                </button>
                            </div>
                        ) : step === 'PIN' ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                {/* User Badge */}
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 mb-8">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-primary font-bold border border-blue-500/20">
                                        {username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mb-1">Authenticated Identity</p>
                                        <p className="text-white font-bold leading-none">{username}</p>
                                    </div>
                                    <button
                                        onClick={() => { setStep('ID'); setPin(""); setPassword(""); }}
                                        className="text-[10px] text-gray-500 hover:text-white uppercase font-black"
                                    >Change</button>
                                </div>

                                {/* PIN Display */}
                                <div className="flex justify-center items-center gap-6 mb-8 group relative">
                                    <div className="flex gap-6">
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300 border-2 ${i < pin.length
                                                    ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]'
                                                    : 'bg-white/5 border-white/10 group-hover:border-white/20'
                                                    }`}
                                            >
                                                {i < pin.length && (
                                                    showPin ? pin[i] : (
                                                        <div className="w-3 h-3 bg-white rounded-full" />
                                                    )
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute -right-12 text-white/20 hover:text-white transition-colors p-2"
                                    >
                                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Numeric Keypad */}
                                <div className="grid grid-cols-3 gap-3 text-white mb-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, idx) => (
                                        <button
                                            key={num}
                                            onClick={() => handleDigit(num.toString())}
                                            disabled={loading}
                                            className={`h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-primary/50 transition-all duration-200 text-2xl font-bold flex items-center justify-center border border-white/5 
                                                ${num === 0 ? 'col-start-2' : ''}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-600/50 text-red-500 transition-all duration-200 flex items-center justify-center border border-red-500/10 col-start-3 row-start-4"
                                    >
                                        <Delete size={24} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setStep('PASSWORD')}
                                    className="w-full text-xs text-center text-white/30 hover:text-white uppercase tracking-widest font-bold py-2 transition-colors flex items-center justify-center gap-2"
                                >
                                    <KeyRound size={14} />
                                    Use Password Instead
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                {/* User Badge */}
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 mb-6">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center text-primary font-bold border border-blue-500/20">
                                        {username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mb-1">Authenticated Identity</p>
                                        <p className="text-white font-bold leading-none">{username}</p>
                                    </div>
                                    <button
                                        onClick={() => { setStep('ID'); setPin(""); setPassword(""); }}
                                        className="text-[10px] text-gray-500 hover:text-white uppercase font-black"
                                    >Change</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-primary text-xs font-black uppercase tracking-[0.2em] ml-1 mb-2 block">Admin Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPin ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && performPasswordLogin()}
                                                placeholder="ENTER PASSWORD"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-5 pr-12 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold tracking-widest text-sm placeholder:text-white/20"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => setShowPin(!showPin)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                                            >
                                                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={performPasswordLogin}
                                        disabled={!password || loading}
                                        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95"
                                    >
                                        Authenticate
                                    </button>
                                </div>

                                <button
                                    onClick={() => setStep('PIN')}
                                    className="w-full mt-6 text-xs text-center text-white/30 hover:text-white uppercase tracking-widest font-bold py-2 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck size={14} />
                                    Use PIN Instead
                                </button>
                            </div>
                        )}

                        {/* Error Message */}
                        {authError && (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-100 text-sm animate-shake">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span className="font-bold">{authError}</span>
                            </div>
                        )}

                        {/* Status / Submit Button */}
                        <div className="text-center pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center gap-3 text-primary font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                    <span>Decrypting Session...</span>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest text-center">
                                    Secure Terminal Alpha-V2
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center space-y-4">
                    <a
                        href="/setup"
                        className="inline-flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-white/80 transition-colors uppercase tracking-widest border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-lg"
                    >
                        <ShieldCheck size={12} />
                        Platform Initialization
                    </a>
                    <div className="text-white/20 text-[10px] space-y-1">
                        <p>© 2026 SPARTAN OS BY GOOGLE DEEPMIND AGENTIC</p>
                        <p>ENCRYPTION: AES-256 + SHA-256 HASHING</p>
                    </div>
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
        </div >
    );
}
