import { User } from '../services/authService';

/**
 * Utility to enforce tenant isolation in all database queries.
 * It ensures that every record created or fetched belongs to the current user's company.
 */
export const tenantGuard = {
    /**
     * Enforces companyId on a data object being saved.
     */
    secureData<T extends { companyId: string }>(data: Omit<T, 'companyId'>, user: User): T {
        if (!user.companyId && user.role !== 'TECH') {
            throw new Error('User company context missing.');
        }
        return {
            ...data,
            companyId: user.companyId || 'global'
        } as T;
    },

    /**
     * Filters an array of records by the current user's companyId.
     */
    filterByTenant<T extends { companyId: string }>(records: T[], user: User): T[] {
        if (user.role === 'ADMIN' || user.role === 'TECH' || !user.companyId) {
            // For Platform Admins or cases with no companyId, return all (or specific logic)
            // In a multi-tenant SaaS, Business Owners only see their company.
            if (user.role === 'ADMIN' && user.companyId) {
                return records.filter(r => r.companyId === user.companyId);
            }
            return records;
        }
        return records.filter(r => r.companyId === user.companyId);
    }
};
