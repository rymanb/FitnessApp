import { View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WorkoutPlan } from '@/types';
import { useWorkoutStore } from '@/store/workoutStore';
import { Text } from '@/components/ui/Typography';

interface PlanCardProps {
    plan: WorkoutPlan;
    onEdit: () => void;
}

export default function PlanCard({ plan, onEdit }: PlanCardProps) {
    const { activeWorkout, startWorkout } = useWorkoutStore();
    const isActive = !!activeWorkout;

    return (
        <Pressable 
            onPress={onEdit} 
            className="bg-surface p-5 rounded-3xl mb-3 border border-surface-light active:bg-surface-light flex-row justify-between items-center shadow-sm"
        >
            <View className="flex-1 mr-4">
                <Text variant="h3" className="mb-1 tracking-tight">{plan.name}</Text>
                <Text color="muted">
                    {plan.exercises.length} {plan.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                </Text>
            </View>

            <Pressable 
                onPress={() => startWorkout(plan)}
                disabled={isActive}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                    isActive 
                        ? 'bg-surface-dark border border-surface'
                        : 'bg-primary active:bg-primary-dark'
                }`}
            >
                <Feather 
                    name="play" 
                    size={22} 
                    color={isActive ? "#52525b" : "white"} 
                    style={{ marginLeft: 4 }} 
                />
            </Pressable>
        </Pressable>
    );
}