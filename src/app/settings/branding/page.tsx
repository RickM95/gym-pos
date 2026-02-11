"use client";

import React, { useState } from 'react';
import { useBranding } from '@/components/auth/BrandingProvider';
import { THEMES } from '@/lib/constants/branding';
import { Save, Upload, Image as ImageIcon, Palette, Type, Globe } from 'lucide-react';

export default function BrandingSettingsPage() {
    const { config, updateBranding, isLoading } = useBranding();
    const [isSaving, setIsSaving] = useState(false);
    const [localConfig, setLocalConfig] = useState(config);

    // Sync local state when config loads
    React.useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateBranding(localConfig);
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">White-Labeling & Branding</h1>
                    <p className="text-gray-400 mt-1">Customize the platform appearance for your client.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg transition font-medium"
                >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Identity */}
                <div className="space-y-6">
                    <section className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <ImageIcon size={20} />
                            <h2 className="text-lg font-semibold text-white">Visual Identity</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Gym Name</label>
                                <input
                                    type="text"
                                    value={localConfig.gymName}
                                    onChange={e => setLocalConfig({ ...localConfig, gymName: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Logo URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={localConfig.logoUrl || ''}
                                        onChange={e => setLocalConfig({ ...localConfig, logoUrl: e.target.value })}
                                        placeholder="/logo.png"
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                                        <Upload size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Wallpaper URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={localConfig.wallpaperUrl || ''}
                                        onChange={e => setLocalConfig({ ...localConfig, wallpaperUrl: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                                        <Upload size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Watermark Text</label>
                                <input
                                    type="text"
                                    value={localConfig.watermarkText || ''}
                                    onChange={e => setLocalConfig({ ...localConfig, watermarkText: e.target.value })}
                                    placeholder="Spartan Platform"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-400">Logo Scale</label>
                                    <span className="text-xs text-blue-400">{Math.round((localConfig.logoScale || 1.0) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.05"
                                    value={localConfig.logoScale || 1.0}
                                    onChange={e => setLocalConfig({ ...localConfig, logoScale: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                    <span>Compact</span>
                                    <span>Standard</span>
                                    <span>Enlarged</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <Palette size={20} />
                            <h2 className="text-lg font-semibold text-white">Theme Selection</h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.values(THEMES).map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => setLocalConfig({ ...localConfig, themeId: theme.id })}
                                    className={`p-3 rounded-lg border-2 transition text-left h-24 flex flex-col justify-between ${localConfig.themeId === theme.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: theme.primary }}
                                        ></div>
                                        <span className="font-medium text-[11px] text-white truncate">{theme.name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-full h-1 rounded" style={{ backgroundColor: theme.primary }}></div>
                                        <div className="w-full h-1 rounded" style={{ backgroundColor: theme.secondary }}></div>
                                        <div className="w-full h-1 rounded" style={{ backgroundColor: theme.background }}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Live Preview */}
                <div className="sticky top-8 space-y-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-green-400" />
                        Live Preview
                    </h2>

                    <div
                        className="rounded-xl border border-gray-700 shadow-2xl overflow-hidden aspect-video relative flex flex-col"
                        style={{
                            backgroundColor: THEMES[localConfig.themeId]?.background || '#111827',
                            backgroundImage: localConfig.wallpaperUrl ? `url(${localConfig.wallpaperUrl})` : 'none',
                            backgroundSize: 'cover'
                        }}
                    >
                        {/* Preview Header */}
                        <div
                            className="p-3 border-b border-white/5 flex justify-between items-center"
                            style={{ backgroundColor: THEMES[localConfig.themeId]?.secondary + '80' }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-6 h-6 bg-white/20 rounded flex items-center justify-center overflow-hidden transition-transform"
                                    style={{ transform: `scale(${localConfig.logoScale || 1.0})` }}
                                >
                                    {localConfig.logoUrl ? (
                                        <img src={localConfig.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon size={12} />
                                    )}
                                </div>
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">
                                    {localConfig.gymName}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-2 bg-white/10 rounded"></div>
                                <div className="w-4 h-2 bg-white/10 rounded"></div>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 p-4 grid grid-cols-2 gap-3">
                            <div
                                className="p-3 rounded-lg border border-white/5"
                                style={{ backgroundColor: THEMES[localConfig.themeId]?.cardBg + 'cc' }}
                            >
                                <div className="w-1/2 h-2 bg-white/20 rounded mb-2"></div>
                                <div className="w-full h-4 bg-white/10 rounded"></div>
                            </div>
                            <div
                                className="p-3 rounded-lg border border-white/5"
                                style={{ backgroundColor: THEMES[localConfig.themeId]?.cardBg + 'cc' }}
                            >
                                <div className="w-1/2 h-2 bg-white/20 rounded mb-2"></div>
                                <div className="w-full h-4 bg-white/10 rounded"></div>
                            </div>
                        </div>

                        {/* Preview Watermark */}
                        {localConfig.watermarkText && (
                            <div className="absolute bottom-2 right-2 text-[10px] text-white/10 pointer-events-none">
                                {localConfig.watermarkText}
                            </div>
                        )}

                        {/* Overlay to make it feel more like a screen */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-300">
                            <strong>Note:</strong> Changes apply instantly to all users once saved. Wallpapers should be high-resolution for best results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
