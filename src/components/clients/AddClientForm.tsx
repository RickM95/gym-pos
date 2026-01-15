"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientService } from "@/lib/services/clientService";
import { subscriptionService, Plan } from "@/lib/services/subscriptionService";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { Camera, Upload, Check, User, Phone, FileText, CreditCard, ChevronDown, ArrowLeft, X } from "lucide-react";
import { CameraPreview } from "@/components/ui/CameraPreview";
import Link from "next/link";

export const AddClientForm = () => {
    const router = useRouter();
    const { addNotification } = useGlobalNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showCamera, setShowCamera] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: "",
        photoUrl: "",
        rtn: "",
        dpi: "",
        planId: ""
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
                await subscriptionService.assignSubscription(newClient.id, formData.planId);
                addNotification("success", "Client created and plan assigned!");
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
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                        <div className="bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white flex justify-between items-center cursor-default">
                            <span className="flex items-center gap-2">
                                <span className="text-xl">🇭🇳</span>
                                <span>HN +504</span>
                            </span>
                            <ChevronDown size={16} className="text-gray-500" />
                        </div>
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <Check size={20} />
                    )}
                    {isLoading ? 'Creating Client...' : 'Create Client Profile'}
                </button>
            </form>
        </div>
    );
};
