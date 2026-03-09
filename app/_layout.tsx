import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter, useSegments, Stack, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

console.log("LAYOUT FILE IS RUdNNING");
function RootLayoutNav() {
    const {user, isLoading} = useAuth();
    const segments = useSegments();
    const router = useRouter();

    const navigationState = useRootNavigationState();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!isMounted || !navigationState?.key) return;

        console.log("Current User:", user);
        console.log("Current Path:", segments[0]);

        const inAuthGroup = segments[0] === 'login';

        if (!user && !inAuthGroup) {
            router.replace('/login');
        } else if (user && inAuthGroup) {
            router.replace('/');
        }
    }, [user, isLoading, segments]);

    if (!isMounted || !navigationState?.key) {
        return null;
    }

    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" options={{animation: 'fade'}} />
        </Stack>
    );

}


export default function RootLayout() {

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="light" translucent={true}/>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}