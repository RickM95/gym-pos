"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { workoutService, Exercise, WorkoutExercise } from "@/lib/services/workoutService";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";

export default function CreateWorkoutPage() {
    const router = useRouter();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [name, setName] = useState("");
    const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        const data = await workoutService.getExercises();
        setExercises(data);
    };

    const addExercise = (ex: Exercise) => {
        setSelectedExercises([
            ...selectedExercises,
            { id: ex.id, name: ex.name, sets: 3, reps: 10 }
        ]);
        setIsAdding(false);
    };

    const removeExercise = (index: number) => {
        const newList = [...selectedExercises];
        newList.splice(index, 1);
        setSelectedExercises(newList);
    };

    const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
        const newList = [...selectedExercises];
        // @ts-ignore
        newList[index][field] = value;
        setSelectedExercises(newList);
    };

    const handleSave = async () => {
        if (!name || selectedExercises.length === 0) return;
        await workoutService.createWorkout(name, selectedExercises);
        router.push("/workouts");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/workouts" className="text-gray-400 hover:text-white flex items-center gap-2">
                        <ArrowLeft size={20} /> Back
                    </Link>
                    <h1 className="text-3xl font-bold text-blue-500">Builder</h1>
                    <button
                        onClick={handleSave}
                        disabled={!name || selectedExercises.length === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Save size={20} /> Save
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Workout Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Full Body Blast"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-lg focus:outline-none focus:border-blue-500"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        {selectedExercises.map((ex, i) => (
                            <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4 animate-in slide-in-from-bottom-2">
                                <GripVertical className="text-gray-600 cursor-move" size={20} />
                                <div className="flex-1">
                                    <div className="font-bold mb-2">{ex.name}</div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400">Sets</span>
                                            <input
                                                type="number"
                                                className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-center"
                                                value={ex.sets}
                                                onChange={e => updateExercise(i, 'sets', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400">Reps</span>
                                            <input
                                                type="number"
                                                className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-center"
                                                value={ex.reps}
                                                onChange={e => updateExercise(i, 'reps', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeExercise(i)} className="text-gray-500 hover:text-red-500">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {isAdding ? (
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search exercises..."
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-2"
                            />
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {exercises.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => addExercise(ex)}
                                        className="w-full text-left p-2 hover:bg-gray-700 rounded flex justify-between"
                                    >
                                        <span>{ex.name}</span>
                                        <span className="text-sm text-gray-500">{ex.muscleGroup}</span>
                                    </button>
                                ))}
                                {exercises.length === 0 && <div className="p-2 text-gray-500">Library empty. Go create exercises first.</div>}
                            </div>
                            <button onClick={() => setIsAdding(false)} className="w-full mt-2 text-center text-sm text-red-400 p-2">Cancel</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition flex justify-center items-center gap-2"
                        >
                            <Plus size={20} /> Add Exercise
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
