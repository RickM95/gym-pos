import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { cryptoUtils } from '../utils/cryptoUtils';
import { staffService } from './staffService';
import { authService } from './authService';

export const profileService = {
    /**
     * Get profile for current user (staff or platform admin)
     */
    async getProfile(userId: string, userType: 'staff' | 'platform_admin') {
        if (userType === 'staff') {
            return staffService.getStaff(userId);
        } else {
            const { platformAdminService } = await import('./platformAdminService');
            return platformAdminService.getPlatformAdmin(userId);
        }
    },

    /**
     * Update profile information
     */
    async updateProfile(userId: string, userType: 'staff' | 'platform_admin', updates: {
        name?: string;
        email?: string;
        phone?: string;
        photoUrl?: string;
    }) {
        if (userType === 'staff') {
            await staffService.updateStaff(userId, updates);
        } else {
            const { platformAdminService } = await import('./platformAdminService');
            await platformAdminService.updatePlatformAdmin(userId, updates);
        }
    },

    /**
     * Change password/PIN
     */
    async changePassword(userId: string, userType: 'staff' | 'platform_admin', currentPassword: string, newPassword: string): Promise<boolean> {
        if (userType === 'staff') {
            const db = await getDB();
            const staff = await db.get('staff', userId);

            if (!staff) {
                throw new Error('Staff member not found');
            }

            // Verify current password
            const isValid = await cryptoUtils.verifyCredential(currentPassword, staff.pin);
            if (!isValid) {
                return false;
            }

            // Update with new password
            const hashedPin = await cryptoUtils.hashCredential(newPassword);
            await staffService.updateStaff(userId, { pin: hashedPin });
            return true;
        } else {
            const { platformAdminService } = await import('./platformAdminService');
            return platformAdminService.changePassword(userId, currentPassword, newPassword);
        }
    },

    /**
     * Upload and update profile photo
     */
    async updateProfilePhoto(userId: string, userType: 'staff' | 'platform_admin', photoDataUrl: string): Promise<string> {
        // In a real app, this would upload to cloud storage
        // For now, we'll store the data URL directly
        const photoUrl = photoDataUrl;

        await this.updateProfile(userId, userType, { photoUrl });

        // Update current session
        const user = authService.getUser();
        if (user && user.id === userId) {
            user.photoUrl = photoUrl;
            if (typeof window !== 'undefined') {
                localStorage.setItem('gym_platform_user', JSON.stringify(user));
            }
        }

        return photoUrl;
    }
};
