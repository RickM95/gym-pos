"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandingConfig, getDB } from '@/lib/db';
import { applyBranding, DEFAULT_BRANDING } from '@/lib/constants/branding';

interface BrandingContextType {
    config: BrandingConfig;
    updateBranding: (updates: Partial<BrandingConfig>) => Promise<void>;
    isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<BrandingConfig>({
        ...DEFAULT_BRANDING,
        id: 'current',
        updatedAt: new Date().toISOString()
    } as BrandingConfig);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const db = await getDB();
                const storedConfig = await db.get('branding_config', 'current');
                if (storedConfig) {
                    setConfig(storedConfig);
                    applyBranding(storedConfig);
                } else {
                    // Initialize with defaults if not exists
                    const initialConfig = {
                        ...DEFAULT_BRANDING,
                        id: 'current',
                        updatedAt: new Date().toISOString()
                    } as BrandingConfig;
                    await db.put('branding_config', initialConfig);
                    applyBranding(initialConfig);
                }
            } catch (error) {
                console.error('Failed to load branding:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBranding();
    }, []);

    const updateBranding = async (updates: Partial<BrandingConfig>) => {
        try {
            const db = await getDB();
            const newConfig = {
                ...config,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await db.put('branding_config', newConfig);
            setConfig(newConfig);
            applyBranding(newConfig);
        } catch (error) {
            console.error('Failed to update branding:', error);
            throw error;
        }
    };

    return (
        <BrandingContext.Provider value={{ config, updateBranding, isLoading }}>
            <div
                className="branding-wrapper min-h-screen"
                style={{
                    backgroundImage: 'var(--bg-wallpaper)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Watermark overlay */}
                {config.watermarkText && (
                    <div className="fixed bottom-4 right-4 text-white/10 text-xs pointer-events-none select-none z-50">
                        {config.watermarkText}
                    </div>
                )}
                {children}
            </div>
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
