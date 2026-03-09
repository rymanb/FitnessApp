import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import AnimatedModal from "./AnimatedModal";
import { WgerExercise } from "./ExercisePanel";
import { Feather } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { useState } from "react";

interface ExerciseInfoModalProps {
    exercise: WgerExercise | null;
    onClose: () => void;
    onSelect?: (exercise: WgerExercise) => void; 
}

export default function ExerciseInfoModal({exercise, onClose, onSelect}: ExerciseInfoModalProps) {
    const [videoRatio, setVideoRatio] = useState(16 / 9);
    
    const videoSource = exercise?.videos?.[0]?.video || '';
    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = true;
    });
        
    const { width: screenWidth } = useWindowDimensions();
    const SLIDE_WIDTH = screenWidth - 32;

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
                        <Text className="text-white text-3xl font-bold mb-1">{exercise.displayName}</Text>
                        <Text className="text-blue-400 text-lg font-medium">
                        {exercise.category?.name || "General"}
                        </Text>
                    </View>
                    <Pressable onPress={onClose} className="p-2 bg-zinc-800 rounded-full active:bg-zinc-700">
                        <Feather name="x" size={24} color="#a1a1aa" />
                    </Pressable>
                </View>
            <View 
                style={{ width: SLIDE_WIDTH, alignSelf: 'center' }} 
                className="mb-6 overflow-hidden" 
            >
                <ScrollView 
                    horizontal 
                    pagingEnabled 
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SLIDE_WIDTH}
                    decelerationRate="fast"
                    disableIntervalMomentum={true} 
                    scrollEventThrottle={16}
                    snapToAlignment="start" 
                    contentContainerStyle={{ paddingHorizontal: 0 }}
                    style={{ width: SLIDE_WIDTH }}
                >
                    <View style={{ width: SLIDE_WIDTH }} className="items-center justify-center py-4">
                        <View style={{ width: 220, height: 260 }} className="items-center justify-center">
                            <Image 
                                source="https://raw.githubusercontent.com/wger-project/wger/master/wger/core/static/images/muscles/muscular_system_front.svg"
                                style={{ position: 'absolute', width: '100%', height: '100%' }}
                                contentFit="contain"
                            />
                            {exercise.muscles?.filter(m => m.is_front).map(m => (
                                <Image 
                                    key={`f-p-${m.id}`}
                                    source={m.image_url_main}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                    contentFit="contain"
                                />
                            ))}
                            {exercise.muscles_secondary?.filter(m => m.is_front).map(m => (
                                <Image 
                                    key={`f-s-${m.id}`}
                                    source={m.image_url_secondary}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                    contentFit="contain"
                                />
                            ))}
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mt-4 tracking-widest text-center">
                            Front View
                        </Text>
                    </View>

                    <View style={{ width: SLIDE_WIDTH }} className="items-center justify-center py-4">
                        <View style={{ width: 220, height: 260 }} className="items-center justify-center">
                            <Image 
                                source="https://raw.githubusercontent.com/wger-project/wger/master/wger/core/static/images/muscles/muscular_system_back.svg"
                                style={{ position: 'absolute', width: '100%', height: '100%' }}
                                contentFit="contain"
                            />
                            {exercise.muscles?.filter(m => !m.is_front).map(m => (
                                <Image 
                                    key={`b-p-${m.id}`}
                                    source={m.image_url_main}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                    contentFit="contain"
                                />
                            ))}
                            {exercise.muscles_secondary?.filter(m => !m.is_front).map(m => (
                                <Image 
                                    key={`b-s-${m.id}`}
                                    source={m.image_url_secondary}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                    contentFit="contain"
                                />
                            ))}
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase mt-4 tracking-widest text-center">
                            Back View
                        </Text>
                    </View>
                </ScrollView>

                <View className="flex-row justify-center pb-2 gap-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <View className="w-1.5 h-1.5 rounded-full bg-zinc-100" />
                </View>
            </View>

                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-3">Equipment Required</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {exercise.equipment?.length ? (
                            exercise.equipment.map((e) => (
                                <View key={`eq-${e.id}`} className="bg-zinc-700 px-4 py-2 rounded-full">
                                    <Text className="text-zinc-300 font-medium">{e.name}</Text>
                                </View>
                            ))
                        ) : (
                            <View className="bg-zinc-700 px-4 py-2 rounded-full">
                                <Text className="text-zinc-300 font-medium">Bodyweight / None</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="mb-10">
                    <Text className="text-white text-xl font-bold mb-3">Instructions</Text>
                    <Text className="text-zinc-400 text-base leading-7">
                        {cleanDescription(exercise.description)}
                    </Text>
                </View>
               <View className="mb-6 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800" collapsable={false}>
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
                    ) : exercise.images && exercise.images.length > 0 ? (
                        <Image 
                            source={{ uri: exercise.images[0].image }}
                            style={{ width: '100%', height: 250 }}
                            contentFit="contain"
                        />
                    ) : (
                        <View className="w-full h-40 items-center justify-center">
                            <Feather name="image" size={40} color="#52525b" />
                            <Text className="text-zinc-500 mt-2">No media available</Text>
                        </View>
                    )}
                </View>

                <View className="mb-6">
                    <Text className="text-white text-xl font-bold mb-3">Target Muscles</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {exercise.muscles?.map((m) => (
                            <View key={`chip-p-${m.id}`} className="bg-red-500/20 px-4 py-2 rounded-full border border-red-500/50">
                                <Text className="text-red-300 font-medium">{m.name_en || m.name}</Text>
                            </View>
                        ))}
                        {exercise.muscles_secondary?.map((m) => (
                            <View key={`chip-s-${m.id}`} className="bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/50">
                                <Text className="text-orange-300 font-medium">{m.name_en || m.name}</Text>
                            </View>
                        ))}
                        {(!exercise.muscles?.length && !exercise.muscles_secondary?.length) && (
                            <Text className="text-zinc-500 italic">No muscle data available</Text>
                        )}
                    </View>
                </View>

                {onSelect && (
                    <Pressable 
                        onPress={() => onSelect(exercise)}
                        className="bg-blue-600 w-full py-4 rounded-2xl items-center mb-10 active:bg-blue-700"
                    >
                        <Text className="text-white font-bold text-lg">Add to My Workout</Text>
                    </Pressable>
                )}

            </ScrollView>
        </AnimatedModal>
    );
}