"use client";

import { useState, useEffect } from "react";
import { Database, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { initializeMockData } from "@/lib/mock/inventoryData";

export default function DataInitializer() {
    const [isInitializing, setIsInitializing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [initializedData, setInitializedData] = useState<any>(null);

    useEffect(() => {
        checkInitializationStatus();
    }, []);

    const checkInitializationStatus = async () => {
        try {
            // Check if data already exists
            const response = await fetch('/api/check-initialization');
            if (response.ok) {
                const data = await response.json();
                setInitializedData(data);
            }
        } catch (error) {
            console.error('Failed to check initialization status:', error);
        }
    };

    const handleInitialize = async () => {
        setIsInitializing(true);
        setStatus('loading');
        setMessage('Initializing sample data...');

        try {
            await initializeMockData();
            setStatus('success');
            setMessage('Sample data initialized successfully!');

            // Recheck status
            setTimeout(checkInitializationStatus, 1000);
        } catch (error) {
            setStatus('error');
            setMessage('Failed to initialize data. Please try again.');
            console.error('Initialization error:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const getDatabaseStatus = () => {
        if (!initializedData) return 'Unknown';

        const { categories, products, suppliers, expenses, sales } = initializedData;

        if (categories > 0 && products > 0 && suppliers > 0) {
            return 'Populated';
        } else if (categories > 0 || products > 0 || suppliers > 0) {
            return 'Partial';
        } else {
            return 'Empty';
        }
    };

    const getStatusColor = () => {
        const status = getDatabaseStatus();
        switch (status) {
            case 'Populated': return 'text-green-400';
            case 'Partial': return 'text-yellow-400';
            case 'Empty': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-lg">
                                <Database size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Data Initialization</h1>
                                <p className="text-gray-400 mt-1">Set up sample data for Spartan Gym Analytics & Inventory</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Current Status */}
                        <div className="bg-gray-900/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Database Status</h3>

                            {initializedData ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-400">{initializedData.categories || 0}</p>
                                        <p className="text-gray-400 text-sm">Categories</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-400">{initializedData.products || 0}</p>
                                        <p className="text-gray-400 text-sm">Products</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-400">{initializedData.suppliers || 0}</p>
                                        <p className="text-gray-400 text-sm">Suppliers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-orange-400">{initializedData.expenses || 0}</p>
                                        <p className="text-gray-400 text-sm">Expenses</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <LoadingSpinner size="sm" message="Syncing Gym Data..." />
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <span className="text-gray-300">Overall Status:</span>
                                <span className={`font-bold ${getStatusColor()}`}>
                                    {getDatabaseStatus()}
                                </span>
                            </div>
                        </div>

                        {/* What will be created */}
                        <div className="bg-gray-900/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Sample Data Overview</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">6 Product Categories (Supplements, Beverages, Accessories, etc.)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">15+ Sample Products with realistic pricing and stock levels</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">3 Suppliers with contact information</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">Sample Expenses (Rent, Utilities, Salaries, etc.)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">Sample Sales Transactions</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-gray-300">Revenue Analytics Data</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${status === 'success' ? 'bg-green-900/50 text-green-400' :
                                    status === 'error' ? 'bg-red-900/50 text-red-400' :
                                        'bg-blue-900/50 text-blue-400'
                                }`}>
                                {status === 'success' && <CheckCircle size={20} />}
                                {status === 'error' && <AlertCircle size={20} />}
                                {status === 'loading' && <LoadingSpinner size="sm" message={message} />}
                                {status !== 'loading' && <span>{message}</span>}
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleInitialize}
                                disabled={isInitializing || getDatabaseStatus() === 'Populated'}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                            >
                                {isInitializing ? (
                                    <>
                                        <LoadingSpinner size="sm" message="Hang tight..." />
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={20} />
                                        Initialize Sample Data
                                    </>
                                )}
                            </button>

                            {getDatabaseStatus() === 'Populated' && (
                                <button
                                    onClick={() => window.location.href = '/analytics'}
                                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition"
                                >
                                    View Dashboard
                                </button>
                            )}
                        </div>

                        {/* Warning */}
                        {getDatabaseStatus() === 'Populated' && (
                            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={20} className="text-yellow-400" />
                                    <div>
                                        <p className="text-yellow-400 font-medium">Data Already Initialized</p>
                                        <p className="text-yellow-300 text-sm mt-1">
                                            Your database already contains sample data. You can proceed to the analytics dashboard or reinitialize if needed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}