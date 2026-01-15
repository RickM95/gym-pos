"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clientAuthService, ClientAuth } from "@/lib/services/clientAuthService";
import { clientService } from "@/lib/services/clientService";

export interface ClientUser {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    auth: ClientAuth;
}

interface ClientAuthContextType {
    clientUser: ClientUser | null;
    isLoading: boolean;
    error: string | null;
    signUp: (clientId: string, password: string, pin: string) => Promise<boolean>;
    signIn: (clientId: string, credentials: { password?: string; pin?: string; authMethod: 'password' | 'pin' }) => Promise<boolean>;
    signInWithBiometric: (clientId: string) => Promise<boolean>;
    signOut: () => void;
    updateCredentials: (updates: { password?: string; pin?: string }) => Promise<boolean>;
    clearError: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
    clientUser: null,
    isLoading: true,
    error: null,
    signUp: async () => false,
    signIn: async () => false,
    signInWithBiometric: async () => false,
    signOut: () => {},
    updateCredentials: async () => false,
    clearError: () => {}
});

export const useClientAuth = () => useContext(ClientAuthContext);

const CLIENT_SESSION_KEY = 'gym_platform_client_user';

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
    const [clientUser, setClientUser] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initializeClientAuth = async () => {
            try {
                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem(CLIENT_SESSION_KEY);
                    if (stored) {
                        const parsed = JSON.parse(stored) as ClientUser;
                        // Verify the session is still valid
                        const auth = await clientAuthService.getClientAuth(parsed.id);
                        if (auth) {
                            setClientUser(parsed);
                        } else {
                            localStorage.removeItem(CLIENT_SESSION_KEY);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize client auth:', error);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(CLIENT_SESSION_KEY);
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeClientAuth();
    }, []);

    const signUp = async (clientId: string, password: string, pin: string): Promise<boolean> => {
        try {
            setError(null);
            
            // Check if client exists
            const client = await clientService.getClient(clientId);
            if (!client) {
                setError('Client ID not found. Please register at the front desk first.');
                return false;
            }

            // Check if auth already exists
            const hasAuth = await clientAuthService.hasClientAuth(clientId);
            if (hasAuth) {
                setError('Account already exists. Please sign in.');
                return false;
            }

            await clientAuthService.createClientAuth(clientId, password, pin);
            
            // Auto sign in after successful registration
            const result = await clientAuthService.authenticateClient({
                clientId,
                password,
                authMethod: 'password'
            });

            if (result) {
                const clientUserData: ClientUser = {
                    id: result.client.id,
                    name: result.client.name,
                    email: result.client.email,
                    phone: result.client.phone,
                    photoUrl: result.client.photoUrl,
                    auth: result.auth
                };

                setClientUser(clientUserData);
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(clientUserData));
                }

                router.push('/client/dashboard');
                return true;
            }

            return false;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            setError(message);
            return false;
        }
    };

    const signIn = async (clientId: string, credentials: { password?: string; pin?: string; authMethod: 'password' | 'pin' }): Promise<boolean> => {
        try {
            setError(null);
            
            const result = await clientAuthService.authenticateClient({
                clientId,
                ...credentials
            });

            if (result) {
                const clientUserData: ClientUser = {
                    id: result.client.id,
                    name: result.client.name,
                    email: result.client.email,
                    phone: result.client.phone,
                    photoUrl: result.client.photoUrl,
                    auth: result.auth
                };

                setClientUser(clientUserData);
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(clientUserData));
                }

                router.push('/client/dashboard');
                return true;
            }

            return false;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign in failed';
            setError(message);
            return false;
        }
    };

    const signInWithBiometric = async (clientId: string): Promise<boolean> => {
        try {
            setError(null);
            
            // Check if WebAuthn is supported
            if (!window.navigator.credentials) {
                setError('Biometric authentication not supported on this device');
                return false;
            }

            // In a real implementation, this would use WebAuthn API
            // For now, we'll simulate it
            const result = await clientAuthService.authenticateClient({
                clientId,
                authMethod: 'biometric'
            });

            if (result) {
                const clientUserData: ClientUser = {
                    id: result.client.id,
                    name: result.client.name,
                    email: result.client.email,
                    phone: result.client.phone,
                    photoUrl: result.client.photoUrl,
                    auth: result.auth
                };

                setClientUser(clientUserData);
                
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(clientUserData));
                }

                router.push('/client/dashboard');
                return true;
            }

            return false;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Biometric authentication failed';
            setError(message);
            return false;
        }
    };

    const signOut = () => {
        setClientUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CLIENT_SESSION_KEY);
        }
        router.push('/client/login');
    };

    const updateCredentials = async (updates: { password?: string; pin?: string }): Promise<boolean> => {
        try {
            setError(null);
            
            if (!clientUser) {
                setError('No active session');
                return false;
            }

            await clientAuthService.updateClientAuth(clientUser.id, updates);
            
            // Update local state
            const updatedAuth = await clientAuthService.getClientAuth(clientUser.id);
            if (updatedAuth) {
                setClientUser(prev => prev ? { ...prev, auth: updatedAuth } : null);
            }

            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Update failed';
            setError(message);
            return false;
        }
    };

    const clearError = () => setError(null);

    // Redirect logic for client-specific routes
    useEffect(() => {
        if (!isLoading) {
            const isClientRoute = pathname.startsWith('/client/');
            const isAuthRoute = pathname === '/client/login' || pathname === '/client/signup';
            
            if (!clientUser && isClientRoute && !isAuthRoute) {
                router.push('/client/login');
            } else if (clientUser && isAuthRoute) {
                router.push('/client/dashboard');
            }
        }
    }, [clientUser, isLoading, pathname, router]);

    return (
        <ClientAuthContext.Provider value={{
            clientUser,
            isLoading,
            error,
            signUp,
            signIn,
            signInWithBiometric,
            signOut,
            updateCredentials,
            clearError
        }}>
            {children}
        </ClientAuthContext.Provider>
    );
}