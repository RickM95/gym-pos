'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { platformAdminService } from '@/lib/services/platformAdminService';
import { Building2, User, Mail, Lock, Check, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        pin: '',
        confirmPin: '',
        email: '',
        name: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    useEffect(() => {
        // Check if platform admin already exists
        platformAdminService.isPlatformAdminSetup().then(isSetup => {
            if (isSetup) {
                // Platform admin exists, redirect to login
                router.push('/login');
            } else {
                setLoading(false);
            }
        });
    }, [router]);

    const handleNext = () => {
        setError('');

        if (step === 1) {
            if (!formData.name || !formData.email) {
                setError('Please fill in all fields');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setError('Please enter a valid email');
                return;
            }
        }

        if (step === 2) {
            if (!formData.username || !formData.password || !formData.confirmPassword) {
                setError('Please fill in all fields');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
        }

        if (step === 3) {
            if (!formData.pin || !formData.confirmPin) {
                setError('Please set a 4-digit PIN');
                return;
            }
            if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
                setError('PIN must be exactly 4 digits');
                return;
            }
            if (formData.pin !== formData.confirmPin) {
                setError('PINs do not match');
                return;
            }
        }

        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            await platformAdminService.createPlatformAdmin({
                username: formData.username,
                password: formData.password,
                pin: formData.pin,
                email: formData.email,
                name: formData.name
            });

            // Redirect to login
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to create platform admin');
            setLoading(false);
        }
    };

    if (loading && step !== 5) { // Update step check
        return <LoadingSpinner />;
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
            {/* Background Image with Overlay */}
            <div className="relative z-0 min-h-screen w-full overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-60 scale-105 animate-slow-zoom"
                >
                    <source src="/intro.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all duration-500 hover:scale-[1.01]">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 rounded-full mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                            <Building2 className="w-10 h-10 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Platform Setup
                        </h1>
                        <p className="text-blue-400 font-medium tracking-widest uppercase text-xs mt-2">
                            Initialize Admin Control
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-between mb-8 gap-2">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${s <= step ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'transparent'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm animate-shake">
                            <div className="p-1 bg-red-500/20 rounded-full">
                                <AlertCircle size={16} />
                            </div>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <User className="w-4 h-4 text-blue-400" />
                                    Identity Profile
                                </h2>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Email Access</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20"
                                            placeholder="admin@platform.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4"
                            >
                                Proceed to Security
                            </button>
                        </div>
                    )}

                    {/* Step 2: Credentials */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Lock className="w-4 h-4 text-blue-400" />
                                    Security Credentials
                                </h2>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20"
                                        placeholder="platformadmin"
                                    />
                                </div>


                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20 pr-10"
                                                placeholder="••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Confirm</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20 pr-10"
                                                placeholder="••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all border border-white/10"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    Failsafe PIN
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: PIN */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                    Failsafe Access PIN
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">4-Digit PIN</label>
                                        <div className="relative">
                                            <input
                                                type={showPin ? "text" : "password"}
                                                value={formData.pin}
                                                maxLength={4}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*$/.test(val) && val.length <= 4) {
                                                        setFormData(prev => ({ ...prev, pin: val }));
                                                    }
                                                }}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20 pr-10 tracking-widest text-center font-bold text-lg"
                                                placeholder="••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPin(!showPin)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Confirm PIN</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPin ? "text" : "password"}
                                                value={formData.confirmPin}
                                                maxLength={4}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^\d*$/.test(val) && val.length <= 4) {
                                                        setFormData(prev => ({ ...prev, confirmPin: val }));
                                                    }
                                                }}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-white/20 pr-10 tracking-widest text-center font-bold text-lg"
                                                placeholder="••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPin(!showConfirmPin)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                            >
                                                {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all border border-white/10"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    Review Config
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Check className="w-4 h-4 text-green-400" />
                                Confirm Initialization
                            </h2>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-xs text-white/40 uppercase tracking-widest">Identity</p>
                                    <p className="font-bold text-white">{formData.name}</p>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-xs text-white/40 uppercase tracking-widest">Access Email</p>
                                    <p className="font-bold text-white">{formData.email}</p>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-xs text-white/40 uppercase tracking-widest">Username</p>
                                    <p className="font-bold text-white font-mono bg-white/10 px-2 py-0.5 rounded text-sm">{formData.username}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-white/40 uppercase tracking-widest">Failsafe PIN</p>
                                    <p className="font-bold text-white font-mono bg-white/10 px-2 py-0.5 rounded text-sm">••••</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest transition-all border border-white/10 disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? 'Confirming...' : 'Confirm & Launch'}
                                </button>
                            </div>
                        </div>
                    )}

                    {loading && step === 4 && (
                        <div className="mt-6 flex flex-col items-center justify-center text-white/50 text-xs tracking-widest uppercase animate-pulse">
                            <LoadingSpinner />
                            <p className="mt-3">Establishing Administrative Control...</p>
                        </div>
                    )}
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
