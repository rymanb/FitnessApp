import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useHistoryStore } from '@/store/historyStore';
import { CompletedWorkout } from '@/types';
import HistoryCard from '@/components/HistoryCard';
import HistoryDetailModal from '@/components/HistoryDetailModal';

// IMPORT THE PRIMITIVE!
import { Text } from '@/components/ui/Typography';

export const History = () => {
    const { workoutHistory } = useHistoryStore();
    const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkout | null>(null);

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            <Text variant="h1" className="mb-6 mt-4">History</Text>

            <View className="flex-1 pb-4">
                <ScrollView showsVerticalScrollIndicator={false}>
                    {workoutHistory.length === 0 ? (
                        <View className="items-center justify-center py-20 mt-10">
                            <Feather name="calendar" size={48} color="#3f3f46" className="mb-4" />
                            <Text color="muted" variant="h3">No workouts logged yet.</Text>
                            <Text color="dark" variant="caption" className="mt-1">Go hit the gym!</Text>
                        </View>
                    ) : (
                        workoutHistory.map((workout) => (
                            <HistoryCard 
                                key={workout.id} 
                                workout={workout} 
                                onPress={() => setSelectedWorkout(workout)} 
                            />
                        ))
                    )}
                </ScrollView>
            </View>

            <HistoryDetailModal 
                workout={selectedWorkout} 
                onClose={() => setSelectedWorkout(null)} 
            />
        </SafeAreaView>
    );
};