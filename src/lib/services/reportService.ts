import { getDB } from '../db';
import { logEvent } from '../sync';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface DashboardStats {
    totalClients: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    todaysCheckins: number;
}

// Honduran SAR (Servicio de Administración de Rentas) Tax Compliance
export interface TaxReport {
    id: string;
    locationId: string;
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
        name: 'Monthly ISV Calculator (SAR)',
        description: 'Monthly tax calculation and guidance for Honduran ISV planning',
        type: 'TAX',
        template: 'tax_monthly',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    },
    {
        id: 'tax_quarterly',
        name: 'Quarterly ISV Calculator (SAR)',
        description: 'Quarterly tax calculation and guidance for Honduran ISV planning',
        type: 'TAX',
        template: 'tax_quarterly',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    },
    {
        id: 'tax_iva',
        name: 'IVA/ISV Calculator (SAR)',
        description: 'ISV calculation for Honduran tax compliance and planning',
        type: 'TAX',
        template: 'tax_iva',
        requiredFields: ['taxSummary', 'details', 'institution'],
        exportFormats: ['PDF', 'EXCEL'],
        taxCompliant: true
    }
];

export const reportService = {
    // --- DASHBOARD STATS (existing functionality) ---
    async getStats(locationId: string = 'all'): Promise<DashboardStats> {
        const db = await getDB();

        // 1. Total Clients
        const totalClients = locationId === 'all'
            ? await db.count('clients')
            : await db.countFromIndex('clients', 'by-location', locationId);

        // 2. Active Subscriptions & Revenue
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const planMap = new Map(plans.map(p => [p.id, p]));

        let activeSubscriptions = 0;
        let monthlyRevenue = 0;
        const now = new Date();

        subscriptions.forEach(sub => {
            if (locationId !== 'all' && sub.locationId !== locationId) return;

            const start = new Date(sub.startDate);
            const end = new Date(sub.endDate);

            if (sub.isActive && now >= start && now <= end) {
                activeSubscriptions++;

                const plan = planMap.get(sub.planId);
                if (plan) {
                    const dailyRate = plan.price / plan.durationDays;
                    monthlyRevenue += dailyRate * 30;
                }
            }
        });

        // 3. Today's Checkins
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const range = IDBKeyRange.lowerBound(startOfToday.getTime());
        const todaysCheckins = await db.countFromIndex('checkins', 'by-timestamp', range);

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
                // Generate tax data with disclaimer
                data = await this.calculateTaxData(startDate, endDate);
                break;
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
        const doc = new jsPDF();
        const margin = 20;
        let currentY = 20;

        // Add Disclaimer for Tax Reports
        if (config.type === 'TAX') {
            doc.setFillColor(254, 242, 242); // bg-red-50
            doc.rect(margin, currentY, 170, 30, 'F');
            doc.setDrawColor(239, 68, 68); // border-red-500
            doc.rect(margin, currentY, 170, 30, 'S');

            doc.setFontSize(12);
            doc.setTextColor(185, 28, 28); // text-red-700
            doc.setFont('helvetica', 'bold');
            doc.text('UNOFFICIAL DOCUMENT - FOR INFORMATIONAL PURPOSES ONLY', margin + 5, currentY + 10);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text([
                'NOT VALID FOR OFFICIAL TAX FILING OR LEGAL USE',
                'Consult with a certified accountant for official tax matters.'
            ], margin + 5, currentY + 18);

            currentY += 40;
        }

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(config.name, margin, currentY);
        currentY += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Period: ${startDate} to ${endDate}`, margin, currentY);
        currentY += 5;
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);
        currentY += 15;

        // Body Content
        doc.setTextColor(0, 0, 0);
        switch (config.type) {
            case 'FINANCIAL':
                doc.setFontSize(14);
                doc.text(`Total Revenue: ${data.totalRevenue.toLocaleString()} HNL`, margin, currentY);
                currentY += 10;

                const planRows = Object.entries(data.revenueByPlan || {}).map(([plan, rev]) => [plan, `${Number(rev).toLocaleString()} HNL`]);
                autoTable(doc, {
                    startY: currentY,
                    head: [['Plan Name', 'Revenue']],
                    body: planRows as any[],
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] }
                });
                break;

            case 'MEMBERSHIP':
                const memberRows = [
                    ['Total Clients', data.totalClients],
                    ['Active Members', data.activeMembers],
                    ['New Members', data.newMembers],
                    ['Retention Rate', `${data.retentionRate.toFixed(2)}%`]
                ];
                autoTable(doc, {
                    startY: currentY,
                    body: memberRows as any[],
                    theme: 'plain',
                    styles: { fontSize: 12 }
                });
                break;

            case 'ATTENDANCE':
                doc.setFontSize(14);
                doc.text(`Total Check-ins: ${data.totalCheckins}`, margin, currentY);
                currentY += 7;
                doc.text(`Peak Hour: ${data.peakHour}`, margin, currentY);
                currentY += 10;

                const attendRows = Object.entries(data.checkinsByDate || {}).map(([date, count]) => [date, count]);
                autoTable(doc, {
                    startY: currentY,
                    head: [['Date', 'Check-ins']],
                    body: attendRows as any[],
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] }
                });
                break;

            case 'TAX':
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Tax Summary', margin, currentY);
                currentY += 5;

                const taxSummaryRows = [
                    ['Total Revenue', `L ${data.taxSummary.totalRevenue.toFixed(2)}`],
                    ['Taxable Revenue', `L ${data.taxSummary.taxableRevenue.toFixed(2)}`],
                    ['IVA Collected (15%)', `L ${data.taxSummary.ivaCollected.toFixed(2)}`],
                    ['IVA Paid (Expenses)', `L ${data.taxSummary.ivaPaid.toFixed(2)}`],
                    ['Net Tax to Pay', `L ${data.taxSummary.netTax.toFixed(2)}`]
                ];

                autoTable(doc, {
                    startY: currentY,
                    body: taxSummaryRows,
                    theme: 'grid'
                });

                currentY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(14);
                doc.text('Transaction Details', margin, currentY);
                currentY += 5;

                const transRows = data.details.clientTransactions.map((t: any) => [
                    t.clientName,
                    `L ${t.amount.toFixed(2)}`,
                    `L ${t.iva.toFixed(2)}`,
                    new Date(t.date).toLocaleDateString(),
                    t.service
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['Client', 'Base', 'IVA', 'Date', 'Plan']],
                    body: transRows,
                    styles: { fontSize: 8 }
                });

                // Add Legal Advice Section
                currentY = (doc as any).lastAutoTable.finalY + 15;
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFillColor(243, 244, 246); // bg-gray-100
                doc.rect(margin, currentY, 170, 45, 'F');
                doc.setDrawColor(209, 213, 219); // border-gray-300
                doc.rect(margin, currentY, 170, 45, 'S');

                doc.setFontSize(11);
                doc.setTextColor(31, 41, 55); // text-gray-800
                doc.setFont('helvetica', 'bold');
                doc.text('LEGAL ASSISTANCE & SAR GUIDANCE (2025)', margin + 5, currentY + 10);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(75, 85, 99); // text-gray-600
                const advice = [
                    '• Reference: SAR-Ayuda-Declaracion-Jurada-Impuesto-Sobre-Ventas-ISV.pdf',
                    '• Based on Generalidades-ISV-2025.pdf: The standard 15% rate applies to gym services.',
                    '• Credit Warning: Review credits allowed per "Generalidades-creditos-en-la-declaracion-del-ISV.pdf".',
                    '• Compliance: This calculator is for planning. Use the official SAR portal for declarations.',
                    '• Tip: Keep all physical/digital receipts for at least 5 years as per Honduran Tax Code.'
                ];
                doc.text(advice, margin + 5, currentY + 18);
                break;
        }

        return doc.output('blob');
    },

    async generateExcelReport(config: ReportConfig, data: any, startDate: string, endDate: string): Promise<Blob> {
        const wb = XLSX.utils.book_new();
        let wsData: any[] = [];

        // Meta Info
        wsData.push([config.name]);
        wsData.push([`Period: ${startDate} to ${endDate}`]);
        wsData.push([`Generated: ${new Date().toLocaleString()}`]);
        wsData.push([]);

        if (config.type === 'TAX') {
            wsData.push(['⚠️ UNOFFICIAL DOCUMENT - FOR INFORMATIONAL PURPOSES ONLY ⚠️']);
            wsData.push(['NOT VALID FOR OFFICIAL TAX FILING OR LEGAL USE']);
            wsData.push([]);
        }

        switch (config.type) {
            case 'FINANCIAL':
                wsData.push(['Summary']);
                wsData.push(['Metric', 'Value']);
                wsData.push(['Total Revenue', data.totalRevenue]);
                wsData.push(['Total Subscriptions', data.totalSubscriptions]);
                wsData.push([]);
                wsData.push(['Revenue by Plan']);
                wsData.push(['Plan', 'Amount']);
                Object.entries(data.revenueByPlan || {}).forEach(([plan, rev]) => {
                    wsData.push([plan, rev]);
                });
                break;

            case 'MEMBERSHIP':
                wsData.push(['Metric', 'Value']);
                wsData.push(['Total Clients', data.totalClients]);
                wsData.push(['Active Members', data.activeMembers]);
                wsData.push(['New Members', data.newMembers]);
                wsData.push(['Retention Rate', `${data.retentionRate.toFixed(2)}%`]);
                break;

            case 'ATTENDANCE':
                wsData.push(['Total Check-ins', data.totalCheckins]);
                wsData.push(['Peak Hour', data.peakHour]);
                wsData.push([]);
                wsData.push(['Daily Breakdown']);
                wsData.push(['Date', 'Count']);
                Object.entries(data.checkinsByDate || {}).forEach(([date, count]) => {
                    wsData.push([date, count]);
                });
                break;

            case 'TAX':
                wsData.push(['TAX SUMMARY']);
                wsData.push(['Metric', 'Amount (HNL)']);
                wsData.push(['Total Revenue', data.taxSummary.totalRevenue]);
                wsData.push(['Taxable Revenue', data.taxSummary.taxableRevenue]);
                wsData.push(['Exempt Revenue', data.taxSummary.exemptRevenue]);
                wsData.push(['IVA Collected', data.taxSummary.ivaCollected]);
                wsData.push(['IVA Paid', data.taxSummary.ivaPaid]);
                wsData.push(['Net Tax', data.taxSummary.netTax]);
                wsData.push([]);
                wsData.push(['TRANSACTION DETAILS']);
                wsData.push(['Client Name', 'Amount', 'IVA', 'Date', 'Service']);
                data.details.clientTransactions.forEach((t: any) => {
                    wsData.push([t.clientName, t.amount, t.iva, t.date, t.service]);
                });
                wsData.push([]);
                wsData.push(['LEGAL ASSISTANCE & SAR GUIDANCE (2025)']);
                wsData.push(['Source', 'Guidance']);
                wsData.push(['SAR ISV Guide', 'Verify calculations against official Sworn Declaration forms.']);
                wsData.push(['Generalities 2025', '15% ISV applies to all standard memberships and physical products.']);
                wsData.push(['Tax Credits Guide', 'Ensure input vat credits are properly documented to be deductible.']);
                wsData.push(['Internal Control', 'Maintain ledger of daily sales to reconcile with SAR monthly reports.']);
                break;
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    async generateCSVReport(config: ReportConfig, data: any, startDate: string, endDate: string): Promise<Blob> {
        let csv = '';

        // Add disclaimer for tax reports
        if (config.type === 'TAX') {
            csv += '⚠️ UNOFFICIAL DOCUMENT - FOR INFORMATIONAL PURPOSES ONLY ⚠️\n';
            csv += 'NOT VALID FOR OFFICIAL TAX FILING OR LEGAL USE\n';
            csv += 'Consult with a certified accountant for official tax filing\n\n';
        }

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

            case 'TAX':
                csv += 'Tax Summary\n';
                csv += 'Metric,Amount (HNL)\n';
                csv += `Total Revenue,${data.taxSummary.totalRevenue.toFixed(2)}\n`;
                csv += `Taxable Revenue,${data.taxSummary.taxableRevenue.toFixed(2)}\n`;
                csv += `Exempt Revenue,${data.taxSummary.exemptRevenue.toFixed(2)}\n`;
                csv += `IVA Collected,${data.taxSummary.ivaCollected.toFixed(2)}\n`;
                csv += `IVA Paid,${data.taxSummary.ivaPaid.toFixed(2)}\n`;
                csv += `Net Tax,${data.taxSummary.netTax.toFixed(2)}\n\n`;

                csv += 'Client Transactions\n';
                csv += 'Client Name,Amount (HNL),IVA (HNL),Date,Service\n';
                data.details.clientTransactions.forEach((trans: any) => {
                    csv += `${trans.clientName},${trans.amount.toFixed(2)},${trans.iva.toFixed(2)},${trans.date},${trans.service}\n`;
                });

                csv += '\n⚠️ DISCLAIMER: This is NOT an official tax declaration ⚠️\n';
                break;
        }

        return new Blob([csv], { type: 'text/csv' });
    },

    generateTextReport(config: ReportConfig, data: any, startDate: string, endDate: string): string {
        let text = '';

        // Add disclaimer for tax reports
        if (config.type === 'TAX') {
            text += '═══════════════════════════════════════════════════════════════\n';
            text += '                    ⚠️  UNOFFICIAL DOCUMENT  ⚠️\n';
            text += '           FOR INFORMATIONAL PURPOSES ONLY\n';
            text += '     NOT VALID FOR OFFICIAL TAX FILING OR LEGAL USE\n';
            text += '═══════════════════════════════════════════════════════════════\n\n';
        }

        text += `${config.name}\n`;
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

            case 'TAX':
                text += `TAX SUMMARY:\n`;
                text += `Total Revenue: L ${data.taxSummary.totalRevenue.toFixed(2)}\n`;
                text += `Taxable Revenue: L ${data.taxSummary.taxableRevenue.toFixed(2)}\n`;
                text += `Exempt Revenue: L ${data.taxSummary.exemptRevenue.toFixed(2)}\n`;
                text += `IVA Collected: L ${data.taxSummary.ivaCollected.toFixed(2)}\n`;
                text += `IVA Paid: L ${data.taxSummary.ivaPaid.toFixed(2)}\n`;
                text += `Net Tax: L ${data.taxSummary.netTax.toFixed(2)}\n\n`;

                text += `CLIENT TRANSACTIONS:\n`;
                data.details.clientTransactions.forEach((trans: any, index: number) => {
                    text += `  ${index + 1}. ${trans.clientName} - L ${trans.amount.toFixed(2)} (IVA: L ${trans.iva.toFixed(2)})\n`;
                });

                text += `\n\n═══════════════════════════════════════════════════════════════\n`;
                text += '                    ⚠️  DISCLAIMER  ⚠️\n';
                text += '  This document is generated for internal review purposes only.\n';
                text += '  It is NOT an official tax declaration and should NOT be\n';
                text += '  submitted to SAR (Servicio de Administración de Rentas).\n';
                text += '  Consult with a certified accountant for official tax filing.\n';
                text += '═══════════════════════════════════════════════════════════════\n';
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
