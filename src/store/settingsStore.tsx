import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '@/utils/helpers';
import { apiFetch } from '@/utils/apiFetch';
import { ColorScheme } from '@/context/ThemeContext';

const STORAGE_KEY = '@user_settings';

interface SettingsStore {
    restTimersEnabled: boolean;
    setRestSeconds: number;
    exerciseRestSeconds: number;
    theme: ColorScheme;
    updatedAt: string;
    isLoaded: boolean;
    loadSettings: () => Promise<void>;
    setRestTimersEnabled: (val: boolean) => void;
    setSetRestSeconds: (val: number) => void;
    setExerciseRestSeconds: (val: number) => void;
    setTheme: (val: ColorScheme) => void;
    syncSettingsToCloud: () => Promise<void>;
    clearSettings: () => Promise<void>;
}

const persist = (state: Partial<SettingsStore>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        restTimersEnabled: state.restTimersEnabled,
        setRestSeconds: state.setRestSeconds,
        exerciseRestSeconds: state.exerciseRestSeconds,
        theme: state.theme,
        updatedAt: state.updatedAt,
    }));
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    restTimersEnabled: true,
    setRestSeconds: 90,
    exerciseRestSeconds: 120,
    theme: 'dark',
    updatedAt: new Date(0).toISOString(),
    isLoaded: false,

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                set({ ...parsed, isLoaded: true });
            } else {
                set({ isLoaded: true });
            }
        } catch (e) {
            set({ isLoaded: true });
        }
    },

    setRestTimersEnabled: (val) => {
        const updatedAt = new Date().toISOString();
        set({ restTimersEnabled: val, updatedAt });
        persist({ ...get(), restTimersEnabled: val, updatedAt });
        get().syncSettingsToCloud();
    },

    setSetRestSeconds: (val) => {
        const updatedAt = new Date().toISOString();
        set({ setRestSeconds: val, updatedAt });
        persist({ ...get(), setRestSeconds: val, updatedAt });
        get().syncSettingsToCloud();
    },

    setExerciseRestSeconds: (val) => {
        const updatedAt = new Date().toISOString();
        set({ exerciseRestSeconds: val, updatedAt });
        persist({ ...get(), exerciseRestSeconds: val, updatedAt });
        get().syncSettingsToCloud();
    },

    setTheme: (val) => {
        const updatedAt = new Date().toISOString();
        set({ theme: val, updatedAt });
        persist({ ...get(), theme: val, updatedAt });
        get().syncSettingsToCloud();
    },

    clearSettings: async () => {
        set({
            restTimersEnabled: true,
            setRestSeconds: 90,
            exerciseRestSeconds: 120,
            theme: 'dark',
            updatedAt: new Date(0).toISOString(),
        });
        await AsyncStorage.removeItem(STORAGE_KEY);
    },

    syncSettingsToCloud: async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            if (!token) return;

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            // Pull: apply server settings if they are newer than local
            const pullResponse = await apiFetch(`${BACKEND_URL}/api/v1/settings`, { headers });

            if (pullResponse.ok) {
                const server = await pullResponse.json();
                const serverTime = new Date(server.updatedAt).getTime();
                const localTime = new Date(get().updatedAt).getTime();

                if (serverTime > localTime) {
                    const merged = { ...server.data, updatedAt: server.updatedAt };
                    set(merged);
                    persist({ ...get(), ...merged });
                }
            }

            // Push: send local settings to server
            const { restTimersEnabled, setRestSeconds, exerciseRestSeconds, theme, updatedAt } = get();
            await apiFetch(`${BACKEND_URL}/api/v1/settings/sync`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    data: { restTimersEnabled, setRestSeconds, exerciseRestSeconds, theme },
                    updatedAt,
                }),
            });
        } catch (e) {
            console.log("Offline: settings will sync later.");
        }
    },
}));
