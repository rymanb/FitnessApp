import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { usePlanStore } from '@/store/planStore';
import { useHistoryStore } from '@/store/historyStore';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatsStore } from '@/store/statsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { BACKEND_URL } from '@/utils/helpers';
import { registerRefreshFn } from '@/utils/apiFetch';

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    offlineAccess: true,
});

interface AppContextType {
    user: any | null;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    backendToken: string | null;
}

const AuthContext = createContext<AppContextType | null>(null);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<any | null>(null);
    const [backendToken, setBackendToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Register the silent refresh handler before bootstrapping so any
        // early API calls that 401 can immediately attempt a token refresh.
        registerRefreshFn(silentRefresh);

        const bootstrapAsync = async () => {
            try {
                // Restore cached auth state so the app is usable before network resolves
                const savedToken = await SecureStore.getItemAsync('jwt_token');
                const cachedUser = await AsyncStorage.getItem('@user_profile');

                if (savedToken) setBackendToken(savedToken);
                if (cachedUser) setUser(JSON.parse(cachedUser));
            } catch (e) {
                console.log("Failed to load cached auth state");
            }

            await Promise.all([
                checkUser(),
                usePlanStore.getState().loadPlans(),
                useHistoryStore.getState().loadHistory(),
                useStatsStore.getState().loadTrackedExercises(),
                useSettingsStore.getState().loadSettings(),
            ]);
        };
        bootstrapAsync();
    }, []);

    const logout = async () => {
        try {
            await GoogleSignin.signOut();
        } catch (error) {
            // Google sign-out can fail offline; still wipe local state
            console.log("Google sign out error (Offline):", error);
        } finally {
            setUser(null);
            await AsyncStorage.removeItem('@user_profile');
            await usePlanStore.getState().clearPlans();
            await useHistoryStore.getState().clearHistory();
            await useSettingsStore.getState().clearSettings();
            await SecureStore.deleteItemAsync('jwt_token');
            setBackendToken(null);
        }
    };

    // Silently re-authenticates using the existing Google session and exchanges
    // the fresh Google ID token for a new JWT. Forces logout only if the identity
    // is explicitly rejected — not on network errors (preserves offline mode).
    const silentRefresh = async (): Promise<boolean> => {
        try {
            const isSignedIn = GoogleSignin.hasPreviousSignIn();
            if (!isSignedIn) {
                console.log("Silent refresh: no Google session, forcing logout.");
                await logout();
                return false;
            }

            const { idToken } = await GoogleSignin.getTokens();
            if (!idToken) {
                console.log("Silent refresh: could not get Google ID token, forcing logout.");
                await logout();
                return false;
            }

            const response = await fetch(`${BACKEND_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
                const data = await response.json();
                await SecureStore.setItemAsync('jwt_token', data.token);
                setBackendToken(data.token);
                console.log("Silent token refresh succeeded.");
                return true;
            } else if (response.status === 401 || response.status === 403) {
                console.log("Silent refresh: backend rejected identity, forcing logout.");
                await logout();
                return false;
            }

            // Backend unreachable — stay in offline mode
            console.log("Silent refresh: backend unreachable, staying offline.");
            return false;
        } catch (error) {
            console.log("Silent refresh failed (network):", error);
            return false;
        }
    };

    // Exchanges a Google ID token for a backend JWT, then triggers a cloud sync.
    // Ignores network errors so the user can keep working offline.
    const syncWithBackend = async (idToken: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: idToken }),
            });

            if (response.ok) {
                const data = await response.json();
                await SecureStore.setItemAsync('jwt_token', data.token);
                setBackendToken(data.token);
                console.log("Synced with backend.");
                usePlanStore.getState().syncPlansToCloud();
                useHistoryStore.getState().syncHistoryToCloud();
                useSettingsStore.getState().syncSettingsToCloud();
            } else if (response.status === 401 || response.status === 403) {
                console.log("Backend explicitly rejected authorization. Forcing logout.");
                await logout();
            } else {
                console.log("Backend returned error:", response.status);
            }
        } catch (error) {
            // Network error — allow offline use
            console.log("Could not reach backend (offline mode active):", error);
        }
    };

    const checkUser = async () => {
        try {
            const currentUser = GoogleSignin.getCurrentUser();
            if (currentUser && currentUser.user) {
                const profile = currentUser.user;
                setUser(profile);
                await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));

                const { idToken } = await GoogleSignin.getTokens();
                if (idToken) syncWithBackend(idToken);
            } else {
                const silentUser = await GoogleSignin.signInSilently();
                if (silentUser && silentUser.data?.user) {
                    const profile = silentUser.data.user;
                    setUser(profile);
                    await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));

                    const { idToken } = await GoogleSignin.getTokens();
                    if (idToken) syncWithBackend(idToken);
                } else {
                    // No active Google session; only clear user if there's no cached profile
                    const cachedUser = await AsyncStorage.getItem('@user_profile');
                    if (!cachedUser) setUser(null);
                }
            }
        } catch (error: any) {
            console.log('Google silent sign-in failed (likely offline):', error);
            // Keep cached user so the app stays accessible without a connection
            const cachedUser = await AsyncStorage.getItem('@user_profile');
            if (!cachedUser) {
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            const profile = userInfo.data?.user;
            if (profile) {
                setUser(profile);
                await AsyncStorage.setItem('@user_profile', JSON.stringify(profile));
            }

            const { idToken } = await GoogleSignin.getTokens();
            if (idToken) syncWithBackend(idToken);

        } catch (error: any) {
            console.log('Login error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, backendToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw Error("useAuth must be used within AuthProvider");
    return context;
}
