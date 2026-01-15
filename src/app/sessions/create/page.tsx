"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientService, Client } from "@/lib/services/clientService";
import { workoutService, Workout, WorkoutExercise } from "@/lib/services/workoutService";
import { sessionService, SessionLog } from "@/lib/services/sessionService";
import { ArrowLeft, User, ClipboardList, CheckCircle, Save } from "lucide-react";

export default function CreateSessionPage() {
    const router = useRouter();

    // Steps: 0=SelectClient, 1=SelectWorkout, 2=LogData
    const [step, setStep] = useState(0);

    const [clients, setClients] = useState<Client[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

    // Map of exerciseIndex -> Array of sets
    const [logs, setLogs] = useState<Record<string, SessionLog[]>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [c, w] = await Promise.all([
            clientService.getClients(),
            workoutService.getWorkouts()
        ]);
        setClients(c);
        setWorkouts(w);
    };

    const handleSelectWorkout = (workout: Workout) => {
        setSelectedWorkout(workout);

        // Initialize logs based on workout template
        const initialLogs: Record<string, SessionLog[]> = {};
        workout.exercises.forEach((ex, exIndex) => {
            initialLogs[ex.id] = Array.from({ length: ex.sets }).map((_, setIndex) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                setNumber: setIndex + 1,
                reps: ex.reps, // Default to target
                weight: 0,
                notes: ex.notes
            }));
        });
        setLogs(initialLogs);
        setStep(2);
    };

    const updateLog = (exId: string, setIndex: number, field: keyof SessionLog, value: any) => {
        const newLogs = { ...logs };
        // @ts-ignore
        newLogs[exId][setIndex][field] = value;
        setLogs(newLogs);
    };

    const handleSave = async () => {
        if (!selectedClient || !selectedWorkout) return;

        // Flatten logs
        const flatLogs: SessionLog[] = Object.values(logs).flat();

        await sessionService.logSession({
            clientId: selectedClient.id,
            workoutId: selectedWorkout.id,
            workoutName: selectedWorkout.name,
            date: new Date().toISOString(),
            logs: flatLogs
        });

        router.push(`/clients/${selectedClient.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Cancel
                </Link>
                <h1 className="text-2xl font-bold text-blue-500">Log Workout</h1>
                <div className="w-8"></div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Step 1: Select Client */}
                {step === 0 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><User /> Select Client</h2>
                        <div className="grid gap-2">
                            {clients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => { setSelectedClient(client); setStep(1); }}
                                    className="text-left p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition"
                                >
                                    <div className="font-bold">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.email || 'No email'}</div>
                                </button>
                            ))}
                            {clients.length === 0 && <div className="p-4 text-gray-500">No clients found.</div>}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Workout */}
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <button onClick={() => setStep(0)} className="text-sm text-gray-400 hover:text-white">&larr; Change Client ({selectedClient?.name})</button>
                        <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList /> Select Template</h2>
                        <div className="grid gap-2">
                            {workouts.map(workout => (
                                <button
                                    key={workout.id}
                                    onClick={() => handleSelectWorkout(workout)}
                                    className="text-left p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition"
                                >
                                    <div className="font-bold">{workout.name}</div>
                                    <div className="text-sm text-gray-500">{workout.exercises.length} Exercises</div>
                                </button>
                            ))}
                            {workouts.length === 0 && <div className="p-4 text-gray-500">No templates found. Go create one first.</div>}
                        </div>
                    </div>
                )}

                {/* Step 3: Log Data */}
                {step === 2 && selectedWorkout && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{selectedWorkout.name}</h2>
                                <p className="text-sm text-gray-400">Client: {selectedClient?.name}</p>
                            </div>
                            <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                            >
                                <Save size={20} /> Finish
                            </button>
                        </div>

                        <div className="space-y-6">
                            {selectedWorkout.exercises.map((ex) => (
                                <div key={ex.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <h3 className="font-bold mb-3 text-lg text-blue-400">{ex.name}</h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-6 gap-2 text-xs text-gray-500 text-center mb-1">
                                            <div className="col-span-1">Set</div>
                                            <div className="col-span-2">Weight (lbs)</div>
                                            <div className="col-span-2">Reps</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {logs[ex.id]?.map((log, setIndex) => (
                                            <div key={setIndex} className="grid grid-cols-6 gap-2 items-center">
                                                <div className="col-span-1 text-center font-mono text-gray-400">{setIndex + 1}</div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-center"
                                                        value={log.weight}
                                                        onChange={e => updateLog(ex.id, setIndex, 'weight', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-center"
                                                        value={log.reps}
                                                        onChange={e => updateLog(ex.id, setIndex, 'reps', parseFloat(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-1 text-center text-green-500">
                                                    <CheckCircle size={16} className="mx-auto" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
