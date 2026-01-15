import { getDB } from '../db';
import { logEvent } from '../sync';

export interface DashboardStats {
    totalClients: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    todaysCheckins: number;
}

// Honduran SAR (Servicio de Administración de Rentas) Tax Compliance
export interface TaxReport {
    id: string;
    reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'IVA' | 'ISR';
    reportDate: string;
    filingDate: string;
    reportingPeriod: {
        startDate: string;
        endDate: string;
    };
    institution: {
        name: string;
        rtn: string; // Registro Tributario Nacional
        cae?: string; // Certificado de Autorización de Escritura
        address: string;
        phone: string;
        email: string;
        economicActivity: string;
    };
    taxSummary: {
        totalRevenue: number;
        taxableRevenue: number;
        exemptRevenue: number;
        ivaCollected: number;
        ivaPaid: number;
        isrWithheld: number;
        isrPaid: number;
        netTax: number;
    };
    details: {
        revenueByCategory: Record<string, number>;
        expensesByCategory: Record<string, number>;
        clientTransactions: Array<{
            clientId: string;
            clientName: string;
            clientRTN?: string;
            amount: number;
            iva: number;
            date: string;
            service: string;
        }>;
        expenseTransactions: Array<{
            vendorName: string;
            vendorRTN?: string;
            amount: number;
            iva: number;
            date: string;
            category: string;
        }>;
    };
    status: 'DRAFT' | 'FILED' | 'ACKNOWLEDGED' | 'PAID' | 'CLOSED';
    declarationNumber?: string;
    paymentReference?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface ReportConfig {
    id: string;
    name: string;
    description: string;
    type: 'FINANCIAL' | 'MEMBERSHIP' | 'ATTENDANCE' | 'TAX';
    template: string;
    requiredFields: string[];
    exportFormats: ('PDF' | 'EXCEL' | 'CSV')[];
    taxCompliant: boolean;
}

export const REPORT_CONFIGS: ReportConfig[] = [
    {
        id: 'monthly_financial',
        name: 'Monthly Financial Report',
        description: 'Revenue, expenses, and financial summary',
        type: 'FINANCIAL',
        template: 'monthly_financial',
        requiredFields: ['revenue', 'expenses', 'profit'],
        exportFormats: ['PDF', 'EXCEL', 'CSV'],
        taxCompliant: false
    },
    {
        id: 'membership_report',
        name: 'Membership Report',
        description: 'Active members, subscriptions, and retention',
        type: 'MEMBERSHIP',
        template: 'membership',
        requiredFields: ['activeMembers', 'newMembers', 'churnRate'],
        exportFormats: ['PDF', 'EXCEL', 'CSV'],
        taxCompliant: false
    },
    {
        id: 'attendance_report',
        name: 'Attendance Report',
        description: 'Daily check-ins and attendance patterns',
        type: 'ATTENDANCE',
        template: 'attendance',
        requiredFields: ['checkins', 'peakHours', 'frequency'],
        exportFormats: ['PDF', 'EXCEL', 'CSV'],
        taxCompliant: false
    },
    {
        id: 'tax_monthly',
        name: 'Monthly Tax Declaration (SAR)',
        description: 'Monthly tax declaration for Honduran tax authority',
        type: 'TAX',
        template: 'tax_monthly',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    },
    {
        id: 'tax_quarterly',
        name: 'Quarterly Tax Declaration (SAR)',
        description: 'Quarterly tax declaration for Honduran tax authority',
        type: 'TAX',
        template: 'tax_quarterly',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    },
    {
        id: 'tax_iva',
        name: 'IVA Declaration (SAR)',
        description: 'Monthly IVA declaration for Honduran tax authority',
        type: 'TAX',
        template: 'tax_iva',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    }
];

export const reportService = {
    // --- DASHBOARD STATS (existing functionality) ---
    async getStats(): Promise<DashboardStats> {
        const db = await getDB();

        // 1. Total Clients
        const clients = await db.getAll('clients');
        const totalClients = clients.length;

        // 2. Active Subscriptions & Revenue
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const planMap = new Map(plans.map(p => [p.id, p]));

        let activeSubscriptions = 0;
        let monthlyRevenue = 0;
        const now = new Date();

        subscriptions.forEach(sub => {
            const start = new Date(sub.startDate);
            const end = new Date(sub.endDate);

            if (sub.isActive && now >= start && now <= end) {
                activeSubscriptions++;

                const plan = planMap.get(sub.planId);
                if (plan) {
                    // Normalize to monthly revenue (30 days)
                    // Revenue = (Price / Duration) * 30
                    const dailyRate = plan.price / plan.durationDays;
                    monthlyRevenue += dailyRate * 30;
                }
            }
        });

        // 3. Today's Checkins
        const checkins = await db.getAll('checkins');
        const todayStr = now.toDateString(); // "Wed Jan 14 2026"
        const todaysCheckins = checkins.filter(c => new Date(c.timestamp).toDateString() === todayStr).length;

        return {
            totalClients,
            activeSubscriptions,
            monthlyRevenue: Math.round(monthlyRevenue),
            todaysCheckins
        };
    },

    // --- DOWNLOADABLE REPORTS ---
    async generateReport(configId: string, startDate: string, endDate: string, format: 'PDF' | 'EXCEL' | 'CSV' = 'PDF'): Promise<Blob> {
        const config = REPORT_CONFIGS.find(c => c.id === configId);
        if (!config) throw new Error('Report configuration not found');

        let data: any = {};

        switch (config.type) {
            case 'FINANCIAL':
                data = await this.generateFinancialData(startDate, endDate);
                break;
            case 'MEMBERSHIP':
                data = await this.generateMembershipData(startDate, endDate);
                break;
            case 'ATTENDANCE':
                data = await this.generateAttendanceData(startDate, endDate);
                break;
            case 'TAX':
                throw new Error('Tax reports must be created through tax interface');
        }

        // Generate report based on format
        switch (format) {
            case 'PDF':
                return this.generatePDFReport(config, data, startDate, endDate);
            case 'EXCEL':
                return this.generateExcelReport(config, data, startDate, endDate);
            case 'CSV':
                return this.generateCSVReport(config, data, startDate, endDate);
            default:
                throw new Error('Unsupported format');
        }
    },

    async generateFinancialData(startDate: string, endDate: string) {
        const db = await getDB();
        
        // Get all subscriptions within date range
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        
        // Calculate revenue
        let totalRevenue = 0;
        const revenueByPlan: Record<string, number> = {};
        
        subscriptions.forEach(sub => {
            const subDate = new Date(sub.startDate);
            if (subDate >= new Date(startDate) && subDate <= new Date(endDate)) {
                const plan = plans.find(p => p.id === sub.planId);
                if (plan) {
                    totalRevenue += plan.price;
                    revenueByPlan[plan.name] = (revenueByPlan[plan.name] || 0) + plan.price;
                }
            }
        });

        return {
            period: { startDate, endDate },
            totalRevenue,
            revenueByPlan,
            totalSubscriptions: subscriptions.length,
            averageRevenue: subscriptions.length > 0 ? totalRevenue / subscriptions.length : 0
        };
    },

    async generateMembershipData(startDate: string, endDate: string) {
        const db = await getDB();
        const clients = await db.getAll('clients');
        const subscriptions = await db.getAll('subscriptions');
        
        const now = new Date();
        const activeMembers = subscriptions.filter(sub => {
            const endDate = new Date(sub.endDate);
            return endDate > now;
        }).length;

        const newMembers = clients.filter(client => {
            const joinDate = new Date(client.updatedAt);
            return joinDate >= new Date(startDate) && joinDate <= new Date(endDate);
        }).length;

        return {
            period: { startDate, endDate },
            totalClients: clients.length,
            activeMembers,
            newMembers,
            retentionRate: clients.length > 0 ? (activeMembers / clients.length) * 100 : 0
        };
    },

    async generateAttendanceData(startDate: string, endDate: string) {
        const db = await getDB();
        const checkins = await db.getAll('checkins');
        
        const filteredCheckins = checkins.filter(checkin => {
            const checkinDate = new Date(checkin.timestamp);
            return checkinDate >= new Date(startDate) && checkinDate <= new Date(endDate);
        });

        // Group by date
        const checkinsByDate: Record<string, number> = {};
        filteredCheckins.forEach(checkin => {
            const date = new Date(checkin.timestamp).toLocaleDateString();
            checkinsByDate[date] = (checkinsByDate[date] || 0) + 1;
        });

        // Find peak hours
        const hourCounts: Record<number, number> = {};
        filteredCheckins.forEach(checkin => {
            const hour = new Date(checkin.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts).reduce((a, b) => 
            hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b
        );

        return {
            period: { startDate, endDate },
            totalCheckins: filteredCheckins.length,
            averageDaily: filteredCheckins.length / Math.max(1, Object.keys(checkinsByDate).length),
            peakHour: `${peakHour[0]}:00 - ${peakHour[0]}:59`,
            peakHourCount: peakHour[1],
            checkinsByDate
        };
    },

    // --- HONDURAN TAX COMPLIANCE (SERVICIO DE ADMINISTRACIÓN DE RENTAS) ---
    async createTaxReport(reportData: Omit<TaxReport, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<TaxReport> {
        const db = await getDB();
        const id = `TAX-${Date.now()}`;
        
        const taxReport: TaxReport = {
            ...reportData,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.add('tax_reports', taxReport);
        await logEvent('TAX_REPORT_CREATED', taxReport);
        
        return taxReport;
    },

    async getTaxReports(): Promise<TaxReport[]> {
        const db = await getDB();
        return db.getAll('tax_reports');
    },

    async updateTaxReport(id: string, data: Partial<TaxReport>): Promise<TaxReport> {
        const db = await getDB();
        const report = await db.get('tax_reports', id);
        if (!report) throw new Error('Tax report not found');

        const updatedReport = {
            ...report,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('tax_reports', updatedReport);
        await logEvent('TAX_REPORT_UPDATED', updatedReport);
        
        return updatedReport;
    },

    async fileTaxReport(id: string): Promise<TaxReport> {
        const db = await getDB();
        const report = await db.get('tax_reports', id);
        if (!report) throw new Error('Tax report not found');

        const updatedReport = {
            ...report,
            status: 'FILED' as const,
            filingDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('tax_reports', updatedReport);
        await logEvent('TAX_REPORT_FILED', updatedReport);
        
        return updatedReport;
    },

    // --- TAX CALCULATION HELPERS ---
    async calculateTaxData(startDate: string, endDate: string) {
        const db = await getDB();
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const clients = await db.getAll('clients');
        
        // Calculate revenue with IVA (15% in Honduras)
        const IVA_RATE = 0.15;
        let totalRevenue = 0;
        let ivaCollected = 0;
        let exemptRevenue = 0;
        
        const clientTransactions: any[] = [];
        
        subscriptions.forEach(sub => {
            const subDate = new Date(sub.startDate);
            if (subDate >= new Date(startDate) && subDate <= new Date(endDate)) {
                const plan = plans.find(p => p.id === sub.planId);
                const client = clients.find(c => c.id === sub.clientId);
                
                if (plan && client) {
                    const revenue = plan.price;
                    const iva = revenue * IVA_RATE;
                    
                    totalRevenue += revenue;
                    ivaCollected += iva;
                    
                    clientTransactions.push({
                        clientId: client.id,
                        clientName: client.name,
                        clientRTN: undefined, // Client RTN not currently stored in client model
                        amount: revenue,
                        iva: iva,
                        date: sub.startDate,
                        service: plan.name
                    });
                }
            }
        });

        // Calculate expenses (mock data for now)
        const expensesByCategory: Record<string, number> = {
            'Utilities': 5000,
            'Rent': 15000,
            'Salaries': 25000,
            'Equipment': 3000,
            'Marketing': 2000,
            'Other': 1000
        };
        
        const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
        const ivaPaid = totalExpenses * IVA_RATE;
        
        return {
            period: { startDate, endDate },
            taxSummary: {
                totalRevenue,
                taxableRevenue: totalRevenue - exemptRevenue,
                exemptRevenue,
                ivaCollected,
                ivaPaid,
                isrWithheld: 0, // Would calculate based on employee salaries
                isrPaid: 0, // Would calculate based on profit
                netTax: ivaCollected - ivaPaid
            },
            details: {
                revenueByCategory: {}, // Would categorize by plan type
                expensesByCategory,
                clientTransactions,
                expenseTransactions: [] // Would track actual expenses
            }
        };
    },

    // --- EXPORT FORMATS ---
    async generatePDFReport(config: ReportConfig, data: any, startDate: string, endDate: string): Promise<Blob> {
        // This would use a PDF library like jsPDF or Puppeteer
        // For now, return a simple text-based report
        const reportText = this.generateTextReport(config, data, startDate, endDate);
        return new Blob([reportText], { type: 'text/plain' });
    },

    async generateExcelReport(config: ReportConfig, data: any, startDate: string, endDate: string): Promise<Blob> {
        // This would use a library like SheetJS
        // For now, return CSV format
        return this.generateCSVReport(config, data, startDate, endDate);
    },

    async generateCSVReport(config: ReportConfig, data: any, startDate: string, endDate: string): Promise<Blob> {
        let csv = '';
        
        switch (config.type) {
            case 'FINANCIAL':
                csv = 'Date,Plan,Revenue\n';
                Object.entries(data.revenueByPlan || {}).forEach(([plan, revenue]) => {
                    csv += `${endDate},${plan},${revenue}\n`;
                });
                csv += `\nTotal Revenue,,${data.totalRevenue}\n`;
                break;
                
            case 'MEMBERSHIP':
                csv = 'Metric,Value\n';
                csv += `Total Clients,${data.totalClients}\n`;
                csv += `Active Members,${data.activeMembers}\n`;
                csv += `New Members,${data.newMembers}\n`;
                csv += `Retention Rate,${data.retentionRate.toFixed(2)}%\n`;
                break;
                
            case 'ATTENDANCE':
                csv = 'Date,Check-ins\n';
                Object.entries(data.checkinsByDate || {}).forEach(([date, count]) => {
                    csv += `${date},${count}\n`;
                });
                csv += `\nTotal Check-ins,,${data.totalCheckins}\n`;
                csv += `Average Daily,,${data.averageDaily.toFixed(2)}\n`;
                csv += `Peak Hour,,${data.peakHour}\n`;
                break;
        }

        return new Blob([csv], { type: 'text/csv' });
    },

    generateTextReport(config: ReportConfig, data: any, startDate: string, endDate: string): string {
        let text = `${config.name}\n`;
        text += `Period: ${startDate} to ${endDate}\n`;
        text += `Generated: ${new Date().toLocaleString()}\n\n`;

        switch (config.type) {
            case 'FINANCIAL':
                text += `Total Revenue: ${data.totalRevenue} HNL\n`;
                text += `Total Subscriptions: ${data.totalSubscriptions}\n`;
                text += `Average Revenue: ${data.averageRevenue.toFixed(2)} HNL\n\n`;
                text += `Revenue by Plan:\n`;
                Object.entries(data.revenueByPlan || {}).forEach(([plan, revenue]) => {
                    text += `  ${plan}: ${revenue} HNL\n`;
                });
                break;
                
            case 'MEMBERSHIP':
                text += `Total Clients: ${data.totalClients}\n`;
                text += `Active Members: ${data.activeMembers}\n`;
                text += `New Members: ${data.newMembers}\n`;
                text += `Retention Rate: ${data.retentionRate.toFixed(2)}%\n`;
                break;
                
            case 'ATTENDANCE':
                text += `Total Check-ins: ${data.totalCheckins}\n`;
                text += `Average Daily: ${data.averageDaily.toFixed(2)}\n`;
                text += `Peak Hour: ${data.peakHour} (${data.peakHourCount} check-ins)\n\n`;
                text += `Daily Breakdown:\n`;
                Object.entries(data.checkinsByDate || {}).forEach(([date, count]) => {
                    text += `  ${date}: ${count} check-ins\n`;
                });
                break;
        }

        return text;
    },

    // --- HONDURAN TAX COMPLIANCE HELPERS (SERVICIO DE ADMINISTRACIÓN DE RENTAS) ---
    getHonduranTaxRequirements(): {
        ivaRate: number;
        filingDeadlines: Record<string, string>;
        requiredDocuments: string[];
        exemptCategories: string[];
    } {
        return {
            ivaRate: 0.15, // 15% IVA in Honduras
            filingDeadlines: {
                'MONTHLY': 'Within 20 days after month end',
                'QUARTERLY': 'Within 30 days after quarter end',
                'ANNUAL': 'Within 90 days after year end'
            },
            requiredDocuments: [
                'RTN (Registro Tributario Nacional)',
                'CAE (Certificado de Autorización de Escritura)',
                'Financial statements',
                'Supporting documentation',
                'Previous tax declarations'
            ],
            exemptCategories: [
                'Educational services',
                'Health services',
                'Basic food items',
                'Agricultural products',
                'Professional services (under certain conditions)'
            ]
        };
    },

    validateRTN(rtn: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // RTN should be 14 digits: 0801-XXXXXX-XX
        if (!rtn) {
            errors.push('RTN is required');
        } else if (rtn.length !== 14) {
            errors.push('RTN must be 14 digits');
        } else if (!rtn.startsWith('0801')) {
            errors.push('RTN must start with 0801');
        } else if (!/^\d+$/.test(rtn)) {
            errors.push('RTN must contain only numbers');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    validateTaxReport(report: TaxReport): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields validation
        if (!report.institution.rtn) errors.push('Institution RTN is required');
        if (!report.institution.name) errors.push('Institution name is required');
        if (!report.institution.address) errors.push('Institution address is required');
        if (!report.institution.economicActivity) errors.push('Economic activity is required');
        
        if (!report.taxSummary.totalRevenue && report.taxSummary.totalRevenue !== 0) {
            errors.push('Total revenue is required');
        }
        
        if (!report.details.clientTransactions.length && !report.details.expenseTransactions.length) {
            errors.push('At least one transaction is required');
        }

        // RTN validation
        const rtnValidation = this.validateRTN(report.institution.rtn);
        errors.push(...rtnValidation.errors);

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // --- TAX FORMATS FOR HONDURAN SAR ---
    generateSARDeclarationFormat(report: TaxReport): string {
        let declaration = `DECLARACIÓN TRIBUTARIA - SERVICIO DE ADMINISTRACIÓN DE RENTAS\n\n`;
        declaration += `PERÍODO: ${report.reportingPeriod.startDate} a ${report.reportingPeriod.endDate}\n`;
        declaration += `FECHA: ${new Date().toLocaleDateString('es-HN')}\n\n`;
        
        declaration += `DATOS DEL CONTRIBUYENTE:\n`;
        declaration += `Nombre: ${report.institution.name}\n`;
        declaration += `RTN: ${report.institution.rtn}\n`;
        declaration += `Actividad Económica: ${report.institution.economicActivity}\n`;
        declaration += `Dirección: ${report.institution.address}\n\n`;
        
        declaration += `RESUMEN FISCAL:\n`;
        declaration += `Ingresos Totales: L ${report.taxSummary.totalRevenue.toFixed(2)}\n`;
        declaration += `Ingresos Gravables: L ${report.taxSummary.taxableRevenue.toFixed(2)}\n`;
        declaration += `Ingresos Exentos: L ${report.taxSummary.exemptRevenue.toFixed(2)}\n`;
        declaration += `IVA Cobrado: L ${report.taxSummary.ivaCollected.toFixed(2)}\n`;
        declaration += `IVA Pagado: L ${report.taxSummary.ivaPaid.toFixed(2)}\n`;
        declaration += `Impuesto Neto: L ${report.taxSummary.netTax.toFixed(2)}\n\n`;
        
        declaration += `DETALLES DE TRANSACCIONES:\n`;
        report.details.clientTransactions.forEach((trans, index) => {
            declaration += `${index + 1}. ${trans.clientName} - L ${trans.amount.toFixed(2)} (IVA: L ${trans.iva.toFixed(2)})\n`;
        });
        
        return declaration;
    }
};
