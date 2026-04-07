import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter, useSegments, Stack, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useShareStore } from '@/store/shareStore';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { initDB } from '@/db/database';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import SharedPlanPanel, { SharedPlanData } from '@/components/SharedPlanPanel';
import { usePlanStore } from '@/store/planStore';
import { BACKEND_URL } from '@/utils/helpers';
import * as Crypto from 'expo-crypto';
import { PlannedExercise } from '@/types';

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
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const [isMounted, setIsMounted] = useState(false);
    const { savePlan } = usePlanStore();
    const { pendingShareId, setPendingShareId } = useShareStore();

    const [sharedPlan, setSharedPlan] = useState<SharedPlanData | null>(null);
    const [isImporting, setIsImporting] = useState(false);

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
            }
        }
    }, []);

    // Watch for a share ID set by the /share/[shareId] route
    useEffect(() => {
        if (!pendingShareId) return;
        async function loadPlan() {
            try {
                const response = await fetch(`${BACKEND_URL}/api/v1/plans/shared/${pendingShareId}`);
                if (response.ok) setSharedPlan(await response.json());
            } catch {}
            setPendingShareId(null);
        }
        loadPlan();
    }, [pendingShareId]);

    useEffect(() => {
        if (isLoading || !isMounted || !navigationState?.key) return;
        const inAuthGroup = segments[0] === 'login';
        const inShareRoute = segments[0] === 'share' || segments[0] === 'shared-plan';
        if (!user && !inAuthGroup && !inShareRoute) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/');
        }
    }, [user, isLoading, segments, isMounted, navigationState]);

    const handleImport = () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to import plans.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => { setSharedPlan(null); router.replace('/login'); } },
            ]);
            return;
        }
        if (!sharedPlan) return;
        setIsImporting(true);
        const exercises: PlannedExercise[] = sharedPlan.exercises.map((ex: any) => ({
            ...ex,
            uniqueId: Crypto.randomUUID(),
            sets: ex.sets.map((s: any) => ({ ...s, id: Crypto.randomUUID(), completed: false })),
        }));
        savePlan(sharedPlan.planName, exercises);
        setIsImporting(false);
        setSharedPlan(null);
        Alert.alert('Plan Imported', `"${sharedPlan.planName}" has been added to your plans.`);
    };

    if (!isMounted || !navigationState?.key) return null;

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ animation: 'fade' }} />
                <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="share/[shareId]" options={{ headerShown: false }} />
                <Stack.Screen name="shared-plan/[shareId]" options={{ headerShown: false }} />
            </Stack>

            {sharedPlan && (
                <SharedPlanPanel
                    isVisible={true}
                    plan={sharedPlan}
                    onClose={() => setSharedPlan(null)}
                    onImport={handleImport}
                    isImporting={isImporting}
                />
            )}
        </>
    );
}

function ThemedApp() {
    const theme = useSettingsStore(state => state.theme) ?? 'dark';
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
