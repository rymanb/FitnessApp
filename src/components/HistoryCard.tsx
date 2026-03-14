import { View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CompletedWorkout } from '@/types';
import { Text } from '@/components/ui/Typography';

interface HistoryCardProps {
    workout: CompletedWorkout;
    onPress: () => void;
}

export default function HistoryCard({ workout, onPress }: HistoryCardProps) {
    const formatDate = (isoString: string) => {
        if (!isoString) return 'Unknown Date';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Unknown Date';
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <Pressable 
            onPress={onPress} 
            className="bg-surface p-5 rounded-3xl mb-3 border border-surface-light active:bg-surface-light flex-row justify-between items-center shadow-sm"
        >
            <View className="flex-1 mr-4">
                <Text variant="h3" className="mb-1 tracking-tight">{workout.planName}</Text>
                <Text color="primary" variant="caption" className="mb-1">{formatDate(workout.dateCompleted)}</Text>
                <Text color="muted">
                    {workout.exercises.length} {workout.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                </Text>
            </View>

            <View className="w-10 h-10 rounded-full bg-surface-dark items-center justify-center">
                <Feather name="chevron-right" size={20} color="#a1a1aa" />
            </View>
        </Pressable>
    );
}