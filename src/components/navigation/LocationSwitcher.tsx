"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react';
import { getDB, Location } from '@/lib/db';
import { useFeatures } from '@/components/auth/FeatureProvider';
import { FeatureKey } from '@/lib/constants/features';

export function LocationSwitcher() {
    const { features } = useFeatures();
    const [locations, setLocations] = useState<Location[]>([]);
    const [currentLocation, setCurrentLocation] = useState<string>('main-gym');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        const db = await getDB();
        const data = await db.getAll('locations');
        if (data.length === 0) {
            // Seed default location
            const defaultLoc = {
                id: 'main-gym',
                name: 'Main Branch',
                isActive: true,
                updatedAt: new Date().toISOString(),
                synced: 0
            } as any;
            await db.put('locations', defaultLoc);
            setLocations([defaultLoc]);
        } else {
            setLocations(data as any);
        }
    };

    if (!features[FeatureKey.MULTI_LOCATION]) return null;

    const activeLoc = locations.find(l => l.id === currentLocation) || locations[0];

    return (
        <div className="relative border-b border-gray-800 pb-4 mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition border border-gray-700/50"
            >
                <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                    <MapPin size={16} />
                </div>
                <div className="flex-1 text-left">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Branch Location</p>
                    <p className="text-sm font-bold text-white truncate">{activeLoc?.name}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => {
                                    setCurrentLocation(loc.id);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition"
                            >
                                <span className={`text-sm ${currentLocation === loc.id ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>
                                    {loc.name}
                                </span>
                                {currentLocation === loc.id && <Check size={14} className="text-blue-400" />}
                            </button>
                        ))}
                        <button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-900/50 hover:bg-gray-700 transition border-t border-gray-700 text-xs text-blue-400 font-medium">
                            <Plus size={14} />
                            Add New Location
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
