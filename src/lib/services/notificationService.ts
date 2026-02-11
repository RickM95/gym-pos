import { getDB, Location } from '../db';
import { FeatureKey } from '../constants/features';

export interface NotificationPayload {
    clientId: string;
    type: 'MEMBERSHIP_EXPIRING' | 'BIRTHDAY' | 'WELCOME' | 'PAYMENT_RECEIPT' | 'CUSTOM';
    channel: 'WHATSAPP' | 'EMAIL';
    message: string;
    scheduledFor?: string;
}

/**
 * Service to handle automated communications via Email and WhatsApp.
 */
export const notificationService = {
    /**
     * Sends a notification immediately or schedules it.
     */
    async sendNotification(payload: NotificationPayload): Promise<void> {
        const db = await getDB();

        // Check if NOTIFICATIONS feature is enabled (in real usage, this would be checked earlier)

        const notification = {
            id: crypto.randomUUID(),
            clientId: payload.clientId,
            locationId: 'default', // In real usage, get from client or context
            type: payload.type,
            channel: payload.channel,
            status: 'PENDING' as const,
            message: payload.message,
            scheduledFor: payload.scheduledFor || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };

        await db.put('notifications', notification);

        // Trigger actual sending logic (mocked for now)
        if (!payload.scheduledFor) {
            await this.processPendingNotifications();
        }
    },

    /**
     * Processes all pending notifications and sends them via external APIs.
     */
    async processPendingNotifications(): Promise<void> {
        const db = await getDB();
        const pending = await db.getAllFromIndex('notifications', 'by-status', 'PENDING');

        const now = new Date();

        for (const notif of pending) {
            if (new Date(notif.scheduledFor) <= now) {
                try {
                    if (notif.channel === 'WHATSAPP') {
                        await this.sendWhatsApp(notif.message);
                    } else {
                        await this.sendEmail(notif.message);
                    }

                    notif.status = 'SENT';
                    notif.sentAt = new Date().toISOString();
                } catch (error) {
                    notif.status = 'FAILED';
                    notif.error = (error as Error).message;
                }

                notif.updatedAt = new Date().toISOString();
                await db.put('notifications', notif);
            }
        }
    },

    /**
     * Mock WhatsApp sending logic.
     * In production, this would call a Meta for Developers API or a 3rd party like Twilio/Wati.
     */
    async sendWhatsApp(message: string): Promise<void> {
        console.log(`[WhatsApp API] Sending: ${message}`);
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 500));
    },

    /**
     * Mock Email sending logic.
     * In production, this would use SendGrid, Resend, or SMTP.
     */
    async sendEmail(message: string): Promise<void> {
        console.log(`[Email API] Sending: ${message}`);
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 500));
    },

    /**
     * Automated trigger for expiring memberships.
     */
    async triggerExpiringReminders(): Promise<void> {
        const db = await getDB();
        const now = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(now.getDate() + 7);

        // This is a simplified scan; in production, use an index on endDate
        const subs = await db.getAll('subscriptions');
        const expiringSoon = subs.filter(s => {
            const end = new Date(s.endDate);
            return s.isActive && end > now && end <= sevenDaysLater;
        });

        for (const sub of expiringSoon) {
            await this.sendNotification({
                clientId: sub.clientId,
                type: 'MEMBERSHIP_EXPIRING',
                channel: 'WHATSAPP',
                message: `Hi! Your Spartan Gym membership expires on ${new Date(sub.endDate).toLocaleDateString()}. Renew now to avoid interruption!`
            });
        }
    }
};
