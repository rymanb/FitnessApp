import { create } from 'zustand';
import { CompletedWorkout } from '@/types';
import { generateId } from '@/utils/helpers';
import { insertWorkout, getWorkoutHistory } from '@/db/database';

interface HistoryStore {
    workoutHistory: CompletedWorkout[];
    isHistoryLoaded: boolean;
    loadHistory: () => Promise<void>;
    logWorkout: (planId: string, planName: string, exercises: any[]) => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
    workoutHistory: [],
    isHistoryLoaded: false,

    loadHistory: async () => {
        try {
            const history = await getWorkoutHistory();
            set({workoutHistory: history, isHistoryLoaded: true});
        } catch (e) {
            console.log('Failed to load history: ', e);
            set({isHistoryLoaded: false});
        }
    },

    logWorkout: async (planId, planName, exercises) => {
        const cleanedExercises = exercises.map(ex => ({
            ...ex,
            sets: ex.sets.filter((s: any) => s.completed === true) 
        })).filter(ex => ex.sets.length > 0);

        if (cleanedExercises.length === 0) return;

        const completedLog: CompletedWorkout = {
            id: generateId(),
            planId,
            planName,
            dateCompleted: new Date(). toISOString(),
            exercises: cleanedExercises,
        };

        try {
            await insertWorkout(completedLog);

            set({workoutHistory: [completedLog, ...get().workoutHistory]});

            console.log("Workout Saved to DB");
        } catch (e) {
            console.log("Failed to save workout to DB: ", e);
        }
    }
}))