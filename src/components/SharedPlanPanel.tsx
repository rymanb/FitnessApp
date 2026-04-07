import React, { useMemo, useState } from 'react';
import { View, ScrollView, Image, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import AnimatedModal from '@/components/ui/AnimatedModal';
import MuscleVisualizer from '@/components/MuscleVisualizer';
import ExerciseInfoModal from '@/components/ExerciseInfoModal';
import { WgerExercise, WgerMuscle } from '@/types';

export interface SharedPlanData {
    planName: string;
    exercises: any[];
    creatorName: string;
    creatorPhoto: string;
}

interface SharedPlanPanelProps {
    isVisible: boolean;
    plan: SharedPlanData | null;
    onClose: () => void;
    onImport: () => void;
    isImporting?: boolean;
}

export default function SharedPlanPanel({ isVisible, plan, onClose, onImport, isImporting }: SharedPlanPanelProps) {
    const [showMuscles, setShowMuscles] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<WgerExercise | null>(null);

    const { muscles, secondaryMuscles } = useMemo(() => {
        if (!plan) return { muscles: [], secondaryMuscles: [] };
        const primaryMap = new Map<number, WgerMuscle>();
        const secondaryMap = new Map<number, WgerMuscle>();
        plan.exercises.forEach(ex => {
            ex.wgerData.muscles?.forEach((m: WgerMuscle) => primaryMap.set(m.id, m));
            ex.wgerData.muscles_secondary?.forEach((m: WgerMuscle) => secondaryMap.set(m.id, m));
        });
        primaryMap.forEach((_, id) => secondaryMap.delete(id));
        return {
            muscles: Array.from(primaryMap.values()),
            secondaryMuscles: Array.from(secondaryMap.values()),
        };
    }, [plan]);

    const hasMuscleData = muscles.length > 0 || secondaryMuscles.length > 0;

    return (
        <>
            <AnimatedModal isVisible={isVisible} onClose={onClose}>
                <View className="flex-1">
                    {plan && (
                        <>
                            {/* Creator row */}
                            <View className="flex-row items-center mt-2">
                                {plan.creatorPhoto ? (
                                    <Image
                                        source={{ uri: plan.creatorPhoto }}
                                        style={{ width: 40, height: 40, borderRadius: 20 }}
                                    />
                                ) : (
                                    <View className="w-10 h-10 rounded-full bg-surface items-center justify-center">
                                        <Feather name="user" size={20} color="#a1a1aa" />
                                    </View>
                                )}
                                <View className="ml-3 flex-1">
                                    <Text color="muted" variant="caption">Shared by</Text>
                                    <Text variant="body" className="font-semibold">{plan.creatorName}</Text>
                                </View>
                            </View>

                            {/* Plan name */}
                            <View className="bg-surface border border-surface-light p-4 rounded-xl mt-4">
                                <Text variant="body" className="font-bold text-lg">{plan.planName}</Text>
                            </View>

                            {/* Muscles */}
                            {hasMuscleData && (
                                <Pressable
                                    onPress={() => setShowMuscles(v => !v)}
                                    className="flex-row items-center mt-4 px-1"
                                >
                                    <Feather name="activity" size={14} color="#a1a1aa" />
                                    <Text color="muted" variant="caption" className="ml-2 flex-1">Muscles Targeted</Text>
                                    <Feather name={showMuscles ? 'chevron-up' : 'chevron-down'} size={14} color="#a1a1aa" />
                                </Pressable>
                            )}
                            {showMuscles && hasMuscleData && (
                                <MuscleVisualizer muscles={muscles} secondaryMuscles={secondaryMuscles} />
                            )}

                            <Text variant="body" className="mt-4 mb-2">Exercises: {plan.exercises.length}</Text>

                            <ScrollView className="flex-1 px-1 mt-2" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View className="pb-24">
                                    {plan.exercises.map((ex) => (
                                        <Card key={ex.uniqueId} className="p-4 mb-6">
                                            <View className="flex-row items-center mb-4">
                                                <View className="flex-1 ml-3">
                                                    <Text variant="body" className="font-bold" numberOfLines={1}>
                                                        {ex.wgerData.displayName}
                                                    </Text>
                                                </View>
                                                <Pressable
                                                    onPress={() => setSelectedExercise(ex.wgerData)}
                                                    className="p-2 active:bg-surface-light rounded-full"
                                                >
                                                    <Feather name="info" size={18} color="#60a5fa" />
                                                </Pressable>
                                            </View>

                                            <View className="flex-row px-2 mb-2">
                                                <Text color="dark" variant="caption" className="w-10 text-center uppercase tracking-widest">Set</Text>
                                                <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">lbs</Text>
                                                <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">Reps</Text>
                                            </View>

                                            {ex.sets.map((set: any, idx: number) => (
                                                <View key={set.id} className="flex-row items-center bg-background rounded-xl mb-2 py-2 px-2 border border-surface/50">
                                                    <View className="w-10 items-center justify-center">
                                                        <Text color="muted" className="font-bold">{idx + 1}</Text>
                                                    </View>
                                                    <View className="flex-1 items-center">
                                                        <Text variant="body">{set.weight || '—'}</Text>
                                                    </View>
                                                    <View className="flex-1 items-center">
                                                        <Text variant="body">{set.reps || '—'}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </Card>
                                    ))}
                                </View>
                            </ScrollView>

                            <View className="flex-row gap-3 mt-4 mb-6 px-2">
                                <Button title="Close" variant="secondary" onPress={onClose} className="flex-1" />
                                <Button
                                    title={isImporting ? 'Importing…' : 'Import Plan'}
                                    variant="primary"
                                    onPress={onImport}
                                    disabled={isImporting}
                                    className="flex-1"
                                />
                            </View>
                        </>
                    )}
                </View>
            </AnimatedModal>

            {selectedExercise && (
                <ExerciseInfoModal
                    exercise={selectedExercise}
                    onClose={() => setSelectedExercise(null)}
                />
            )}
        </>
    );
}
