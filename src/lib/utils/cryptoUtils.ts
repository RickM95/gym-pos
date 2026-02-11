/**
 * Cryptographic utilities for secure credential handling.
 * Uses Web Crypto API for browser compatibility and performance.
 */

export const cryptoUtils = {
    /**
     * Hashes a string (e.g., PIN or Password) using SHA-256.
     * Note: For real passwords, bcrypt/argon2 on a server is preferred, 
     * but for local PINs and PWA offline security, SHA-256 with a salt is a massive improvement over plaintext.
     */
    async hashCredential(value: string, salt: string = 'spartan-gym-v1'): Promise<string> {
        const msgUint8 = new TextEncoder().encode(value + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    /**
     * Verifies a value against a stored hash.
     */
    async verifyCredential(value: string, storedHash: string, salt?: string): Promise<boolean> {
        const hash = await this.hashCredential(value, salt);
        return hash === storedHash;
    }
};
