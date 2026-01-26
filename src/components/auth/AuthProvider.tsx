"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService, User } from "@/lib/services/authService";
import LoadingSpinner from "../ui/LoadingSpinner";

import LockScreen from "./LockScreen";

interface AuthContextType {
    user: User | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    unlock: (pin: string) => Promise<boolean>;
    setIsLocked: (locked: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => false,
    logout: () => { },
    isLoading: true,
    unlock: async () => false,
    setIsLocked: () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('[AuthProvider] Initializing authentication system...');
                await authService.initialize();
                console.log('[AuthProvider] Auth service initialized successfully');

                const storedUser = authService.getUser();
                if (storedUser) {
                    console.log('[AuthProvider] Found stored user:', storedUser.name, storedUser.role);
                } else {
                    console.log('[AuthProvider] No stored user found');
                }
                setUser(storedUser);
            } catch (error) {
                console.error('[AuthProvider] Failed to initialize auth:', error);
                setInitError(error instanceof Error ? error.message : 'Failed to initialize authentication');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [user, isLoading, pathname, router]);

    useEffect(() => {
        if (!user || user.role === 'CLIENT') return;

        let timer: NodeJS.Timeout;

        const resetTimer = () => {
            if (isLocked) return;
            clearTimeout(timer);
            timer = setTimeout(() => {
                setIsLocked(true);
            }, 5 * 60 * 1000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);

        resetTimer();

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
        };
    }, [user, isLocked]);

    const login = async (pin: string) => {
        try {
            console.log('[AuthProvider] Attempting login with PIN...');
            const u = await authService.login(pin);
            if (u) {
                console.log('[AuthProvider] Login successful:', u.name, u.role);
                setUser(u);
                setIsLocked(false);
                router.push('/');
                return true;
            }
            console.log('[AuthProvider] Login failed: Invalid PIN');
            return false;
        } catch (error) {
            console.error('[AuthProvider] Login error:', error);
            return false;
        }
    };

    const logout = () => {
        console.log('[AuthProvider] Logging out user');
        authService.logout();
        setUser(null);
        setIsLocked(false);
        router.push('/login');
    };

    const unlock = async (pin: string) => {
        try {
            const unlockingUser = await authService.login(pin);
            if (unlockingUser && unlockingUser.id === user?.id) {
                setIsLocked(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Unlock error:', error);
            return false;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
                <LoadingSpinner fullPage message="Initializing Spartan Gym..." />
                {initError && (
                    <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg max-w-md z-[10000]">
                        <p className="text-red-200 font-bold">Initialization Error</p>
                        <p className="text-red-300 text-sm mt-1">{initError}</p>
                    </div>
                )}
            </div>
        );
    }

    if (!user && pathname !== '/login') {
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, unlock, setIsLocked }}>
            {isLocked && user && (
                <LockScreen user={user} onUnlock={unlock} onSignOut={logout} />
            )}
            <div className={isLocked ? 'blur-sm pointer-events-none select-none' : ''}>
                {children}
            </div>
        </AuthContext.Provider>
    );
}
