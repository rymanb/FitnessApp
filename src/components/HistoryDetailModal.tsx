import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AnimatedModal from './ui/AnimatedModal';
import { CompletedWorkout } from '@/types';
import { Text } from '@/components/ui/Typography';

interface HistoryDetailModalProps {
    workout: CompletedWorkout | null;
    onClose: () => void;
}

export default function HistoryDetailModal({ workout, onClose }: HistoryDetailModalProps) {
    if (!workout) return null;

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AnimatedModal isVisible={!!workout} onClose={onClose} heightClass="h-[85%]">
            <View className="flex-row justify-between items-center mt-2 px-2 mb-6">
                <View>
                    <Text variant="h2">{workout.planName}</Text>
                    <Text color="primary" variant="caption" className="mt-1">{formatDate(workout.dateCompleted)}</Text>
                </View>
                <Pressable onPress={onClose} className="p-2 bg-surface rounded-full active:bg-surface-light">
                    <Feather name="x" size={24} color="#a1a1aa" />
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
                {workout.exercises.map((ex) => (
                    <View key={ex.uniqueId} className="bg-surface-dark border border-surface p-4 rounded-2xl mb-4">
                        <Text variant="h3" className="mb-3">{ex.wgerData.displayName}</Text>

                        <View className="flex-row mb-2 border-b border-surface pb-2">
                            <Text color="dark" variant="caption" className="w-12 text-center uppercase tracking-widest">Set</Text>
                            <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">lbs</Text>
                            <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">Reps</Text>
                        </View>

                        {ex.sets.map((set, setIndex) => (
                            <View key={set.id} className="flex-row items-center py-2">
                                <View className="w-12 items-center justify-center">
                                    <Text color="muted" className="font-bold">{setIndex + 1}</Text>
                                </View>
                                <View className="flex-1 items-center justify-center">
                                    <Text className="font-medium">{set.weight || '-'}</Text>
                                </View>
                                <View className="flex-1 items-center justify-center">
                                    <Text className="font-medium">{set.reps || '-'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
                <View className="h-10" />
            </ScrollView>
        </AnimatedModal>
    );
}