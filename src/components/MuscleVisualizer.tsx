import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Typography';
import { WgerMuscle } from '@/types';

interface MuscleVisualizerProps {
    muscles?: WgerMuscle[];
    secondaryMuscles?: WgerMuscle[];
    // Override the slide width; defaults to full screen width minus safe-area padding
    containerWidth?: number;
}

export default function MuscleVisualizer({ muscles, secondaryMuscles, containerWidth }: MuscleVisualizerProps) {
    const { width: screenWidth } = useWindowDimensions();
    const SLIDE_WIDTH = containerWidth ?? screenWidth - 32;

    const renderMuscleLayers = (isFront: boolean) => {
        const baseImage = isFront
            ? "https://raw.githubusercontent.com/wger-project/wger/master/wger/core/static/images/muscles/muscular_system_front.svg"
            : "https://raw.githubusercontent.com/wger-project/wger/master/wger/core/static/images/muscles/muscular_system_back.svg";

        return (
            <View style={{ width: SLIDE_WIDTH }} className="items-center justify-center py-4">
                <View style={{ width: 180, height: 220 }} className="items-center justify-center">
                    <Image
                        source={{ uri: baseImage }}
                        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}
                        contentFit="contain"
                    />
                    {muscles?.filter(m => m.is_front === isFront).map(m => (
                        <Image
                            key={`${isFront ? 'f' : 'b'}-p-${m.id}`}
                            source={{ uri: m.image_url_main }}
                            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
                            contentFit="contain"
                        />
                    ))}
                    {secondaryMuscles?.filter(m => m.is_front === isFront).map(m => (
                        <Image
                            key={`${isFront ? 'f' : 'b'}-s-${m.id}`}
                            source={{ uri: m.image_url_secondary }}
                            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}
                            contentFit="contain"
                        />
                    ))}
                </View>
                <Text color="muted" variant="caption" className="uppercase mt-2 tracking-widest text-[10px]">
                    {isFront ? "Front View" : "Back View"}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ width: SLIDE_WIDTH, alignSelf: 'center' }} className="overflow-hidden">
            <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                snapToInterval={SLIDE_WIDTH} decelerationRate="fast" disableIntervalMomentum={true}
                scrollEventThrottle={16} snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: 0 }}
                style={{ width: SLIDE_WIDTH }}
            >
                {renderMuscleLayers(true)}
                {renderMuscleLayers(false)}
            </ScrollView>

            <View className="flex-row justify-center pb-2 gap-2">
                <View className="w-1.5 h-1.5 rounded-full bg-surface-light" />
                <View className="w-1.5 h-1.5 rounded-full bg-text" />
            </View>
        </View>
    );
}
