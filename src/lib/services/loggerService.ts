import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { User } from './authService';

export interface LogEntry {
    id: string;
    type: string;
    message: string;
    data?: any;
    timestamp: string;
    synced: number;
}

export const loggerService = {
    async logError(error: Error | string, user: User | null, details?: string) {
        const db = await getDB();
        const entry: LogEntry = {
            id: uuidv4(),
            type: 'ERROR',
            message: typeof error === 'string' ? error : error.message,
            data: {
                details: details || (error instanceof Error ? error.stack : undefined),
                user: user ? user.name : 'Anonymous',
                role: user ? user.role : 'UNKNOWN',
                status: 'OPEN'
            },
            timestamp: new Date().toISOString(),
            synced: 0
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
            data: {
                details,
                user: user ? user.name : 'Anonymous',
                role: user ? user.role : 'UNKNOWN',
                status: 'OPEN'
            },
            timestamp: new Date().toISOString(),
            synced: 0
        };
        await db.put('logs', entry);
    },

    async getLogs(): Promise<LogEntry[]> {
        const db = await getDB();
        return await db.getAllFromIndex('logs', 'by-timestamp');
    }
};
