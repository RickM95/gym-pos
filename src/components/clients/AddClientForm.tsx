"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientService } from "@/lib/services/clientService";
import { subscriptionService, Plan } from "@/lib/services/subscriptionService";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { Camera, Upload, Check, User, Phone, FileText, CreditCard, ChevronDown, ArrowLeft, X, RefreshCw } from "lucide-react";
import { CameraPreview } from "@/components/ui/CameraPreview";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import LoadingSpinner from "../ui/LoadingSpinner";
import { COUNTRIES } from "@/lib/constants/countries";

export const AddClientForm = () => {
    const { user } = useAuth();
    const router = useRouter();
    const { addNotification } = useGlobalNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.dial === '+504') || COUNTRIES[0]);

    const filteredCountries = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch)
    );

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: "",
        photoUrl: "",
        rtn: "",
        dpi: "",
        planId: "",
        paymentMethod: "CASH" as 'CASH' | 'TRANSFER' | 'POS' | 'COMPLIMENTARY',
        paymentReference: "",
        paymentImage: "",
        complimentaryDuration: 30,
        customDurationValue: ""
    });

    useEffect(() => {
        const loadPlans = async () => {
            const data = await subscriptionService.getPlans();
            setPlans(data);
        };
        loadPlans();
    }, []);

    const handleCapture = (imageDataUrl: string) => {
        setFormData({ ...formData, photoUrl: imageDataUrl });
        setShowCamera(false);
        addNotification("success", "Photo captured successfully!");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photoUrl: reader.result as string });
                addNotification("success", "Photo uploaded successfully!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            addNotification("error", "Full Name is required");
            return;
        }

        setIsLoading(true);
        try {
            // Create the client
            const newClient = await clientService.createClient({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                notes: formData.notes,
                photoUrl: formData.photoUrl,
                rtn: formData.rtn,
                dpi: formData.dpi,
                status: 'active',
                joinedDate: new Date().toISOString()
            });

            // Assign subscription if plan selected
            if (formData.planId) {
                const selectedPlan = formData.planId === 'complimentary' ? null : plans.find(p => p.id === formData.planId);
                const amount = formData.planId === 'complimentary' ? 0 : selectedPlan?.price || 0;

                await subscriptionService.assignSubscription(newClient.id, formData.planId, {
                    method: formData.paymentMethod,
                    amount: amount,
                    reference: formData.paymentReference,
                    image: formData.paymentImage,
                    durationDays: formData.paymentMethod === 'COMPLIMENTARY' ? formData.complimentaryDuration : undefined,
                    adminName: user?.name || "Admin"
                });
                addNotification("success", "Client created and subscription activated!");
            } else {
                addNotification("success", "Client created successfully!");
            }

            router.push('/clients');
        } catch (error) {
            console.error("Failed to create client:", error);
            addNotification("error", "Failed to create client. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <Link href="/clients" className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 text-sm">
                    <ArrowLeft size={16} /> Back to List
                </Link>
                <h1 className="text-3xl font-bold text-blue-500">Add New Client</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name *</label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-blue-500 transition"
                            placeholder="Client's full name"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                </div>

                {/* Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Country Code</label>
                        <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white flex justify-between items-center hover:border-blue-500 transition"
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-xl">{selectedCountry.flag}</span>
                                <span>{selectedCountry.dial}</span>
                            </span>
                            <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showCountryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 max-h-64 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b border-gray-800 bg-gray-900">
                                    <input
                                        type="text"
                                        placeholder="Search country..."
                                        value={countrySearch}
                                        onChange={(e) => setCountrySearch(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="overflow-y-auto custom-scrollbar flex-1 bg-gray-900">
                                    {filteredCountries.length > 0 ? (
                                        filteredCountries.map((c) => (
                                            <button
                                                key={`${c.name}-${c.dial}`}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCountry(c);
                                                    setShowCountryDropdown(false);
                                                    setCountrySearch("");
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 text-left text-white transition-colors border-b border-gray-800 last:border-0"
                                            >
                                                <span className="text-xl">{c.flag}</span>
                                                <span className="flex-1 text-sm truncate">{c.name}</span>
                                                <span className="text-gray-500 text-xs">{c.dial}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">No countries found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-blue-500 transition"
                                placeholder="Enter phone number"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                    </div>
                </div>

                {/* Photo Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Photo (Optional)</label>

                    {formData.photoUrl ? (
                        <div className="relative w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden border border-gray-600 bg-black">
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, photoUrl: "" })}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : showCamera ? (
                        <div className="max-w-md mx-auto">
                            <CameraPreview onCapture={handleCapture} isActive={true} />
                            <button
                                type="button"
                                onClick={() => setShowCamera(false)}
                                className="mt-2 w-full text-center text-sm text-gray-400 hover:text-white"
                            >
                                Cancel Camera
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-700/30 transition group"
                            >
                                <Camera className="w-8 h-8 text-gray-500 group-hover:text-blue-400 mb-2" />
                                <span className="text-sm font-medium">Take photo with camera</span>
                            </button>

                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-700/30 transition group cursor-pointer">
                                <Upload className="w-8 h-8 text-gray-500 group-hover:text-blue-400 mb-2" />
                                <span className="text-sm font-medium">Upload photo from device</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                    <div className="relative">
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-blue-500 transition resize-none"
                            placeholder="Add health notes, goals, or preferences..."
                        />
                        <FileText className="absolute left-3 top-3 text-gray-500" size={18} />
                    </div>
                </div>

                {/* Initial Subscription */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Initial Subscription (Optional)</label>
                    <div className="relative">
                        <select
                            value={formData.planId}
                            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-blue-500 transition appearance-none"
                        >
                            <option value="">Select a plan</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} - ${plan.price} ({plan.durationDays} days)
                                </option>
                            ))}
                        </select>
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                    </div>
                    {plans.length === 0 && (
                        <p className="text-xs text-yellow-500 mt-2">No plans available. Create plans first.</p>
                    )}
                </div>

                {/* Enhanced Payment Details */}
                {formData.planId && (
                    <div className="space-y-6 p-6 bg-gray-900/50 rounded-2xl border border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <CreditCard className="text-blue-500" size={20} />
                            Payment Confirmation
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentMethod: 'CASH', paymentReference: '' })}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.paymentMethod === 'CASH'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <CreditCard size={20} />
                                <span className="font-bold">Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentMethod: 'TRANSFER' })}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.paymentMethod === 'TRANSFER'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <RefreshCw size={20} />
                                <span className="font-bold">Transfer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentMethod: 'POS', paymentReference: '' })}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.paymentMethod === 'POS'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <CreditCard size={20} />
                                <span className="font-bold">POS/Card</span>
                            </button>
                        </div>

                        {user?.role === 'ADMIN' && (
                            <button
                                type="button"
                                onClick={() => setFormData({
                                    ...formData,
                                    paymentMethod: 'COMPLIMENTARY',
                                    paymentReference: 'Admin Override - 30 Days',
                                    complimentaryDuration: 30
                                })}
                                className={`w-full p-3 mt-2 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 ${formData.paymentMethod === 'COMPLIMENTARY'
                                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500'
                                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-yellow-600/50'
                                    }`}
                            >
                                <Check size={16} />
                                <span className="font-bold uppercase tracking-wider text-xs">Complimentary / On the House</span>
                            </button>
                        )}

                        {formData.paymentMethod === 'COMPLIMENTARY' && (
                            <div className="space-y-4 pt-4 border-t border-gray-800">
                                <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                                    <p className="text-yellow-500 text-xs font-bold uppercase mb-2">Complimentary Duration</p>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {[
                                            { label: '30 Days', val: 30 },
                                            { label: '6 Months', val: 180 },
                                            { label: '1 Year', val: 365 },
                                            { label: '2 Years', val: 730 }
                                        ].map(opt => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    complimentaryDuration: opt.val,
                                                    paymentReference: `Admin Override - ${opt.label}`
                                                })}
                                                className={`p-2 rounded-lg border text-xs transition-all ${formData.complimentaryDuration === opt.val
                                                    ? 'bg-yellow-500/30 border-yellow-500 text-yellow-500'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold">Custom Days</label>
                                        <input
                                            type="number"
                                            value={formData.customDurationValue}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    customDurationValue: e.target.value,
                                                    complimentaryDuration: isNaN(val) ? formData.complimentaryDuration : val,
                                                    paymentReference: isNaN(val) ? formData.paymentReference : `Admin Override - Custom ${val} Days`
                                                });
                                            }}
                                            placeholder="Days..."
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(formData.paymentMethod === 'TRANSFER' || formData.paymentMethod === 'POS') && (
                            <div className="space-y-4 pt-4 border-t border-gray-800">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Reference Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.paymentReference}
                                        onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Enter transaction reference"
                                    />
                                </div>

                                {formData.paymentMethod === 'TRANSFER' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Confirmation Image</label>
                                        {formData.paymentImage ? (
                                            <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-700">
                                                <img src={formData.paymentImage} className="w-full h-full object-contain bg-black" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, paymentImage: "" })}
                                                    className="absolute top-2 right-2 bg-red-600 p-1 rounded-full text-white"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 transition cursor-pointer">
                                                <Upload size={24} className="text-gray-500 mb-2" />
                                                <span className="text-xs text-gray-400">Upload screenshot</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setFormData({ ...formData, paymentImage: reader.result as string });
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.paymentMethod === 'CASH' && (
                            <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 text-sm text-center">
                                    Confirm receipt of cash payment before creating profile.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isLoading ? (
                        <LoadingSpinner message="Enlisting Spartan..." />
                    ) : (
                        <Check size={20} />
                    )}
                    {isLoading ? '' : 'Create Client Profile'}
                </button>
            </form>
        </div>
    );
};
