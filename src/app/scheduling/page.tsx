"use client";

import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Plus,
    Users,
    Clock,
    MapPin,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal
} from 'lucide-react';
import { FeatureGate } from '@/components/auth/FeatureProvider';
import { FeatureKey } from '@/lib/constants/features';
import { schedulingService, GymClass, Booking } from '@/lib/services/schedulingService';
import { staffService } from '@/lib/services/staffService';
import { clientService } from '@/lib/services/clientService';

export default function SchedulingPage() {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await schedulingService.getClasses('main-gym'); // TODO: Support multi-location
            setClasses(data as any);
        } catch (error) {
            console.error('Failed to load classes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Helper function to extract time from ISO string
    const formatTime = (isoString: string) => {
        if (!isoString) return '--:--';
        try {
            return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '--:--';
        }
    };

    // Filter classes for the selected date's day of week
    const currentDayOfWeek = new Date(selectedDate).getDay();
    const todaysClasses = classes.filter(c => 
        (c.schedule?.daysOfWeek?.includes(currentDayOfWeek) || false) && 
        c.status === 'ACTIVE'
    );

    return (
        <FeatureGate feature={FeatureKey.SCHEDULING} fallback={
            <div className="p-8 text-center bg-gray-900 min-h-screen flex flex-col items-center justify-center">
                <CalendarIcon size={64} className="text-gray-700 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Scheduling Module Disabled</h2>
                <p className="text-gray-400 max-w-md">
                    This feature is currently not included in your active plan.
                    Please upgrade to the **PRO** tier in the Module Settings to enable Class Management.
                </p>
            </div>
        }>
            <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Class Schedule</h1>
                        <p className="text-gray-400">Manage gym sessions, bookings, and instructors.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                    >
                        <Plus size={20} />
                        New Class
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar / Calendar Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4">Select Date</h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Classes Today</span>
                                    <span className="text-primary font-bold">{todaysClasses.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Total Capacity</span>
                                    <span className="text-gray-200">{todaysClasses.reduce((acc, curr) => acc + curr.capacity, 0)} spots</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600/10 border border-primary/20 p-6 rounded-2xl">
                            <h4 className="text-primary font-semibold mb-2">Pro Tip</h4>
                            <p className="text-xs text-blue-300 leading-relaxed">
                                Automated WhatsApp reminders are sent 1 hour before the class starts to all confirmed attendees.
                            </p>
                        </div>
                    </div>

                    {/* Main Timeline / List */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : todaysClasses.length === 0 ? (
                            <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-3xl p-20 text-center">
                                <Users size={48} className="text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">No classes scheduled for this day</h3>
                                <p className="text-gray-500 mt-2">Create a new recurring class or select another date.</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="mt-6 text-primary hover:underline font-medium"
                                >
                                    Add your first class →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {todaysClasses
                                    .sort((a, b) => a.startDate.localeCompare(b.startDate))
                                    .map(gymClass => (
                                        <div
                                            key={gymClass.id}
                                            className="group bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 text-center">
                                                    <span className="text-2xl font-bold text-white block">{formatTime(gymClass.startDate)}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{formatTime(gymClass.endDate)}</span>
                                                </div>
                                                <div className="w-px h-12 bg-gray-700 hidden md:block"></div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                                        {gymClass.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                                            <Users size={14} className="text-blue-500" />
                                                            Trainer {gymClass.instructorId}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                                                            <MapPin size={14} className="text-purple-500" />
                                                            Main Studio
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-700 text-[10px] rounded uppercase font-bold tracking-tighter text-gray-300">
                                                            {gymClass.schedule?.category || 'Fitness'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 justify-end mb-1">
                                                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div className="w-[65%] h-full bg-blue-500 rounded-full"></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-300">65%</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 italic">13 of {gymClass.capacity} spots filled</span>
                                                </div>
                                                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium">
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
