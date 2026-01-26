"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, FileText, Calendar, Filter, AlertTriangle, Shield, DollarSign, Users, Clock } from "lucide-react";
import { reportService, REPORT_CONFIGS, TaxReport } from "@/lib/services/reportService";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGlobalNotifications } from "@/components/providers/GlobalNotificationProvider";
import { GlobalNotificationProvider } from "@/components/providers/GlobalNotificationProvider";
import Navigation from "@/components/navigation/Navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ReportsPage() {
    const { user } = useAuth();
    const { addNotification } = useGlobalNotifications();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
    const [showTaxModal, setShowTaxModal] = useState(false);

    // Check if user can access reports
    const canViewFinancials = user?.permissions?.view_financials || user?.role === 'ADMIN';
    const canManageClients = user?.permissions?.manage_clients || user?.role === 'ADMIN';
    const canManageTax = user?.role === 'ADMIN'; // Tax management typically admin only

    useEffect(() => {
        loadTaxReports();
    }, []);

    const loadTaxReports = async () => {
        setLoading(true);
        try {
            const reports = await reportService.getTaxReports();
            setTaxReports(reports);
        } catch (error) {
            console.error("Failed to load tax reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (configId: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
        setGenerating(configId);
        try {
            const blob = await reportService.generateReport(configId, dateRange.startDate, dateRange.endDate, format);

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Generate filename
            const config = REPORT_CONFIGS.find(c => c.id === configId);
            const filename = `${config?.name}_${dateRange.startDate}_to_${dateRange.endDate}.${format.toLowerCase()}`;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate report:", error);
            addNotification("error", "Failed to generate report. Please try again.", 5000);
        } finally {
            setGenerating(null);
        }
    };

    const handleTaxDownload = async (reportId: string, format: 'PDF' | 'EXCEL') => {
        setGenerating(`tax_${reportId}`);
        try {
            const blob = await reportService.generateReport(reportId, dateRange.startDate, dateRange.endDate, format);

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Tax_Report_${reportId}_${dateRange.startDate}_to_${dateRange.endDate}.${format.toLowerCase()}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate tax report:", error);
            addNotification("error", "Failed to generate tax report. Please try again.", 5000);
        } finally {
            setGenerating(null);
        }
    };

    const availableReports = REPORT_CONFIGS.filter(config => {
        // Filter based on permissions
        if (config.type === 'FINANCIAL' && !canViewFinancials) return false;
        if (config.type === 'MEMBERSHIP' && !canManageClients) return false;
        if (config.type === 'TAX' && !canManageTax) return false;
        return true;
    });

    if (!canViewFinancials && !canManageClients) {
        return (
            <div className="flex h-screen bg-gray-900">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
                    <Shield size={64} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-gray-400 mb-8">You don't have permission to access reports.</p>
                    <Link href="/" className="text-blue-400 hover:underline">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <GlobalNotificationProvider>
            <div className="flex h-screen bg-gray-900">
                <Navigation />

                <div className="flex-1 lg:ml-0 overflow-auto">
                    <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <Link href="/" className="text-gray-400 hover:text-white mb-2 block">← Back to Dashboard</Link>
                                    <h1 className="text-3xl font-bold text-blue-500">Reports & Analytics</h1>
                                </div>
                            </div>

                            {loading ? (
                                <LoadingSpinner message="Gathering data..." />
                            ) : (
                                <>
                                    {/* Date Range Filter */}
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={20} className="text-gray-400" />
                                                <span className="text-gray-400">Date Range:</span>
                                            </div>
                                            <input
                                                type="date"
                                                value={dateRange.startDate}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                            />
                                            <span className="text-gray-400">to</span>
                                            <input
                                                type="date"
                                                value={dateRange.endDate}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Available Reports */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        {availableReports.map(config => (
                                            <div key={config.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-3 rounded-lg ${config.type === 'FINANCIAL' ? 'bg-green-900/30' :
                                                            config.type === 'MEMBERSHIP' ? 'bg-blue-900/30' :
                                                                config.type === 'ATTENDANCE' ? 'bg-purple-900/30' :
                                                                    config.type === 'TAX' ? 'bg-yellow-900/30' :
                                                                        'bg-gray-900/30'
                                                            }`}>
                                                            {config.type === 'FINANCIAL' && <DollarSign className="text-green-400" size={24} />}
                                                            {config.type === 'MEMBERSHIP' && <Users className="text-blue-400" size={24} />}
                                                            {config.type === 'ATTENDANCE' && <Clock className="text-purple-400" size={24} />}
                                                            {config.type === 'TAX' && <FileText className="text-yellow-400" size={24} />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white">{config.name}</h3>
                                                            <p className="text-sm text-gray-400">{config.description}</p>
                                                        </div>
                                                    </div>
                                                    {config.taxCompliant && (
                                                        <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-500/30">
                                                            TAX
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    {config.exportFormats.map(format => (
                                                        <button
                                                            key={format}
                                                            onClick={() => {
                                                                if (config.type === 'TAX') {
                                                                    handleTaxDownload(config.id, format as any);
                                                                } else {
                                                                    handleDownload(config.id, format as any);
                                                                }
                                                            }}
                                                            disabled={generating === config.id || (config.type === 'TAX' && generating === `tax_${config.id}`)}
                                                            className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${generating === config.id || (config.type === 'TAX' && generating === `tax_${config.id}`)
                                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                }`}
                                                        >
                                                            <Download size={16} className="inline mr-2" />
                                                            {generating === config.id || (config.type === 'TAX' && generating === `tax_${config.id}`) ? 'Generating...' : `Download ${format}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Honduran Tax Reports Section */}
                                    {canManageTax && (
                                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="text-yellow-400" size={24} />
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">Honduran Tax Reports</h2>
                                                        <p className="text-sm text-gray-400">Tax declarations for Servicios de Administración de Rentas</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowTaxModal(true)}
                                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
                                                >
                                                    Create Tax Report
                                                </button>
                                            </div>

                                            {taxReports.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                                    <p>No tax reports filed yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {taxReports.map(report => (
                                                        <div key={report.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-bold text-white">Period: {report.reportingPeriod.startDate} to {report.reportingPeriod.endDate}</h4>
                                                                    <p className="text-sm text-gray-400">Status:
                                                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${report.status === 'FILED' ? 'bg-green-900/30 text-green-400' :
                                                                            report.status === 'DRAFT' ? 'bg-yellow-900/30 text-yellow-400' :
                                                                                'bg-gray-700 text-gray-400'
                                                                            }`}>
                                                                            {report.status}
                                                                        </span>
                                                                    </p>
                                                                    {report.declarationNumber && (
                                                                        <p className="text-sm text-gray-400">Declaration #: {report.declarationNumber}</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm text-gray-400">Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                                                                    {report.filingDate && (
                                                                        <p className="text-sm text-gray-400">Filed: {new Date(report.filingDate).toLocaleDateString()}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Compliance Information */}
                                    <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <Shield size={20} className="text-blue-400" />
                                            Honduran Tax Compliance
                                        </h3>
                                        <div className="text-sm text-gray-400 space-y-2">
                                            <p>• IVA rate: 15% (as of current legislation)</p>
                                            <p>• Tax reporting deadlines: Monthly (20th), Quarterly (15th), Annual (90th after year end)</p>
                                            <p>• Required documentation: RTN, CAE, supporting documents</p>
                                            <p>• All declarations must include complete economic activity details</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </GlobalNotificationProvider>
    );
}