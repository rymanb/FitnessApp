import React, { useEffect, useState } from "react";
import { View, Pressable, TextInput, ScrollView, Alert } from "react-native";
import AnimatedModal from "./ui/AnimatedModal";
import ExersizePanel from "./ExercisePanel";
import { PlannedExercise, WgerExercise } from "@/types";
import ExerciseCard from "./ExerciseCard";
import { Feather } from '@expo/vector-icons';
import { generateId } from "@/utils/helpers";
import { usePlanStore } from "@/store/planStore";

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
    const [isAddingExcercise, setIsAddingExcercise] = useState(false);

    useEffect(() => {
        if (existingPlan) {
            setEditingPlanId(existingPlan.id);
            setDraftName(existingPlan.name);
            setExercises(existingPlan.exercises);
        }
    }, [existingPlan]);

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
        const newExercise : PlannedExercise = {
            uniqueId: generateId(),
            wgerData: exercise,
            sets: [{id: generateId(), weight: '', reps: '', completed: false}],
        };
        setExercises(prev => [...prev, newExercise]);
        setIsAddingExcercise(false);
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

    const handleRemoveSet = (exerciseId: string, setId:string) => {
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
                    {editingPlanId && (
                        <Pressable onPress={handleDeletePlan} className="bg-red-500/10 p-4 rounded-xl active:bg-red-500/20">
                            <Feather name="trash-2" size={24} color="#ef4444" />
                        </Pressable>
                    )}
                </View>
                <Text variant="body" className="mt-6 mb-2">Exercises: {exercises.length}</Text>

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
                    <Button 
                        title="Add Exercise" 
                        variant="secondary" 
                        onPress={() => setIsAddingExcercise(true)} 
                        className="flex-1"
                    />
                    <Button 
                        title="Save Plan" 
                        variant="primary" 
                        onPress={handleSavePlan} 
                        className="flex-1"
                    />
                </View>

                {isAddingExcercise && (
                    <ExersizePanel
                        isVisible={true}
                        onClose={() => setIsAddingExcercise(false)}
                        onSelect={handleAddExercise}
                    />
                )}
            </View>
        </AnimatedModal>
    );
}