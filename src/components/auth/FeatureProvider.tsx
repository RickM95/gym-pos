"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureKey, DEFAULT_FEATURES } from '@/lib/constants/features';
import { getDB } from '@/lib/db';

interface FeatureContextType {
    features: Record<FeatureKey, boolean>;
    isFeatureEnabled: (key: FeatureKey) => boolean;
    updateFeature: (key: FeatureKey, enabled: boolean) => Promise<void>;
    isLoading: boolean;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(() => {
        const initial: any = {};
        Object.entries(DEFAULT_FEATURES).forEach(([key, config]) => {
            initial[key] = config.enabled;
        });
        return initial;
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFeatures = async () => {
            try {
                const db = await getDB();
                const allConfigs = await db.getAll('feature_config');

                if (allConfigs.length > 0) {
                    const mergedFeatures = { ...features };
                    allConfigs.forEach(config => {
                        mergedFeatures[config.id as FeatureKey] = config.enabled;
                    });
                    setFeatures(mergedFeatures);
                }
            } catch (error) {
                console.error('Failed to load feature configs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFeatures();
    }, []);

    const isFeatureEnabled = (key: FeatureKey) => !!features[key];

    const updateFeature = async (key: FeatureKey, enabled: boolean) => {
        try {
            const db = await getDB();
            await db.put('feature_config', {
                id: key,
                enabled,
                updatedAt: new Date().toISOString()
            });
            setFeatures(prev => ({ ...prev, [key]: enabled }));
        } catch (error) {
            console.error('Failed to update feature:', error);
            throw error;
        }
    };

    return (
        <FeatureContext.Provider value={{ features, isFeatureEnabled, updateFeature, isLoading }}>
            {children}
        </FeatureContext.Provider>
    );
};

export const useFeatures = () => {
    const context = useContext(FeatureContext);
    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeatureProvider');
    }
    return context;
};

/**
 * Component to wrap elements that should only be visible if a feature is enabled.
 */
export const FeatureGate: React.FC<{
    feature: FeatureKey;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}> = ({ feature, children, fallback = null }) => {
    const { isFeatureEnabled } = useFeatures();

    if (!isFeatureEnabled(feature)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
