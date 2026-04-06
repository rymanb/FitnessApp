import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter, useSegments, Stack, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useSettingsStore } from '@/store/settingsStore';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { initDB } from '@/db/database';
import { KeyboardProvider } from 'react-native-keyboard-controller';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function RootLayoutNav() {
    const {user, isLoading} = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        async function setup() {
            await initDB();
            await setupNotifications();
        }
        setup();

        async function setupNotifications() {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Enable notifications for the Rest Timer!');
                return;
            }
        }
    }, []);

    // Redirect based on auth state once the navigator is ready
    useEffect(() => {
        if (isLoading || !isMounted || !navigationState?.key) return;
        const inAuthGroup = segments[0] === 'login';
        if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/');
        }
    }, [user, isLoading, segments, isMounted, navigationState]);

    if (!isMounted || !navigationState?.key) return null;

    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="(tabs)" options={{headerShown: false}} />
            <Stack.Screen name="login" options={{animation: 'fade'}} />
            <Stack.Screen name="profile" options={{animation: 'slide_from_right'}} />
        </Stack>
    );
}

function ThemedApp() {
    const theme = useSettingsStore(state => state.theme);
    return (
        <ThemeProvider colorScheme={theme}>
            <SafeAreaProvider>
                <KeyboardProvider>
                    <StatusBar style={theme === 'light' ? 'dark' : 'light'} translucent={true} />
                    <RootLayoutNav />
                </KeyboardProvider>
            </SafeAreaProvider>
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemedApp />
        </AuthProvider>
    );
}
