import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';


GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    offlineAccess: true,
});

const AuthContext = createContext<any>(null);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
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
                    setUser
                }
            }
        } catch (error: any) {
            console.log('No active session found.');
        } finally {
            setIsLoading(false);
        }
    }

    const login = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            console.log("SUCCESS!", userInfo);
            setUser(userInfo);
        } catch (error: any) {
            console.log('Login Error:', error);
        }
    };

    const logout = async () => {
        try {
            await GoogleSignin.signOut();
            setUser(null);
        } catch (error) {
            console.log(error);
        }
    }


    return (
        <AuthContext.Provider value={{
                user,
                login,
                logout,
                isLoading
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw Error("useAuth mmust be used within AuthProvider");
    return context;
}