import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { usePlanStore } from '@/store/planStore'; 
import { useHistoryStore } from '@/store/historyStore';

GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    offlineAccess: true,
});

interface AppContextType {
    user: any | null;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AppContextType | null>(null);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const bootstrapAsync = async () => {
            await Promise.all([
                checkUser(),
                usePlanStore.getState().loadPlans() ,
                useHistoryStore.getState().loadHistory()
            ]);
        };
        bootstrapAsync();
    }, []);

    const checkUser = async () => {
        try {
            const currentUser = GoogleSignin.getCurrentUser();
            if (currentUser && currentUser.user) {
                setUser(currentUser.user);
            } else {
                const silentUser = await GoogleSignin.signInSilently();
                if (silentUser && silentUser.data) {
                    setUser(silentUser);
                } else {
                    setUser(null);
                }
            }
        } catch (error: any) {
            console.log('No active session found.');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            setUser(userInfo);
        } catch (error: any) {
            console.log('Login Error:', error);
        }
    };

    const logout = async () => {
        try {
            await GoogleSignin.signOut();
            setUser(null);
            await usePlanStore.getState().clearPlans(); 
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw Error("useAuth must be used within AuthProvider");
    return context;
}