import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CompletedWorkout } from '@/types';
import { Text } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';

interface HistoryCardProps {
    workout: CompletedWorkout;
    onPress: () => void;
}

const formatDate = (isoString: string) => {
    if (!isoString) return 'Unknown Date';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Unknown Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export default function HistoryCard({ workout, onPress }: HistoryCardProps) {
    const duration = formatDuration(workout.durationSeconds);

    return (
        <Card onPress={onPress} className="mb-3 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
                <Text variant="h3" className="mb-1 tracking-tight">{workout.planName}</Text>
                <Text color="primary" variant="caption" className="mb-1">{formatDate(workout.dateCompleted)}</Text>
                <View className="flex-row items-center gap-3">
                    <Text color="muted">
                        {workout.exercises.length} {workout.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                    </Text>
                    {duration && (
                        <Text color="muted">• {duration}</Text>
                    )}
                </View>
            </View>

            <View className="w-10 h-10 rounded-full bg-surface-dark items-center justify-center">
                <Feather name="chevron-right" size={20} color="#a1a1aa" />
            </View>
        </Card>
    );
}
