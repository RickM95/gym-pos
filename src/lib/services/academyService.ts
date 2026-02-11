import { getDB } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const academyService = {
    /**
     * Tracks progress for a gym owner in the Spartan Academy.
     */
    async trackProgress(ownerId: string, courseId: string, progress: number) {
        const db = await getDB();
        const id = `${ownerId}_${courseId}`;
        const record = {
            id,
            ownerId,
            courseId,
            progress,
            updatedAt: new Date().toISOString()
        };
        await db.put('academy_progress', record as any);
    },

    /**
     * Gets available courses (Simulated catalog).
     */
    async getCourses() {
        return [
            { id: 'c1', title: 'Gym Profitability 101', tier: 'BASIC', lessons: 5 },
            { id: 'c2', title: 'Advanced Staff Incentives', tier: 'PRO', lessons: 8 },
            { id: 'c3', title: 'Scaling to Multiple Locations', tier: 'ENTERPRISE', lessons: 12 }
        ];
    },

    /**
     * Gets progress for an owner.
     */
    async getOwnerProgress(ownerId: string) {
        const db = await getDB();
        return await db.getAllFromIndex('academy_progress', 'by-owner', ownerId);
    }
};
