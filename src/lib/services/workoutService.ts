import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { logEvent } from '../sync';

export interface Exercise {
    id: string;
    name: string;
    description?: string;
    category: string;
    muscleGroups: string[];
    equipment?: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    mediaUrls?: string[];
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export interface WorkoutExercise {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    notes?: string;
}

export interface Workout {
    id: string;
    name: string;
    description?: string;
    exercises: WorkoutExercise[];
    duration?: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    createdAt: string;
    updatedAt: string;
    synced: number;
}

export const workoutService = {
    // --- EXERCISES ---
    async createExercise(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const now = new Date().toISOString();
        const exercise: Exercise = {
            ...data,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
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
    async createWorkout(data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) {
        const db = await getDB();
        const now = new Date().toISOString();
        const workout: Workout = {
            ...data,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
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
    async assignWorkout(clientId: string, workoutId: string, trainerId: string, notes?: string, locationId: string = 'main-gym') {
        const db = await getDB();
        const now = new Date().toISOString();
        const assignment = {
            id: uuidv4(),
            locationId,
            clientId,
            workoutId,
            assignedBy: trainerId,
            assignedDate: now,
            status: 'PENDING' as const,
            notes,
            synced: 0
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
