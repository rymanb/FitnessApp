import React, { useState } from "react";
import { View, Pressable, ScrollView, Keyboard } from "react-native";
import { Feather } from '@expo/vector-icons';
import ExerciseCard from "./ExerciseCard"; 
import ExersizePanel from "./ExercisePanel";
import AnimatedModal from "./ui/AnimatedModal";
import { useWorkoutStore } from "@/store/workoutStore"; 
import RestTimer from "./RestTimer";

import { Text } from '@/components/ui/Typography';

export default function ActiveWorkoutModal() {
    const { 
        activeWorkout,
        isExpanded,     
        setIsExpanded,  
        finishWorkout, 
        addActiveExercise, 
        removeActiveExercise, 
        addActiveSet, 
        removeActiveSet, 
        updateActiveSet, 
        toggleActiveSetStatus 
    } = useWorkoutStore();

    const [isAddingExercise, setIsAddingExercise] = useState(false);

    if (!activeWorkout) return null;

    const handleMinimize = () => {
        Keyboard.dismiss();
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <Pressable 
                onPress={() => setIsExpanded(true)}
                className="absolute bottom-24 left-4 right-4 bg-primary p-4 rounded-2xl flex-row justify-between items-center shadow-xl border border-primary-light z-50"
            >
                <View className="flex-row items-center">
                    <View className="bg-white/20 p-2 rounded-lg mr-3">
                        <Feather name="clock" size={18} color="white" />
                    </View>
                    <View>
                        <Text className="font-bold text-base text-white">{activeWorkout.name}</Text>
                        <Text className="text-white/80 text-xs">Active Session • {activeWorkout.exercises.length} Exercises</Text>
                    </View>
                </View>
                <Feather name="maximize-2" size={20} color="white" />
            </Pressable>
        );
    }

    return (
        <AnimatedModal isVisible={true} onClose={handleMinimize}>
            <View className="flex-1 pt-4">
                
                <View className="flex-row justify-between items-center p-4 border-b border-surface">
                    <Pressable onPress={handleMinimize} className="p-2 active:bg-surface rounded-full">
                        <Feather name="chevron-down" size={28} color="white" />
                    </Pressable>

                    <View className="items-center">
                        <Text variant="h3">{activeWorkout.name}</Text>
                        <Text color="primary" className="font-mono text-sm">00:24:12</Text>
                    </View>

                    <Pressable 
                        onPress={async () => {
                            await finishWorkout();      
                            setIsExpanded(false); 
                        }} 
                        className="bg-green-600 px-5 py-2 rounded-full active:bg-green-700"
                    >
                        <Text className="font-bold">Finish</Text>
                    </Pressable>
                </View>

                <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
                    {activeWorkout.exercises.map((ex) => (
                        <ExerciseCard 
                            key={ex.uniqueId} 
                            exercise={ex} 
                            onRemove={() => removeActiveExercise(ex.uniqueId)}
                            onAddSet={() => addActiveSet(ex.uniqueId)}
                            onRemoveSet={(setId) => removeActiveSet(ex.uniqueId, setId)}
                            onUpdateSet={(setId, field, value) => updateActiveSet(ex.uniqueId, setId, field as 'weight' | 'reps', value)}
                            onToggleSetStatus={(setId) => toggleActiveSetStatus(ex.uniqueId, setId)}
                        />
                    ))}

                    <Pressable 
                        onPress={() => setIsAddingExercise(true)}
                        className="bg-surface-dark border-2 border-dashed border-surface p-6 rounded-3xl mt-4 mb-32 items-center active:bg-surface"
                    >
                        <Feather name="plus" size={24} color="#60a5fa" />
                        <Text color="primary" className="font-bold mt-2">Add Exercise to Session</Text>
                    </Pressable>
                </ScrollView>

                <RestTimer />
            </View>

            {isAddingExercise && (
                <ExersizePanel 
                    isVisible={true} 
                    onClose={() => setIsAddingExercise(false)} 
                    onSelect={(exercise) => {
                        addActiveExercise(exercise);
                        setIsAddingExercise(false);
                    }} 
                />
            )}
        </AnimatedModal>
    );
}