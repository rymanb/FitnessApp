import { View, ScrollView, Pressable } from "react-native";
import AnimatedModal from "./AnimatedModal";
import { WgerExercise } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { useEffect, useState } from "react";

import { Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import MuscleVisualizer from "./MuscleVisualizer"; 
import { Badge } from '@/components/ui/Badge';

interface ExerciseInfoModalProps {
    exercise: WgerExercise | null;
    onClose: () => void;
    onSelect?: (exercise: WgerExercise) => void; 
}

export default function ExerciseInfoModal({exercise, onClose, onSelect}: ExerciseInfoModalProps) {
    const [videoRatio, setVideoRatio] = useState(16 / 9);
    const videoSource = exercise?.videos?.[0]?.video;
    const player = useVideoPlayer(videoSource ? { uri: videoSource } : null, (p) => {
        p.loop = true;
    });

    useEffect(() => {
        if (videoSource && player) player.play();
    }, [videoSource, player]);

    if (!exercise) return null;

    const cleanDescription = (html?: string) => {
        if (!html) return ("No description provided.");
        return html.replace(/<[^>]*>?/gm, '').trim();
    }

    return (
        <AnimatedModal isVisible={!!exercise} onClose={onClose}>
            <ScrollView className="flex-1 w-full mt-2 px-2" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1 pr-4">
                        <Text variant="h1" className="mb-1">{exercise.displayName}</Text>
                        <Text color="primary" variant="h3">{exercise.category?.name || "General"}</Text>
                    </View>
                    <Pressable onPress={onClose} className="p-2 bg-surface rounded-full active:bg-surface-light">
                        <Feather name="x" size={24} color="#a1a1aa" />
                    </Pressable>
                </View>

                <MuscleVisualizer muscles={exercise.muscles} secondaryMuscles={exercise.muscles_secondary} />

                <View className="mb-6">
                    <Text variant="h3" className="mb-3">Equipment Required</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {exercise.equipment?.length ? exercise.equipment.map((e) => (
                            <Badge key={`eq-${e.id}`} label={e.name} variant="default" />
                        )) : (
                            <Badge label="Bodyweight / None" variant="default" />
                        )}
                    </View>
                </View>

                <View className="mb-10">
                    <Text variant="h3" className="mb-3">Instructions</Text>
                    <Text color="muted" className="leading-7">{cleanDescription(exercise.description)}</Text>
                </View>
                
                <View className="mb-6 rounded-2xl overflow-hidden bg-surface-dark border border-surface">
                    {exercise.videos && exercise.videos.length > 0 ? (
                        <VideoView
                            player={player}
                            style={{ width: '100%', aspectRatio: videoRatio }} 
                            contentFit="contain"
                            nativeControls={true}
                            pointerEvents="auto"
                            showsTimecodes={true}
                            accessibilityRole="button"
                        />
                    ) : (
                        <View className="w-full h-40 items-center justify-center">
                            <Feather name="image" size={40} color="#52525b" />
                            <Text color="dark" className="mt-2">No media available</Text>
                        </View>
                    )}
                </View>

                <View className="mb-6">
                    <Text variant="h3" className="mb-3">Target Muscles</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {exercise.muscles?.map((m) => (
                            <Badge key={`chip-p-${m.id}`} label={m.name_en || m.name} variant="danger" />
                        ))}
                        
                        {exercise.muscles_secondary?.map((m) => (
                            <Badge key={`chip-s-${m.id}`} label={m.name_en || m.name} variant="warning" />
                        ))}

                        {(!exercise.muscles?.length && !exercise.muscles_secondary?.length) && (
                            <Text color="muted" className="italic">No muscle data available</Text>
                        )}
                    </View>
                </View>

                {onSelect && (
                    <Button title="Add to My Workout" variant="primary" onPress={() => onSelect(exercise)} className="mb-10" />
                )}
            </ScrollView>
        </AnimatedModal>
    );
}