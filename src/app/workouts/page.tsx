"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { workoutService, Workout } from "@/lib/services/workoutService";
import { Plus, ArrowLeft, ClipboardList } from "lucide-react";
import Navigation from "@/components/navigation/Navigation";

export default function WorkoutsPage() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);

    useEffect(() => {
        loadWorkouts();
    }, []);

    const loadWorkouts = async () => {
        const data = await workoutService.getWorkouts();
        setWorkouts(data);
    };

    return (
        <div className="flex h-screen bg-gray-900">
            <Navigation />

            <div className="flex-1 lg:ml-0 overflow-auto">
                <div className="min-h-screen text-white p-6 pt-20 lg:pt-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                                <ArrowLeft size={20} /> Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-blue-500">Workouts</h1>
                            <Link href="/workouts/create">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                    <Plus size={20} /> Build Workout
                                </button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workouts.map(w => (
                                <div key={w.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition cursor-pointer group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                                            <ClipboardList size={24} />
                                        </div>
                                        <span className="text-sm text-gray-500">{w.exercises.length} Exercises</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{w.name}</h3>
                                    <ul className="text-sm text-gray-400 space-y-1">
                                        {w.exercises.slice(0, 3).map((ex, i) => (
                                            <li key={i}>• {ex.name} ({ex.sets}x{ex.reps})</li>
                                        ))}
                                        {w.exercises.length > 3 && <li>... +{w.exercises.length - 3} more</li>}
                                    </ul>
                                </div>
                            ))}

                            {workouts.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-800">
                                    <p className="mb-4">No workout templates yet.</p>
                                    <Link href="/workouts/create" className="text-blue-500 hover:underline">Create your first workout</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
