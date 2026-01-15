import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';

export interface Exercise {
    id: string;
    name: string;
    category: string; // Strength, Cardio, Flexibility
    muscleGroup: string; // Chest, Back, Legs, etc.
    videoUrl?: string;
    updatedAt: string;
    synced: number;
}

export interface WorkoutExercise {
    id: string; // Ref to Exercise ID
    name: string; // Cached name for display
    sets: number;
    reps: number;
    notes?: string;
}

export interface Workout {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
    updatedAt: string;
    synced: number;
}

export const workoutService = {
    // --- EXERCISES ---
    async createExercise(data: Omit<Exercise, 'id' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const exercise: Exercise = {
            ...data,
            id: uuidv4(),
            updatedAt: new Date().toISOString(),
            synced: 0
        };
        await db.add('exercises', exercise);
        // await logEvent('EXERCISE_CREATED', exercise); // Future: Add to sync types
        return exercise;
    },

    async getExercises() {
        const db = await getDB();
        return db.getAll('exercises');
    },

    // --- WORKOUTS ---
    async createWorkout(name: string, exercises: WorkoutExercise[]) {
        const db = await getDB();
        const workout: Workout = {
            id: uuidv4(),
            name,
            exercises,
            updatedAt: new Date().toISOString(),
            synced: 0
        };
        await db.add('workouts', workout);
        // await logEvent('WORKOUT_CREATED', workout); // Future: Add to sync types
        return workout;
    },

    async getWorkouts() {
        const db = await getDB();
        return db.getAll('workouts');
    },

    // --- ASSIGNMENTS ---
    async assignWorkout(clientId: string, workoutId: string, trainerId: string, notes?: string) {
        const db = await getDB();
        const assignment = {
            id: uuidv4(),
            clientId,
            workoutId,
            assignedBy: trainerId,
            assignedAt: new Date().toISOString(),
            notes
        };
        await db.add('workout_assignments', assignment);
        return assignment;
    },

    async getAssignedWorkouts(clientId: string) {
        const db = await getDB();
        const assignments = await db.getAllFromIndex('workout_assignments', 'by-client', clientId);

        // Manual Join to get details
        const details = await Promise.all(assignments.map(async (a) => {
            const workout = await db.get('workouts', a.workoutId);
            return {
                ...a,
                workoutName: workout ? workout.name : 'Unknown Workout',
                exercises: workout ? workout.exercises : []
            };
        }));

        return details;
    }
};
