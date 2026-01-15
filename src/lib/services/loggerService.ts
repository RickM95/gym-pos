import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { User } from './authService';

export interface LogEntry {
    id: string;
    type: 'ERROR' | 'BUG_REPORT';
    message: string;
    details?: string;
    user: string;
    role: string;
    timestamp: number;
    status: 'OPEN' | 'RESOLVED';
}

export const loggerService = {
    async logError(error: Error | string, user: User | null, details?: string) {
        const db = await getDB();
        const entry: LogEntry = {
            id: uuidv4(),
            type: 'ERROR',
            message: typeof error === 'string' ? error : error.message,
            details: details || (error instanceof Error ? error.stack : undefined),
            user: user ? user.name : 'Anonymous',
            role: user ? user.role : 'UNKNOWN',
            timestamp: Date.now(),
            status: 'OPEN'
        };
        await db.put('logs', entry);
        console.error("Logged Error:", entry);
    },

    async reportBug(message: string, user: User | null, details?: string) {
        const db = await getDB();
        const entry: LogEntry = {
            id: uuidv4(),
            type: 'BUG_REPORT',
            message,
            details,
            user: user ? user.name : 'Anonymous',
            role: user ? user.role : 'UNKNOWN',
            timestamp: Date.now(),
            status: 'OPEN'
        };
        await db.put('logs', entry);
    },

    async getLogs(): Promise<LogEntry[]> {
        const db = await getDB();
        return await db.getAllFromIndex('logs', 'by-timestamp');
    }
};
