import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';

export interface SessionLog {
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    reps: number;
    weight: number;
    notes?: string;
}

export interface Session {
    id: string;
    clientId: string;
    workoutId: string;
    workoutName: string;
    date: string;
    logs: SessionLog[];
    updatedAt: string;
    synced: number;
}

export const sessionService = {
    async logSession(data: Omit<Session, 'id' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const session: Session = {
            ...data,
            id: uuidv4(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };
        await db.add('sessions', session);
        await logEvent('WORKOUT_LOGGED', session);
        return session;
    },

    async getClientSessions(clientId: string) {
        const db = await getDB();
        const sessions = await db.getAllFromIndex('sessions', 'by-client', clientId);
        // Sort by date desc
        return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};
