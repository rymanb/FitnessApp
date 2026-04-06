import { View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WorkoutPlan } from '@/types';
import { useWorkoutStore } from '@/store/workoutStore';
import { Text } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';

interface PlanCardProps {
    plan: WorkoutPlan;
    onEdit: () => void;
}

export default function PlanCard({ plan, onEdit }: PlanCardProps) {
    const { activeWorkout, startWorkout } = useWorkoutStore();
    const isActive = !!activeWorkout;

    return (
        <Card onPress={onEdit} className="mb-3 flex-row justify-between items-center">
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
        </Card>
    );
}
