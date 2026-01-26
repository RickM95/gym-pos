import { getDB } from '../db';
import { logEvent } from '../sync';

export interface Expense {
    id: string;
    description: string;
    category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'EQUIPMENT' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'LOAN' | 'OTHER';
    amount: number;
    originalAmount?: number; // For LOAN category
    interestRate?: number;    // For LOAN category (percentage)
    date: string;
    vendor?: string;
    invoiceNumber?: string;
    paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT';
    receipts?: string[];
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface RevenueAnalytics {
    id: string;
    period: string;
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    date: string;
    membershipRevenue: number;
    productSales: number;
    servicesRevenue: number;
    totalRevenue: number;
    operatingExpenses: number;
    netProfit: number;
    memberCount: number;
    newMembers: number;
    canceledMembers: number;
    averageRevenuePerMember: number;
    customerAcquisitionCost: number;
    lifetimeValue: number;
    created: string;
    synced: number;
}

export interface BusinessMetrics {
    totalRevenue: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    profitMargin: number;
    memberCount: number;
    newMembersThisMonth: number;
    memberChurnRate: number;
    averageRevenuePerMember: number;
    customerAcquisitionCost: number;
    lifetimeValue: number;
    breakEvenPoint: number;
    cashFlow: number;
    inventoryTurnover: number;
    grossMargin: number;
}

export const analyticsService = {
    // --- EXPENSES ---
    async getExpenses(startDate?: string, endDate?: string, category?: string): Promise<Expense[]> {
        const db = await getDB();
        let expenses: Expense[] = [];

        // Optimize: Use indexed query if dates are provided
        if (startDate && endDate) {
            const range = IDBKeyRange.bound(startDate, endDate);
            expenses = await db.getAllFromIndex('expenses', 'by-date', range);
        } else if (startDate) {
            const range = IDBKeyRange.lowerBound(startDate);
            expenses = await db.getAllFromIndex('expenses', 'by-date', range);
        } else if (endDate) {
            const range = IDBKeyRange.upperBound(endDate);
            expenses = await db.getAllFromIndex('expenses', 'by-date', range);
        } else {
            expenses = await db.getAll('expenses');
        }

        // Filter by category if provided (not indexed for now, but usually smaller set)
        if (category) {
            expenses = expenses.filter(e => e.category === category);
        }

        return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Expense> {
        const db = await getDB();
        const id = `EXP-${Date.now()}`;
        const now = new Date().toISOString();

        const newExpense: Expense = {
            ...expense,
            id,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.add('expenses', newExpense);
        await logEvent('EXPENSE_CREATED', newExpense);

        return newExpense;
    },

    async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
        const db = await getDB();
        const expense = await db.get('expenses', id);
        if (!expense) throw new Error('Expense not found');

        const updatedExpense = {
            ...expense,
            ...data,
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('expenses', updatedExpense);
        await logEvent('EXPENSE_UPDATED', updatedExpense);

        return updatedExpense;
    },

    /**
     * Calculates the current debt for a specific loan based on payments made.
     * Debt = (Original Amount * (1 + Interest Rate/100)) - Total Payments
     */
    async calculateLoanDebt(description: string, originalAmount: number, interestRate: number): Promise<number> {
        const db = await getDB();
        // Get all expenses matching this description (to track payments)
        const expenses = await db.getAll('expenses');
        const payments = expenses
            .filter(e => e.category === 'LOAN' && e.description === description)
            .reduce((sum, e) => sum + e.amount, 0);

        const totalWithInterest = originalAmount * (1 + (interestRate / 100));
        return Math.max(0, totalWithInterest - payments);
    },

    // --- REVENUE ANALYTICS ---
    async getRevenueAnalytics(periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'MONTHLY', limit: number = 12): Promise<RevenueAnalytics[]> {
        const db = await getDB();
        const analytics = await db.getAllFromIndex('revenue_analytics', 'by-period', periodType);
        return analytics
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);
    },

    async calculateRevenueAnalytics(date: string, periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'): Promise<RevenueAnalytics> {
        const db = await getDB();

        // Calculate date range based on period type
        const endDate = new Date(date);
        const startDate = new Date(date);

        switch (periodType) {
            case 'DAILY':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'WEEKLY':
                startDate.setDate(startDate.getDate() - startDate.getDay());
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'MONTHLY':
                startDate.setDate(1);
                endDate.setMonth(endDate.getMonth() + 1, 0);
                break;
            case 'YEARLY':
                startDate.setMonth(0, 1);
                endDate.setMonth(11, 31);
                break;
        }

        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();

        // Get all relevant data
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const sales = await db.getAll('sales');
        const expenses: Expense[] = await db.getAll('expenses');
        const clients = await db.getAll('clients');
        const checkins = await db.getAll('checkins');

        // Calculate membership revenue
        let membershipRevenue = 0;
        subscriptions.forEach(sub => {
            if (sub.startDate >= startDateStr && sub.startDate <= endDateStr) {
                const plan = plans.find(p => p.id === sub.planId);
                if (plan) {
                    membershipRevenue += plan.price;
                }
            }
        });

        // Calculate product sales revenue
        let productSales = 0;
        sales.forEach(sale => {
            if (sale.saleDate >= startDateStr && sale.saleDate <= endDateStr) {
                productSales += sale.total;
            }
        });

        // Calculate operating expenses
        let operatingExpenses = 0;
        expenses.forEach(expense => {
            if (expense.date >= startDateStr && expense.date <= endDateStr) {
                operatingExpenses += expense.amount;
            }
        });

        const totalRevenue = membershipRevenue + productSales;
        const netProfit = totalRevenue - operatingExpenses;

        // Calculate membership metrics
        const activeMembers = subscriptions.filter(sub => {
            const endDate = new Date(sub.endDate);
            return endDate > new Date();
        }).length;

        const newMembers = clients.filter(client => {
            const joinDate = new Date(client.updatedAt);
            return joinDate >= startDate && joinDate <= endDate;
        }).length;

        // Calculate other metrics
        const averageRevenuePerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0;
        const customerAcquisitionCost = newMembers > 0 ? operatingExpenses / newMembers : 0;
        const lifetimeValue = averageRevenuePerMember * 12; // Assuming 12 months avg membership

        const period = `${startDateStr.split('T')[0]}_${endDateStr.split('T')[0]}`;

        const analytics: RevenueAnalytics = {
            id: `REV-${Date.now()}`,
            period,
            periodType,
            date: startDateStr,
            membershipRevenue,
            productSales,
            servicesRevenue: 0, // Would include personal training, etc.
            totalRevenue,
            operatingExpenses,
            netProfit,
            memberCount: activeMembers,
            newMembers,
            canceledMembers: 0, // Would need to track cancellations
            averageRevenuePerMember,
            customerAcquisitionCost,
            lifetimeValue,
            created: new Date().toISOString(),
            synced: 0
        };

        await db.add('revenue_analytics', analytics);
        return analytics;
    },

    // --- BUSINESS METRICS ---
    async getBusinessMetrics(): Promise<BusinessMetrics> {
        const db = await getDB();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthStr = startOfMonth.toISOString();

        // Get data for calculations
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const sales = await db.getAll('sales');
        const expenses: Expense[] = await db.getAll('expenses');
        const clients = await db.getAll('clients');
        const products = await db.getAll('products');

        // Calculate monthly revenue
        let monthlyRevenue = 0;
        subscriptions.forEach(sub => {
            if (sub.startDate >= startOfMonthStr) {
                const plan = plans.find(p => p.id === sub.planId);
                if (plan) monthlyRevenue += plan.price;
            }
        });

        sales.forEach(sale => {
            if (sale.saleDate >= startOfMonthStr) {
                monthlyRevenue += sale.total;
            }
        });

        // Calculate total revenue
        let totalRevenue = 0;
        subscriptions.forEach(sub => {
            const plan = plans.find(p => p.id === sub.planId);
            if (plan) totalRevenue += plan.price;
        });
        sales.forEach(sale => totalRevenue += sale.total);

        // Calculate monthly expenses
        const monthlyExpenses = expenses
            .filter(e => e.date >= startOfMonthStr)
            .reduce((sum, e) => sum + e.amount, 0);

        const monthlyProfit = monthlyRevenue - monthlyExpenses;
        const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

        // Calculate membership metrics
        const activeMembers = subscriptions.filter(sub => {
            const endDate = new Date(sub.endDate);
            return endDate > now;
        }).length;

        const newMembersThisMonth = clients.filter(client => {
            const joinDate = new Date(client.updatedAt);
            return joinDate >= startOfMonth;
        }).length;

        // Calculate inventory metrics
        const inventoryValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
        const inventoryTurnover = monthlyRevenue / Math.max(1, inventoryValue);

        // Calculate other metrics
        const averageRevenuePerMember = activeMembers > 0 ? monthlyRevenue / activeMembers : 0;
        const customerAcquisitionCost = newMembersThisMonth > 0 ? monthlyExpenses / newMembersThisMonth : 0;
        const lifetimeValue = averageRevenuePerMember * 12; // 12 months assumption

        // Calculate break-even (fixed monthly costs / contribution margin)
        const fixedCosts = monthlyExpenses * 0.7; // Assuming 70% of expenses are fixed
        const contributionMargin = 0.4; // Assuming 40% contribution margin
        const breakEvenPoint = fixedCosts / Math.max(0.01, contributionMargin);

        // Calculate gross margin
        const costOfGoodsSold = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
        const grossMargin = totalRevenue > 0 ? ((totalRevenue - costOfGoodsSold) / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            monthlyRevenue,
            monthlyExpenses,
            monthlyProfit,
            profitMargin,
            memberCount: activeMembers,
            newMembersThisMonth,
            memberChurnRate: 0, // Would need to track cancellations
            averageRevenuePerMember,
            customerAcquisitionCost,
            lifetimeValue,
            breakEvenPoint,
            cashFlow: monthlyProfit,
            inventoryTurnover,
            grossMargin
        };
    },

    // --- PEAK HOURS ANALYSIS ---
    async getPeakHoursAnalysis(days: number = 30): Promise<any> {
        const db = await getDB();
        const checkins = await db.getAll('checkins');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filteredCheckins = checkins.filter(c =>
            new Date(c.timestamp) >= cutoffDate
        );

        const hourCounts = new Array(24).fill(0);
        const dayCounts: Record<string, number> = {
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0,
            'Sunday': 0
        };

        filteredCheckins.forEach(checkin => {
            const date = new Date(checkin.timestamp);
            const hour = date.getHours();
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

            hourCounts[hour]++;
            dayCounts[dayName]++;
        });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakDay = Object.entries(dayCounts).reduce((a, b) =>
            dayCounts[a[0]] > dayCounts[b[0]] ? a : b
        )[0];

        return {
            hourlyDistribution: hourCounts.map((count, hour) => ({
                hour: `${hour}:00`,
                count,
                percentage: ((count / filteredCheckins.length) * 100).toFixed(1)
            })),
            dailyDistribution: Object.entries(dayCounts).map(([day, count]) => ({
                day,
                count,
                percentage: ((count / filteredCheckins.length) * 100).toFixed(1)
            })),
            peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
            peakDay,
            totalCheckins: filteredCheckins.length,
            averageDaily: (filteredCheckins.length / days).toFixed(1)
        };
    },

    // --- MEMBER RETENTION ANALYSIS ---
    async getMemberRetentionAnalysis(): Promise<any> {
        const db = await getDB();
        const subscriptions = await db.getAll('subscriptions');
        const clients = await db.getAll('clients');
        const checkins = await db.getAll('checkins');

        // Calculate retention by cohort (month of joining)
        const cohorts = new Map<string, { joined: number; active: number; churned: number }>();

        clients.forEach(client => {
            const joinMonth = new Date(client.updatedAt).toISOString().slice(0, 7); // YYYY-MM
            const cohort = cohorts.get(joinMonth) || { joined: 0, active: 0, churned: 0 };
            cohort.joined++;

            // Check if still active
            const activeSubscription = subscriptions.find(sub =>
                sub.clientId === client.id &&
                new Date(sub.endDate) > new Date()
            );

            if (activeSubscription) {
                cohort.active++;
            } else {
                cohort.churned++;
            }

            cohorts.set(joinMonth, cohort);
        });

        // Calculate overall retention rate
        const totalMembers = clients.length;
        const activeMembers = subscriptions.filter(sub =>
            new Date(sub.endDate) > new Date()
        ).length;
        const overallRetentionRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

        return {
            overallRetentionRate: overallRetentionRate.toFixed(2),
            totalMembers,
            activeMembers,
            churnedMembers: totalMembers - activeMembers,
            cohortAnalysis: Array.from(cohorts.entries()).map(([month, data]) => ({
                month,
                joined: data.joined,
                active: data.active,
                churned: data.churned,
                retentionRate: data.joined > 0 ? ((data.active / data.joined) * 100).toFixed(2) : '0'
            })).sort((a, b) => b.month.localeCompare(a.month))
        };
    },

    // --- CASH FLOW PROJECTIONS ---
    async getCashFlowProjections(months: number = 6): Promise<any> {
        const db = await getDB();
        const subscriptions = await db.getAll('subscriptions');
        const plans = await db.getAll('plans');
        const expenses: Expense[] = await db.getAll('expenses');

        // Calculate average monthly revenue and expenses
        const now = new Date();
        const projections = [];

        for (let i = 0; i < months; i++) {
            const projectionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const projectionMonth = projectionDate.toISOString().slice(0, 7);

            // Projected revenue from recurring memberships
            let projectedRevenue = 0;
            subscriptions.forEach(sub => {
                const endDate = new Date(sub.endDate);
                if (endDate >= projectionDate) {
                    const plan = plans.find(p => p.id === sub.planId);
                    if (plan) {
                        projectedRevenue += plan.price;
                    }
                }
            });

            // Average monthly expenses
            const avgMonthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) / Math.max(1, 12);

            // Add seasonal adjustments (basic example)
            const seasonalMultiplier = this.getSeasonalMultiplier(projectionDate.getMonth());
            projectedRevenue *= seasonalMultiplier;

            projections.push({
                month: projectionMonth,
                projectedRevenue: Math.round(projectedRevenue),
                projectedExpenses: Math.round(avgMonthlyExpenses),
                projectedCashFlow: Math.round(projectedRevenue - avgMonthlyExpenses),
                cumulativeCashFlow: 0 // Will be calculated below
            });
        }

        // Calculate cumulative cash flow
        let cumulative = 0;
        projections.forEach(projection => {
            cumulative += projection.projectedCashFlow;
            projection.cumulativeCashFlow = cumulative;
        });

        return {
            projections,
            assumptions: {
                seasonalAdjustments: true,
                expenseGrowthRate: 0.02, // 2% monthly growth
                membershipGrowthRate: 0.01 // 1% monthly growth
            }
        };
    },

    getSeasonalMultiplier(month: number): number {
        // Basic seasonal adjustments for gym industry
        const seasonalFactors = {
            0: 1.2,  // January - New Year's resolutions
            1: 1.1,  // February
            2: 1.0,  // March
            3: 0.9,  // April - Spring
            4: 0.8,  // May - Pre-summer
            5: 0.7,  // June - Summer
            6: 0.7,  // July - Summer
            7: 0.8,  // August - Back to school
            8: 1.0,  // September
            9: 1.1,  // October
            10: 1.1, // November - Pre-holidays
            11: 1.2  // December - Holidays
        };
        return seasonalFactors[month as keyof typeof seasonalFactors] || 1.0;
    }
};