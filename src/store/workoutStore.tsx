import { create } from 'zustand';
import { WorkoutPlan, PlannedExercise, WgerExercise } from '@/types';
import { generateId } from '@/utils/helpers';
import * as Notifications from 'expo-notifications';
import { useHistoryStore } from './historyStore';

interface WorkoutStore {
    activeWorkout: WorkoutPlan | null;
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    startWorkout: (plan: WorkoutPlan) => void;
    finishWorkout: () => void;
    
    addActiveExercise: (exercise: WgerExercise) => void;
    removeActiveExercise: (exerciseId: string) => void;
    addActiveSet: (exerciseId: string) => void;
    removeActiveSet: (exerciseId: string, setId: string) => void;
    updateActiveSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => void;
    toggleActiveSetStatus: (exerciseId: string, setId: string) => Promise<void>;

    restEndTime: number | null; 
    timerNotificationId: string | null; 
    startRestTimer: (seconds: number) => Promise<void>;
    stopRestTimer: () => Promise<void>;

}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
    activeWorkout: null,
    isExpanded: false,
    restEndTime: null,
    timerNotificationId: null,

    setIsExpanded: (val) => set({ isExpanded: val }),
    
    startWorkout: (plan) => set({ 
        activeWorkout: JSON.parse(JSON.stringify(plan)),
        isExpanded: true 
    }),
    
    finishWorkout: async () => {
        const state = get();

        if (state.activeWorkout) {
            await useHistoryStore.getState().logWorkout(
                state.activeWorkout.id,
                state.activeWorkout.name,
                state.activeWorkout.exercises
            );
        }

        if (state.timerNotificationId) {
            await Notifications.cancelScheduledNotificationAsync(state.timerNotificationId);
        }

        set({ activeWorkout: null, isExpanded: false, restEndTime: null, timerNotificationId: null});
    },

    addActiveExercise: (exercise) => set((state) => {
        if (!state.activeWorkout) return state;
        const newEx: PlannedExercise = {
            uniqueId: generateId(),
            wgerData: exercise,
            sets: [{ id: generateId(), weight: '', reps: '', completed: false }],
        };
        return { activeWorkout: { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, newEx] } };
    }),

    removeActiveExercise: (exerciseId) => set((state) => {
        if (!state.activeWorkout) return state;
        return { 
            activeWorkout: { 
                ...state.activeWorkout, 
                exercises: state.activeWorkout.exercises.filter(ex => ex.uniqueId !== exerciseId) 
            } 
        };
    }),

    addActiveSet: (exerciseId) => set((state) => {
        if (!state.activeWorkout) return state;
        return {
            activeWorkout: {
                ...state.activeWorkout,
                exercises: state.activeWorkout.exercises.map(ex => {
                    if (ex.uniqueId === exerciseId) {
                        const lastSet = ex.sets[ex.sets.length - 1];
                        return { 
                            ...ex, 
                            sets: [...ex.sets, { id: generateId(), weight: lastSet?.weight || '', reps: lastSet?.reps || '', completed: false }] 
                        };
                    }
                    return ex;
                })
            }
        };
    }),

    removeActiveSet: (exerciseId, setId) => set((state) => {
        if (!state.activeWorkout) return state;
        return {
            activeWorkout: {
                ...state.activeWorkout,
                exercises: state.activeWorkout.exercises.map(ex => 
                    ex.uniqueId === exerciseId 
                        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } 
                        : ex
                )
            }
        };
    }),

    updateActiveSet: (exerciseId, setId, field, value) => set((state) => {
        if (!state.activeWorkout) return state;
        return {
            activeWorkout: {
                ...state.activeWorkout,
                exercises: state.activeWorkout.exercises.map(ex => 
                    ex.uniqueId === exerciseId 
                        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) } 
                        : ex
                )
            }
        };
    }),

    startRestTimer: async (seconds) => {
        const state = get();
        
        if (state.timerNotificationId) {
            await Notifications.cancelScheduledNotificationAsync(state.timerNotificationId);
        }

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Rest is over! 🔔',
                body: "Time for your next set. Let's get it!",
                sound: true,
            },
            trigger: { 
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
                seconds: seconds,
                repeats: false 
            },
        });

        set({ 
            restEndTime: Date.now() + seconds * 1000, 
            timerNotificationId: id 
        });
    },

    stopRestTimer: async () => {
        const state = get();
        if (state.timerNotificationId) {
            await Notifications.cancelScheduledNotificationAsync(state.timerNotificationId);
        }
        set({ restEndTime: null, timerNotificationId: null });
    },

    toggleActiveSetStatus: async (exerciseId, setId) => {
        const state = get();
        if (!state.activeWorkout) return;
        
        let newlyCompleted = false;

        const updatedExercises = state.activeWorkout.exercises.map(ex => 
            ex.uniqueId === exerciseId 
                ? { ...ex, sets: ex.sets.map(s => {
                    if (s.id === setId) {
                        newlyCompleted = !s.completed; 
                        return { ...s, completed: newlyCompleted };
                    }
                    return s;
                }) } 
                : ex
        );

        set({ activeWorkout: { ...state.activeWorkout, exercises: updatedExercises } });

        if (newlyCompleted) {
            await get().startRestTimer(10);
        }
    },

}));