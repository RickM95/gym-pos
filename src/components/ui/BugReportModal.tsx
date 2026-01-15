"use client";

import { useState } from "react";
import { Bug, X, MessageSquare, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { loggerService } from "@/lib/services/loggerService";

export default function BugReportModal() {
    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Only logged-in users or anyone? Let's say anyone for now, even on login screen.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
try {
            await loggerService.reportBug(message, user, description);
            addNotification("success", "Thanks! Our tech team has been notified.", 4000);
            setIsOpen(false);
            setMessage("");
            setDescription("");
        } catch (err) {
            console.error(err);
            addNotification("error", "Failed to submit report.", 5000);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 p-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-full shadow-lg border border-red-800 transition z-50 group"
                title="Report an Issue"
            >
                <Bug size={24} className="group-hover:rotate-12 transition" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-red-500/30 w-full max-w-md shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                        <AlertTriangle size={20} /> Report an Issue
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Issue Summary</label>
                        <input
                            type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none"
                            placeholder="e.g. Scanner not working..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Details</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none h-32"
                            placeholder="Describe what happened..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 rounded-lg hover:bg-gray-700 text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg disabled:opacity-50"
                        >
                            {submitting ? 'Sending...' : 'Report Bug'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
