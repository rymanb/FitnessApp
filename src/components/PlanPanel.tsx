import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import AnimatedModal from "./AnimatedModal";
import ExersizePanel from "./ExercisePanel";

interface PlanPanelProps {
    isVisible: boolean;
    onClose: () => void;
}

export default function PlanPanel({isVisible, onClose}: PlanPanelProps) {

    const [draftName, setDraftName] = useState("");
    const [exerciseIds, setExerciseIds] = useState<string[]>([]);
    const [isAddingExcercise, setIsAddingExcercise] = useState(false);

    return (
        <>
        <AnimatedModal
            isVisible={isVisible}
            onClose={onClose}
        >
            <TextInput
                className="bg-slate-800 text-white p-4 rounded-lg mt-2"
                placeholder="Plan Name"
                placeholderTextColor="#9ca3af"
                value={draftName} 
                onChangeText={setDraftName}
            />
            <Text className="text-white mt-6">Exercises: {exerciseIds.length}</Text>
            

            <Pressable onPress={() => setIsAddingExcercise(true)} className="bg-blue-600 p-4 rounded-lg mt-2">
                <Text className="text-white text-center">Add New Exercise</Text>
            </Pressable>
        </AnimatedModal>
        {isAddingExcercise && (
            <ExersizePanel
                isVisible={isAddingExcercise}
                onClose={() => setIsAddingExcercise(false)}
                onSelect={() => {}}
            />
        )}
        </>
    );
}