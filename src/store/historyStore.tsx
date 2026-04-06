import { create } from 'zustand';
import { CompletedWorkout } from '@/types';
import { insertWorkout, getWorkoutHistory, getUnsyncedWorkouts, markWorkoutsAsSynced, clearWorkoutHistory } from '@/db/database';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { BACKEND_URL } from '@/utils/helpers';
import { apiFetch } from '@/utils/apiFetch';

interface HistoryStore {
    workoutHistory: CompletedWorkout[];
    isHistoryLoaded: boolean;
    loadHistory: () => Promise<void>;
    logWorkout: (planId: string, planName: string, exercises: any[], durationSeconds: number) => Promise<void>;
    syncHistoryToCloud: () => Promise<void>;
    clearHistory: () => Promise<void>;
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

    logWorkout: async (planId, planName, exercises, durationSeconds) => {
        // Only log sets that were actually completed
        const cleanedExercises = exercises.map(ex => ({
            ...ex,
            sets: ex.sets.filter((s: any) => s.completed === true)
        })).filter(ex => ex.sets.length > 0);

        if (cleanedExercises.length === 0) return;

        const completedLog: CompletedWorkout = {
            id: Crypto.randomUUID(),
            planId,
            planName,
            dateCompleted: new Date().toISOString(),
            durationSeconds,
            exercises: cleanedExercises,
        };

        try {
            await insertWorkout(completedLog);
            set({workoutHistory: [completedLog, ...get().workoutHistory]});
            console.log("Workout saved to DB.");
            get().syncHistoryToCloud();
        } catch (e) {
            console.log("Failed to save workout to DB: ", e);
        }
    },

    clearHistory: async () => {
        try {
            await clearWorkoutHistory();
            set({ workoutHistory: [] });
        } catch (e) {
            console.log("Failed to clear history: ", e);
        }
    },

    syncHistoryToCloud: async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            if (!token) return;

            const { workoutHistory } = get();

            // Pull: only fetch workouts newer than the most recent local record
            let pullUrl = `${BACKEND_URL}/api/v1/history`;
            if (workoutHistory.length > 0) {
                const latestDate = workoutHistory[0].dateCompleted;
                pullUrl += `?after=${encodeURIComponent(latestDate)}`;
            }

            const pullResponse = await apiFetch(pullUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (pullResponse.ok) {
                const newServerRecords: CompletedWorkout[] = await pullResponse.json();

                if (newServerRecords.length > 0) {
                    console.log(`Received ${newServerRecords.length} new workouts from server.`);

                    for (const record of newServerRecords) {
                        // Mark as synced so we don't immediately push them back
                        await insertWorkout(record, true);
                    }
                    await get().loadHistory();
                }
            }

            // Push: only send workouts that haven't been synced yet
            const unsyncedWorkouts = await getUnsyncedWorkouts();

            if (unsyncedWorkouts.length === 0) {
                console.log("No new local workouts to push.");
                return;
            }

            const syncPayload = unsyncedWorkouts.map(workout => ({
                id: workout.id,
                planId: workout.planId,
                planName: workout.planName,
                dateCompleted: workout.dateCompleted,
                durationSeconds: workout.durationSeconds,
                exercises: workout.exercises,
                updatedAt: workout.dateCompleted,
                isDeleted: false
            }));

            console.log(`Pushing ${syncPayload.length} new workouts to backend...`);

            const pushResponse = await apiFetch(`${BACKEND_URL}/api/v1/history/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(syncPayload)
            });

            if (pushResponse.ok) {
                const syncedIds = unsyncedWorkouts.map(w => w.id);
                await markWorkoutsAsSynced(syncedIds);
                console.log("History sync successful.");
            } else {
                console.log("History sync rejected:", pushResponse.status);
            }

        } catch (e) {
            console.error("History sync error:", e);
        }
    }
}))
