import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlannedExercise, WorkoutPlan } from '@/types';
import { generateId } from '@/utils/helpers';

const STORAGE_KEYS = {
    PLANS: '@workout_plans'
};

interface PlanStore {
    savedPlans: WorkoutPlan[];
    isDataLoaded: boolean;
    loadPlans: () => Promise<void>;
    savePlan: (name: string, exercises: PlannedExercise[]) => void;
    updatePlan: (id: string, name: string, exercises: PlannedExercise[]) => void;
    deletePlan: (planId: string) => void;
    clearPlans: () => Promise<void>;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
    savedPlans: [],
    isDataLoaded: false,

    loadPlans: async () => {
        try {
            const plansVal = await AsyncStorage.getItem(STORAGE_KEYS.PLANS);
            if (plansVal) {
                set({ savedPlans: JSON.parse(plansVal), isDataLoaded: true });
            } else {
                set({ isDataLoaded: true });
            }
        } catch (e) {
            console.error('Failed to load plans: ', e);
            set({ isDataLoaded: true });
        }
    },

    savePlan: (name, exercises) => {
        const newPlan: WorkoutPlan = {
            id: generateId(),
            name,
            exercises,
            dateCreated: new Date().toISOString(),
        };
        const updatedPlans = [...get().savedPlans, newPlan];
        
        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));
    },

    updatePlan: (id, name, exercises) => {
        const updatedPlans = get().savedPlans.map(plan => 
            plan.id === id ? { ...plan, name, exercises } : plan
        );
        
        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));
    },

    deletePlan: (planId) => {
        const updatedPlans = get().savedPlans.filter(p => p.id !== planId);
        
        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));
    },

    clearPlans: async () => {
        set({ savedPlans: [] });
        await AsyncStorage.removeItem(STORAGE_KEYS.PLANS);
    }
}));