import { getDB } from '../db';

export interface GymClass {
    id: string;
    locationId: string;
    name: string;
    description?: string;
    instructorId: string;
    schedule: any;
    capacity: number;
    enrolled: number;
    status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface Booking {
    id: string;
    classId: string;
    clientId: string;
    date: string; // ISO Date YYYY-MM-DD
    status: 'BOOKED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
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
            status: 'BOOKED',
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('bookings', booking);
        return booking;
    },

    async getMemberBookings(clientId: string): Promise<Booking[]> {
        const db = await getDB();
        return await db.getAllFromIndex('bookings', 'by-client', clientId);
    }
};
