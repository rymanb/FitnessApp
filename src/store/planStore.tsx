import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlannedExercise, WorkoutPlan } from '@/types';
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import { BACKEND_URL } from '@/utils/helpers';
import { apiFetch } from '@/utils/apiFetch';


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
    syncPlansToCloud: () => Promise<void>;
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
            id: Crypto.randomUUID(),
            name,
            exercises,
            dateCreated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
        };
        const updatedPlans = [...get().savedPlans, newPlan];

        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));

        get().syncPlansToCloud();
    },

    updatePlan: (id, name, exercises) => {
        const updatedPlans = get().savedPlans.map(plan =>
            plan.id === id ? { ...plan, name, exercises, updatedAt: new Date().toISOString() } : plan
        );

        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));

        get().syncPlansToCloud();
    },

    deletePlan: (planId) => {
        const updatedPlans = get().savedPlans.map(plan =>
            plan.id === planId ? {
                ...plan,
                isDeleted: true,
                updatedAt: new Date().toISOString()
            } : plan
        );

        set({ savedPlans: updatedPlans });
        AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updatedPlans));

        get().syncPlansToCloud();
    },

    clearPlans: async () => {
        set({ savedPlans: [] });
        await AsyncStorage.removeItem(STORAGE_KEYS.PLANS);
    },

    syncPlansToCloud: async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            if (!token) return;

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Pull: download server plans and merge using last-write-wins
            const pullResponse = await apiFetch(`${BACKEND_URL}/api/v1/plans`, { headers });
            let mergedPlans = [...get().savedPlans];

            if (pullResponse.ok) {
                const serverPlans: WorkoutPlan[] = await pullResponse.json();

                serverPlans.forEach(serverPlan => {
                    const localIndex = mergedPlans.findIndex(lp => lp.id === serverPlan.id);

                    if (localIndex === -1) {
                        // New plan from another device
                        mergedPlans.push(serverPlan);
                    } else {
                        // Keep whichever version was updated more recently
                        const serverTime = new Date(serverPlan.updatedAt).getTime();
                        const localTime = new Date(mergedPlans[localIndex].updatedAt).getTime();
                        if (serverTime > localTime) {
                            mergedPlans[localIndex] = serverPlan;
                        }
                    }
                });

                set({ savedPlans: mergedPlans });
                AsyncStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(mergedPlans));
            }

            if (mergedPlans.length === 0) return;

            console.log(`Syncing ${mergedPlans.length} plans to backend...`);

            // Push: send merged list back to the server
            const pushResponse = await apiFetch(`${BACKEND_URL}/api/v1/plans/sync`, {
                method: 'POST',
                headers,
                body: JSON.stringify(mergedPlans)
            });

            if (pushResponse.ok) {
                console.log("Plans sync successful.");
            } else {
                console.log("Plans sync rejected:", pushResponse.status);
            }
        } catch (e) {
            console.log("Offline: plans will sync later.");
        }
    }
}));
