import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useHistoryStore } from '@/store/historyStore';
import { useStatsStore } from '@/store/statsStore';
import { useWorkoutStats } from '@/hooks/useWorkoutStats';

import { Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ExercisePanel from '@/components/ExercisePanel';
import ProgressChartCard from '@/components/ProgressChartCard';

export const Stats = () => {
    const { workoutHistory } = useHistoryStore();
    const { trackedExercises, addTrackedExercise, removeTrackedExercise } = useStatsStore();
    const [isAddingExercise, setIsAddingExercise] = useState(false);

    const stats = useWorkoutStats(workoutHistory);

    const displayedExercises = useMemo(() => {
        const combined = [...stats.top3];
        trackedExercises.forEach(manualEx => {
            if (!combined.find(e => e.id === manualEx.id)) combined.push(manualEx);
        });
        return combined;
    }, [stats.top3, trackedExercises]);

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            <Text variant="h1" className="mb-6 mt-4">Statistics</Text>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-10">
                
                {/* Top Stat Cards */}
                <View className="flex-row gap-3 mb-3">
                    <Card className="flex-1 items-center p-4">
                        <Feather name="clock" size={20} color="#60a5fa" className="mb-2" />
                        <Text variant="h2">{stats.avgWorkoutLength}<Text variant="body" color="muted"> min</Text></Text>
                        <Text color="muted" variant="caption">Avg Duration</Text>
                    </Card>

                    <Card className="flex-1 items-center p-4">
                        <Feather name="calendar" size={20} color="#60a5fa" className="mb-2" />
                        <Text variant="h2">{stats.avgWeek}</Text>
                        <Text color="muted" variant="caption">Weekly Avg</Text> 
                        <View className="absolute top-2 right-3 bg-card-dark px-2 py-1 rounded-full">
                            <Text className="text-[10px] text-text-muted font-bold">Rec: {stats.recordWeek}</Text>
                        </View>
                    </Card>
                </View>

                {/* Main Volume Card */}
                <Card className="items-center mb-8">
                    <Feather name="award" size={24} color="#f59e0b" className="mb-2" />
                    <Text variant="h1" className="text-3xl tracking-tight">{stats.totalVolume.toLocaleString()}</Text>
                    <Text color="muted" className="mt-1 font-medium tracking-widest uppercase text-xs">Career Volume Lifted (lbs)</Text>
                </Card>

                {/* Progress Charts */}
                <Text variant="h2" className="mb-4">Exercise Progress</Text>
                
                {displayedExercises.map((exercise) => (
                    <ProgressChartCard 
                        key={exercise.id}
                        exercise={exercise}
                        allData={stats.exerciseProgress[exercise.id] || []}
                        isManuallyTracked={trackedExercises.some(e => e.id === exercise.id)}
                        onRemove={() => removeTrackedExercise(exercise.id)}
                    />
                ))}

                <Button 
                    title="Track Another Exercise" 
                    variant="secondary" 
                    onPress={() => setIsAddingExercise(true)} 
                    className="mb-10 mt-2"
                />
            </ScrollView>

            {isAddingExercise && (
                <ExercisePanel
                    isVisible={true}
                    onClose={() => setIsAddingExercise(false)}
                    onSelect={(exercise) => {
                        addTrackedExercise(exercise);
                        setIsAddingExercise(false);
                    }}
                />
            )}
        </SafeAreaView>
    );
};