"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clientService, Client } from "@/lib/services/clientService";
import { ClientCard } from "@/components/clients/ClientCard";
import { Plus, Search } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";

import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";

function ClientsPageContent() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await clientService.getClients();
            // Sort by newest first
            const sorted = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setClients(sorted);
        } catch (error) {
            console.error("Failed to load clients", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <Link href="/" className="text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                                <h1 className="text-3xl font-bold text-blue-500">Clients</h1>
                            </div>
                            <Link href="/clients/add">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                    <Plus size={20} />
                                    Add Client
                                </button>
                            </Link>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-gray-500" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone number..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading clients...</div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-10 bg-gray-800/50 rounded-xl border border-gray-800">
                                <p className="text-gray-400 mb-4">No clients found.</p>
                                {search && <p className="text-sm text-gray-500">Try a different search term.</p>}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredClients.map(client => (
                                    <ClientCard key={client.id} client={client} onUpdate={loadClients} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ClientsPage() {
    return (
        <GlobalNotificationProvider>
            <ClientsPageContent />
        </GlobalNotificationProvider>
    );
}
