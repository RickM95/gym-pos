import { BrandingConfig } from '../db';

/**
 * Theme definitions for the dashboard.
 */
export interface Theme {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBg: string;
}

export const THEMES: Record<string, Theme> = {
    black: {
        id: 'black',
        name: 'Spartan Black',
        primary: '#3b82f6', // blue-500
        secondary: '#1f2937', // gray-800
        accent: '#60a5fa',
        background: '#111827', // gray-900
        text: '#ffffff',
        cardBg: '#1f2937'
    },
    pink: {
        id: 'pink',
        name: 'Neon Pink',
        primary: '#ec4899', // pink-500
        secondary: '#3d0a24',
        accent: '#f472b6',
        background: '#1a0511',
        text: '#ffffff',
        cardBg: '#2d0a1c'
    },
    red: {
        id: 'red',
        name: 'Warrior Red',
        primary: '#ef4444', // red-500
        secondary: '#450a0a',
        accent: '#f87171',
        background: '#1a0505',
        text: '#ffffff',
        cardBg: '#2d0a10'
    },
    blue: {
        id: 'blue',
        name: 'Deep Blue',
        primary: '#2563eb', // blue-600
        secondary: '#1e3a8a',
        accent: '#3b82f6',
        background: '#0f172a',
        text: '#ffffff',
        cardBg: '#1e293b'
    },
    green: {
        id: 'green',
        name: 'Forest Green',
        primary: '#10b981', // emerald-500
        secondary: '#064e3b',
        accent: '#34d399',
        background: '#022c22',
        text: '#ffffff',
        cardBg: '#064e3b'
    },
    gold: {
        id: 'gold',
        name: 'Royal Gold',
        primary: '#fbbf24',
        secondary: '#451a03',
        accent: '#fcd34d',
        background: '#1c0a00',
        text: '#ffffff',
        cardBg: '#451a03'
    },
    purple: {
        id: 'purple',
        name: 'Midnight Purple',
        primary: '#8b5cf6',
        secondary: '#2e1065',
        accent: '#a78bfa',
        background: '#0f0720',
        text: '#ffffff',
        cardBg: '#2e1065'
    },
    amber: {
        id: 'amber',
        name: 'Cyber Amber',
        primary: '#f59e0b',
        secondary: '#451a03',
        accent: '#fbbf24',
        background: '#0c0a09',
        text: '#ffffff',
        cardBg: '#1c1917'
    },
    silver: {
        id: 'silver',
        name: 'Steel Silver',
        primary: '#94a3b8',
        secondary: '#334155',
        accent: '#cbd5e1',
        background: '#0f172a',
        text: '#ffffff',
        cardBg: '#1e293b'
    },
    orange: {
        id: 'orange',
        name: 'Orange Crush',
        primary: '#f97316',
        secondary: '#7c2d12',
        accent: '#fb923c',
        background: '#1c0a05',
        text: '#ffffff',
        cardBg: '#2d0f0a'
    },
    grape: {
        id: 'grape',
        name: 'Grape Soda',
        primary: '#a855f7',
        secondary: '#581c87',
        accent: '#c084fc',
        background: '#160a2a',
        text: '#ffffff',
        cardBg: '#2e1065'
    },
    lime: {
        id: 'lime',
        name: 'Electric Lime',
        primary: '#84cc16',
        secondary: '#365314',
        accent: '#bef264',
        background: '#0a1a05',
        text: '#ffffff',
        cardBg: '#1a2e05'
    },
    desert: {
        id: 'desert',
        name: 'Desert Sand',
        primary: '#d97706',
        secondary: '#78350f',
        accent: '#f59e0b',
        background: '#1a0d05',
        text: '#ffffff',
        cardBg: '#451a03'
    }
};

export const DEFAULT_BRANDING: Omit<BrandingConfig, 'updatedAt'> = {
    id: 'current',
    gymName: 'Spartan Gym',
    themeId: 'black',
    watermarkText: 'Spartan Platform',
    logoUrl: '/logo.png',
    logoScale: 1.0,
};

/**
 * Injects CSS variables into the document root based on branding config.
 */
export const applyBranding = (config: BrandingConfig) => {
    if (typeof document === 'undefined') return;

    const theme = THEMES[config.themeId] || THEMES.black;
    const root = document.documentElement;

    root.style.setProperty('--primary-color', config.primaryColor || theme.primary);
    root.style.setProperty('--secondary-color', config.secondaryColor || theme.secondary);
    root.style.setProperty('--accent-color', config.accentColor || theme.accent);
    root.style.setProperty('--bg-color', theme.background);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--card-bg-color', theme.cardBg);
    root.style.setProperty('--logo-scale', (config.logoScale || 1.0).toString());

    if (config.wallpaperUrl) {
        root.style.setProperty('--bg-wallpaper', `url(${config.wallpaperUrl})`);
    } else {
        root.style.removeProperty('--bg-wallpaper');
    }
};
