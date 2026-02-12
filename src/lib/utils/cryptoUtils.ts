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
        const input = value + salt;

        // Check for secure context (Web Crypto API availability)
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const msgUint8 = new TextEncoder().encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }

        // Fallback for insecure contexts (e.g. accessing via local IP)
        // This is NOT secure for production, but allows development on local IPs
        console.warn('[cryptoUtils] SECURE CONTEXT MISSING: Using development fallback hash. Use localhost or HTTPS for production security.');

        // Simple hex encoding of the string as a "mock" hash for development
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'dev-hash-' + Math.abs(hash).toString(16);
    },

    /**
     * Verifies a value against a stored hash.
     */
    async verifyCredential(value: string, storedHash: string, salt?: string): Promise<boolean> {
        const hash = await this.hashCredential(value, salt);
        return hash === storedHash;
    }
};
