"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { workoutService, Exercise } from "@/lib/services/workoutService";
import { Plus, ArrowLeft, Search, Dumbbell } from "lucide-react";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    const [newExercise, setNewExercise] = useState({
        name: "",
        category: "Strength",
        muscleGroup: "Chest",
        videoUrl: ""
    });

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        const data = await workoutService.getExercises();
        setExercises(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExercise.name) return;

        await workoutService.createExercise(newExercise);

        setNewExercise({ name: "", category: "Strength", muscleGroup: "Chest", videoUrl: "" });
        setShowForm(false);
        loadExercises();
    };

    const filtered = exercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "All" || ex.muscleGroup === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-blue-500">Exercise Library</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Add Exercise
                </button>
            </div>

            {showForm && (
                <div className="mb-8 bg-gray-800 p-6 rounded-xl border border-gray-700 animate-in slide-in-from-top-4">
                    <h3 className="text-xl font-semibold mb-4">New Exercise</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                    value={newExercise.name}
                                    onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Muscle Group</label>
                                <select
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                                    value={newExercise.muscleGroup}
                                    onChange={e => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
                                >
                                    {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
                            Save Exercise
                        </button>
                    </form>
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
                <button
                    onClick={() => setFilter("All")}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === "All" ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                    All
                </button>
                {MUSCLE_GROUPS.map(g => (
                    <button
                        key={g}
                        onClick={() => setFilter(g)}
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === g ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                        {g}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(ex => (
                    <div key={ex.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4">
                        <div className="p-3 bg-gray-700 rounded-lg text-gray-300">
                            <Dumbbell size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">{ex.name}</h3>
                            <p className="text-sm text-gray-400">{ex.muscleGroup} • {ex.category}</p>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && !showForm && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No exercises found.
                    </div>
                )}
            </div>
        </div>
    );
}
