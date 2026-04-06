import React, { useEffect, useState, useMemo } from "react";
import { View, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import AnimatedModal from "./ui/AnimatedModal";
import ExercisePanel from "./ExercisePanel";
import { PlannedExercise, WgerExercise, WgerMuscle } from "@/types";
import ExerciseCard from "./ExerciseCard";
import MuscleVisualizer from "./MuscleVisualizer";
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { generateId } from "@/utils/helpers";
import { usePlanStore } from "@/store/planStore";
import { BACKEND_URL } from '@/utils/helpers';
import { apiFetch } from '@/utils/apiFetch';
import * as SecureStore from 'expo-secure-store';
import { Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';

interface PlanPanelProps {
    isVisible: boolean;
    onClose: () => void;
    existingPlan?: any;
}

export default function PlanPanel({isVisible, onClose, existingPlan}: PlanPanelProps) {
    const {savePlan, updatePlan, deletePlan} = usePlanStore();

    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");
    const [exercises, setExercises] = useState<PlannedExercise[]>([]);
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showMuscles, setShowMuscles] = useState(false);

    useEffect(() => {
        if (existingPlan) {
            setEditingPlanId(existingPlan.id);
            setDraftName(existingPlan.name);
            setExercises(existingPlan.exercises);
        }
    }, [existingPlan]);

    // Collect unique primary and secondary muscles across all exercises
    const { muscles, secondaryMuscles } = useMemo(() => {
        const primaryMap = new Map<number, WgerMuscle>();
        const secondaryMap = new Map<number, WgerMuscle>();
        exercises.forEach(ex => {
            ex.wgerData.muscles?.forEach(m => primaryMap.set(m.id, m));
            ex.wgerData.muscles_secondary?.forEach(m => secondaryMap.set(m.id, m));
        });
        return {
            muscles: Array.from(primaryMap.values()),
            secondaryMuscles: Array.from(secondaryMap.values()),
        };
    }, [exercises]);

    const hasMuscleData = muscles.length > 0 || secondaryMuscles.length > 0;

    // Requests an AI-generated plan from the backend, then resolves each exercise
    // against the wger database in parallel to get full exercise metadata.
    const handleGenerateAIPlan = async () => {
        setIsGenerating(true);
        try {
            const token = await SecureStore.getItemAsync('jwt_token');

            const response = await apiFetch(`${BACKEND_URL}/api/v1/plans/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ level: "beginner", goal: "muscle", days: 1 })
            });

            if (!response.ok) throw new Error("Failed to generate plan");
            const aiPlan = await response.json();
            setDraftName(aiPlan.name);

            // Fetch full wger exercise data for each AI suggestion in parallel
            const mappedExercises = await Promise.all(aiPlan.exercises.map(async (aiEx: any) => {
                try {
                    const searchUrl = `https://wger.de/api/v2/exerciseinfo/?name__search=${encodeURIComponent(aiEx.wger_search_query)}&language=2`;
                    const wgerRes = await fetch(searchUrl);
                    const wgerJson = await wgerRes.json();

                    const sets = Array.from({ length: aiEx.sets }).map(() => ({
                        id: generateId(), weight: '', reps: aiEx.target_reps, completed: false
                    }));

                    if (wgerJson.results && wgerJson.results.length > 0) {
                        const bestMatch = wgerJson.results[0];
                        const englishEntry = bestMatch.translations?.find((t: any) => t.language === 2);
                        const cleanName = (englishEntry?.name || bestMatch.name).toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                        return {
                            uniqueId: generateId(),
                            wgerData: { ...bestMatch, displayName: cleanName, description: englishEntry?.description || bestMatch.description },
                            sets
                        } as PlannedExercise;
                    }

                    // Fallback for exercises not found in wger
                    return {
                        uniqueId: generateId(),
                        wgerData: { id: Math.floor(Math.random() * -10000), name: aiEx.wger_search_query, displayName: aiEx.wger_search_query, category: { id: 1, name: "AI Suggestion" } },
                        sets
                    } as PlannedExercise;
                } catch (e) {
                    return null;
                }
            }));

            setExercises(mappedExercises.filter(ex => ex !== null) as PlannedExercise[]);

        } catch (error) {
            Alert.alert("AI Error", "Could not generate a plan right now.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePlan = () => {
        if (!draftName.trim()) {
            Alert.alert("Missing Name", "Please enter a plan name.");
            return;
        }
        if (exercises.length === 0) {
            Alert.alert("Empty Plan", "Please add at least one exercise to your plan.")
            return;
        }

        if (editingPlanId) {
            updatePlan(editingPlanId, draftName, exercises);
        } else {
            savePlan(draftName, exercises);
        }
        onClose();
    }

    const handleDeletePlan = () => {
        Alert.alert(
            "Delete Plan",
            `Are you sure you want to delete "${draftName}"?`,
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        if (editingPlanId) deletePlan(editingPlanId);
                        onClose();
                    }
                }
            ]
        )
    }

    const handleAddExercise = (exercise: WgerExercise) => {
        const newExercise: PlannedExercise = {
            uniqueId: generateId(),
            wgerData: exercise,
            sets: [{id: generateId(), weight: '', reps: '', completed: false}],
        };
        setExercises(prev => [...prev, newExercise]);
        setIsAddingExercise(false);
    };

    const handleRemoveExercise = (uniqueId: string) => {
        setExercises(prev => prev.filter(ex => ex.uniqueId !== uniqueId));
    };

    const handleAddSet = (exerciseId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.uniqueId === exerciseId) {
                const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
                return {
                    ...ex,
                    sets: [...ex.sets, { id: generateId(), weight: lastSet?.weight || '', reps: lastSet?.reps || '', completed: false }]
                };
            }
            return ex;
        }))
    }

    const handleRemoveSet = (exerciseId: string, setId: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.uniqueId === exerciseId) {
                return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            }
            return ex;
        }))
    }

    const handleUpdateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
        setExercises(prev => prev.map(ex => {
            if (ex.uniqueId === exerciseId) {
                return {
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? {...s, [field]: value} : s)
                };
            }
            return ex;
        }));
    };

    return (
        <AnimatedModal isVisible={isVisible} onClose={onClose}>
            <View className="flex-1">
                <View className="flex-row justify-between items-center mt-2">
                    <TextInput
                        className="flex-1 bg-surface border border-surface-light text-text p-4 rounded-xl font-bold text-lg mr-2"
                        placeholder="Plan Name (e.g., Pull Day)"
                        placeholderTextColor="#a1a1aa"
                        value={draftName}
                        onChangeText={setDraftName}
                    />

                    {!editingPlanId && (
                        <Pressable
                            onPress={handleGenerateAIPlan}
                            disabled={isGenerating}
                            className="bg-indigo-500/10 p-4 rounded-xl active:bg-indigo-500/20 mr-2 border border-indigo-500/30"
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="#6366f1" size="small" />
                            ) : (
                                <MaterialCommunityIcons name="auto-fix" size={24} color="#6366f1" />
                            )}
                        </Pressable>
                    )}

                    {editingPlanId && (
                        <Pressable onPress={handleDeletePlan} className="bg-red-500/10 p-4 rounded-xl active:bg-red-500/20">
                            <Feather name="trash-2" size={24} color="#ef4444" />
                        </Pressable>
                    )}
                </View>

                {/* Muscle overview — only shown once at least one exercise has muscle data */}
                {hasMuscleData && (
                    <Pressable
                        onPress={() => setShowMuscles(v => !v)}
                        className="flex-row items-center mt-4 px-1"
                    >
                        <Feather name="activity" size={14} color="#a1a1aa" />
                        <Text color="muted" variant="caption" className="ml-2 flex-1">Muscles Targeted</Text>
                        <Feather name={showMuscles ? "chevron-up" : "chevron-down"} size={14} color="#a1a1aa" />
                    </Pressable>
                )}

                {showMuscles && hasMuscleData && (
                    <MuscleVisualizer muscles={muscles} secondaryMuscles={secondaryMuscles} />
                )}

                <Text variant="body" className="mt-4 mb-2">Exercises: {exercises.length}</Text>

                <ScrollView className="flex-1 px-1 mt-2" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {exercises.length === 0 ? (
                        <View className="flex-1 items-center justify-center border-2 border-dashed border-surface rounded-3xl py-20 mt-4">
                            <Feather name="list" size={48} color="#3f3f46" className="mb-4" />
                            <Text color="muted" variant="h3">Empty Plan</Text>
                            <Text color="dark" variant="caption" className="mt-1">Tap + below to add exercises</Text>
                        </View>
                    ) : (
                        <View className="pb-24">
                            {exercises.map((ex) => (
                                <ExerciseCard
                                    key={ex.uniqueId}
                                    exercise={ex}
                                    onRemove={() => handleRemoveExercise(ex.uniqueId)}
                                    onAddSet={() => handleAddSet(ex.uniqueId)}
                                    onRemoveSet={(setId) => handleRemoveSet(ex.uniqueId, setId)}
                                    onUpdateSet={(setId, field, value) => handleUpdateSet(ex.uniqueId, setId, field, value)}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>

                <View className="flex-row gap-3 mt-4 mb-6 px-2">
                    <Button title="Add Exercise" variant="secondary" onPress={() => setIsAddingExercise(true)} className="flex-1" />
                    <Button title="Save Plan" variant="primary" onPress={handleSavePlan} className="flex-1" />
                </View>

                {isAddingExercise && (
                    <ExercisePanel isVisible={true} onClose={() => setIsAddingExercise(false)} onSelect={handleAddExercise} />
                )}
            </View>
        </AnimatedModal>
    );
}
