import { getDB } from '../db';

export interface GymClass {
    id: string;
    locationId: string;
    name: string;
    description?: string;
    instructorId: string;
    instructorName: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    daysOfWeek: number[]; // 0-6
    capacity: number;
    category: string;
    isActive: boolean;
}

export interface Booking {
    id: string;
    classId: string;
    clientId: string;
    date: string; // ISO Date YYYY-MM-DD
    status: 'CONFIRMED' | 'CANCELLED' | 'WAITLIST' | 'ATTENDED';
}

/**
 * Service to manage gym classes and member bookings.
 */
export const schedulingService = {
    async createClass(gymClass: Omit<GymClass, 'id'>): Promise<GymClass> {
        const db = await getDB();
        const newClass = {
            ...gymClass,
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
            synced: 0
        } as any;
        await db.put('classes', newClass);
        return newClass;
    },

    async getClasses(locationId: string): Promise<GymClass[]> {
        const db = await getDB();
        return await db.getAllFromIndex('classes', 'by-location', locationId);
    },

    async createBooking(classId: string, clientId: string, date: string): Promise<Booking> {
        const db = await getDB();

        // Check capacity
        const classData = await db.get('classes', classId);
        if (!classData) throw new Error('Class not found');

        const existingBookings = await db.getAllFromIndex('bookings', 'by-class', classId);
        const dateBookings = existingBookings.filter(b => b.date === date && b.status !== 'CANCELLED');

        if (dateBookings.length >= classData.capacity) {
            throw new Error('Class is full for this date');
        }

        const booking: Booking = {
            id: crypto.randomUUID(),
            classId,
            clientId,
            date,
            status: 'CONFIRMED'
        };

        await db.put('bookings', { ...booking, synced: 0, updatedAt: new Date().toISOString() } as any);
        return booking;
    },

    async getMemberBookings(clientId: string): Promise<Booking[]> {
        const db = await getDB();
        return await db.getAllFromIndex('bookings', 'by-client', clientId);
    }
};
