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
            locationId: 'main-gym', // In real usage, get from client or context
            type: payload.type,
            title: payload.type.replace('_', ' '),
            message: payload.message,
            status: 'SENT' as const,
            scheduledFor: payload.scheduledFor || new Date().toISOString(),
            sentAt: payload.scheduledFor ? undefined : new Date().toISOString(),
            metadata: { channel: payload.channel },
            createdAt: new Date().toISOString(),
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
        const allNotifications = await db.getAll('notifications');
        const now = new Date();

        for (const notif of allNotifications) {
            // Process notifications that haven't been sent yet (sentAt undefined) and are scheduled for now or earlier
            if (!notif.sentAt && new Date(notif.scheduledFor) <= now) {
                try {
                    const channel = notif.metadata?.channel || 'WHATSAPP';
                    if (channel === 'WHATSAPP') {
                        await this.sendWhatsApp(notif.message);
                    } else {
                        await this.sendEmail(notif.message);
                    }

                    notif.sentAt = new Date().toISOString();
                    notif.status = 'SENT';
                } catch (error) {
                    notif.status = 'FAILED';
                    notif.metadata = { ...notif.metadata, error: (error as Error).message };
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
