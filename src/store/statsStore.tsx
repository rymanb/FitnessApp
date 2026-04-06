import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WgerExercise } from '@/types';

const STORAGE_KEY = '@tracked_exercises';

interface StatsStore {
    trackedExercises: WgerExercise[];
    isLoaded: boolean;
    loadTrackedExercises: () => Promise<void>;
    addTrackedExercise: (exercise: WgerExercise) => void;
    removeTrackedExercise: (exerciseId: number) => void;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
    trackedExercises: [],
    isLoaded: false,

    loadTrackedExercises: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                set({ trackedExercises: JSON.parse(stored), isLoaded: true });
            } else {
                set({ isLoaded: true });
            }
        } catch (e) {
            console.error("Failed to load tracked exercises", e);
            set({ isLoaded: true });
        }
    },

    addTrackedExercise: (exercise) => {
        const current = get().trackedExercises;
        // Prevent duplicates
        if (!current.find(e => e.id === exercise.id)) {
            const updated = [...current, exercise];
            set({ trackedExercises: updated });
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    },

    removeTrackedExercise: (exerciseId) => {
        const updated = get().trackedExercises.filter(e => e.id !== exerciseId);
        set({ trackedExercises: updated });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
}));