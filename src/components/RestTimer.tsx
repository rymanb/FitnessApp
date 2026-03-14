import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; 
import { Text } from '@/components/ui/Typography';

export default function RestTimer() {
    const { restEndTime, stopRestTimer, startRestTimer } = useWorkoutStore();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!restEndTime) {
            setTimeLeft(0);
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.ceil((restEndTime - now) / 1000);

            if (remaining <= 0) {
                stopRestTimer();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer(); 
        const interval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(interval);
    }, [restEndTime, stopRestTimer]);

    if (!restEndTime || timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <View pointerEvents="box-none" className="absolute bottom-10 left-0 right-0 items-center z-50">
            {/* FIXED: Explicitly use pointerEvents="auto" here so the buttons are still clickable */}
            <View pointerEvents="auto" className="bg-primary rounded-full flex-row items-center px-5 py-3 shadow-xl border border-primary-light">
                <Feather name="clock" size={18} color="white" />
                <Text variant="h3" className="mx-3 font-mono">
                    {formattedTime}
                </Text>
                
                <Pressable 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        startRestTimer(timeLeft + 30);
                    }} 
                    className="px-3 py-1 border-l border-white/20 active:opacity-50"
                >
                    <Text className="font-bold">+30s</Text>
                </Pressable>
                
                <Pressable 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        stopRestTimer();
                    }} 
                    className="px-3 py-1 border-l border-white/20 active:opacity-50"
                >
                    <Text className="font-bold">Skip</Text>
                </Pressable>
            </View>
        </View>
    );
}