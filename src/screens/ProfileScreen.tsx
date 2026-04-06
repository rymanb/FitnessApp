import { View, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AppContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeColors } from '@/context/ThemeContext';
import { Text } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Preset options shown as selectable chips for rest durations
const SET_REST_OPTIONS = [30, 60, 90, 120, 180];
const EXERCISE_REST_OPTIONS = [60, 90, 120, 180, 300];

const formatSeconds = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
};

export const ProfileScreen = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();
    const {
        restTimersEnabled,
        setRestSeconds,
        exerciseRestSeconds,
        theme,
        setRestTimersEnabled,
        setSetRestSeconds,
        setExerciseRestSeconds,
        setTheme,
    } = useSettingsStore();

    return (
        <SafeAreaView className="flex-1 bg-background">

            {/* Nav bar */}
            <View className="flex-row items-center px-4 pt-2 pb-4">
                <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-50">
                    <Feather name="chevron-left" size={28} color={colors.text} />
                </Pressable>
                <Text variant="h2" className="ml-2">Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

                {/* Avatar + name */}
                <View className="items-center mb-8">
                    {user?.photo ? (
                        <Image
                            source={{ uri: user.photo }}
                            style={{ width: 88, height: 88, borderRadius: 44 }}
                            className="mb-4 bg-surface-light"
                        />
                    ) : (
                        <View className="w-22 h-22 rounded-full bg-surface-light items-center justify-center mb-4">
                            <Ionicons name="person" size={40} color={colors.textMuted} />
                        </View>
                    )}
                    <Text variant="h2">{user?.name || 'User'}</Text>
                    <Text color="muted" variant="caption" className="mt-1">{user?.email}</Text>
                </View>

                {/* Appearance */}
                <Text color="muted" variant="caption" className="uppercase tracking-widest mb-3 px-1">Appearance</Text>

                <Card className="mb-6">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <Text variant="h3">Theme</Text>
                            <Text color="muted" variant="caption" className="mt-0.5">Choose your preferred appearance</Text>
                        </View>
                        <View className="flex-row gap-2">
                            <Pressable
                                onPress={() => setTheme('dark')}
                                className={`px-4 py-2 rounded-full border ${
                                    theme === 'dark'
                                        ? 'bg-primary/20 border-primary/50'
                                        : 'bg-surface border-surface-light active:bg-surface-light'
                                }`}
                            >
                                <Text className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-light' : 'text-text-muted'}`}>
                                    Dark
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setTheme('light')}
                                className={`px-4 py-2 rounded-full border ${
                                    theme === 'light'
                                        ? 'bg-primary/20 border-primary/50'
                                        : 'bg-surface border-surface-light active:bg-surface-light'
                                }`}
                            >
                                <Text className={`text-sm font-medium ${theme === 'light' ? 'text-primary-light' : 'text-text-muted'}`}>
                                    Light
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </Card>

                {/* Rest timer settings */}
                <Text color="muted" variant="caption" className="uppercase tracking-widest mb-3 px-1">Rest Timers</Text>

                <Card className="mb-4">
                    {/* Enable toggle */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <Text variant="h3">Rest Timers</Text>
                            <Text color="muted" variant="caption" className="mt-0.5">Auto-start a rest countdown after each completed set</Text>
                        </View>
                        <Switch
                            value={restTimersEnabled}
                            onValueChange={setRestTimersEnabled}
                            trackColor={{ false: colors.surfaceLight, true: '#3b82f6' }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    {restTimersEnabled && (
                        <>
                            <View className="h-px bg-surface my-4" />

                            {/* Set rest duration */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-3">
                                    <Feather name="repeat" size={14} color={colors.textMuted} />
                                    <Text variant="h3" className="ml-2">Between Sets</Text>
                                    <Text color="primary" className="ml-auto font-bold">{formatSeconds(setRestSeconds)}</Text>
                                </View>
                                <View className="flex-row flex-wrap gap-2">
                                    {SET_REST_OPTIONS.map(s => (
                                        <Pressable
                                            key={s}
                                            onPress={() => setSetRestSeconds(s)}
                                            className={`px-4 py-2 rounded-full border ${
                                                setRestSeconds === s
                                                    ? 'bg-primary/20 border-primary/50'
                                                    : 'bg-surface border-surface-light active:bg-surface-light'
                                            }`}
                                        >
                                            <Text className={`text-sm font-medium ${setRestSeconds === s ? 'text-primary-light' : 'text-text-muted'}`}>
                                                {formatSeconds(s)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View className="h-px bg-surface mb-4" />

                            {/* Exercise rest duration */}
                            <View>
                                <View className="flex-row items-center mb-3">
                                    <Feather name="activity" size={14} color={colors.textMuted} />
                                    <Text variant="h3" className="ml-2">Between Exercises</Text>
                                    <Text color="primary" className="ml-auto font-bold">{formatSeconds(exerciseRestSeconds)}</Text>
                                </View>
                                <View className="flex-row flex-wrap gap-2">
                                    {EXERCISE_REST_OPTIONS.map(s => (
                                        <Pressable
                                            key={s}
                                            onPress={() => setExerciseRestSeconds(s)}
                                            className={`px-4 py-2 rounded-full border ${
                                                exerciseRestSeconds === s
                                                    ? 'bg-primary/20 border-primary/50'
                                                    : 'bg-surface border-surface-light active:bg-surface-light'
                                            }`}
                                        >
                                            <Text className={`text-sm font-medium ${exerciseRestSeconds === s ? 'text-primary-light' : 'text-text-muted'}`}>
                                                {formatSeconds(s)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}
                </Card>

                {/* Logout */}
                <Button
                    title="Log Out"
                    variant="danger"
                    onPress={logout}
                    className="mt-4"
                />
            </ScrollView>
        </SafeAreaView>
    );
};
