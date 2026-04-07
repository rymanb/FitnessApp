import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AppContext';
import { BACKEND_URL, generateId } from '@/utils/helpers';
import { apiFetch } from '@/utils/apiFetch';
import { usePlanStore } from '@/store/planStore';
import * as SecureStore from 'expo-secure-store';
import { Text } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlannedExercise } from '@/types';
import ExerciseDB from '@/data/exercises.json';
import Markdown from 'react-native-markdown-display';
import SharedPlanPanel, { SharedPlanData } from '@/components/SharedPlanPanel';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    type: 'chat' | 'plan';
    text: string;
    planData?: any; 
}

export const AICoach = () => {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { savePlan } = usePlanStore();
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'welcome', role: 'ai', type: 'chat', 
        text: `Hey ${user?.givenName || 'there'}! I'm your AI Coach. Ask me for advice, or tell me your goals and I'll build you a custom workout plan.`
    }]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [previewPlan, setPreviewPlan] = useState<SharedPlanData | null>(null);
    const [tokensUsed, setTokensUsed] = useState<number | null>(null);
    const [dailyLimit, setDailyLimit] = useState(20000);
    const flatListRef = useRef<FlatList>(null);

    const fetchTokenUsage = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            const res = await apiFetch(`${BACKEND_URL}/api/v1/ai/usage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTokensUsed(data.tokens_used);
                setDailyLimit(data.daily_limit);
            }
        } catch {}
    }, []);

    useEffect(() => { fetchTokenUsage(); }, [fetchTokenUsage]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: ChatMessage = { id: generateId(), role: 'user', type: 'chat', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            const response = await apiFetch(`${BACKEND_URL}/api/v1/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    history: messages.slice(-5).map(m => ({ role: m.role, text: m.text })),
                    newMessage: userMsg.text
                })
            });

            fetchTokenUsage();

            if (response.status === 429) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const resetTime = tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setMessages(prev => [...prev, {
                    id: generateId(),
                    role: 'ai',
                    type: 'chat',
                    text: `You've reached your daily limit of 20,000 tokens. Your allowance resets at midnight (${resetTime}). Come back tomorrow!`
                }]);
                return;
            }

            if (!response.ok) throw new Error("Failed to reach AI");
            const aiResponse = await response.json();

            setMessages(prev => [...prev, {
                id: generateId(),
                role: 'ai',
                type: aiResponse.response_type || 'chat',
                text: aiResponse.text,
                planData: aiResponse.plan_data
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: generateId(),
                role: 'ai',
                type: 'chat',
                text: "Sorry, I'm having trouble connecting right now."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const buildMappedExercises = (planData: any): PlannedExercise[] => {
        return planData.exercises.map((aiEx: any) => {
            const queryName = aiEx.wger_search_query || aiEx.name;
            const bestMatch = (ExerciseDB as any[]).find((dbEx: any) =>
                dbEx.displayName?.toLowerCase() === queryName?.toLowerCase() ||
                dbEx.name?.toLowerCase() === queryName?.toLowerCase()
            );
            const sets = Array.from({ length: aiEx.sets || 3 }).map(() => ({
                id: generateId(), weight: '', reps: String(aiEx.target_reps ?? 10), completed: false
            }));
            if (bestMatch) {
                return {
                    uniqueId: generateId(),
                    wgerData: { ...bestMatch, displayName: bestMatch.displayName || bestMatch.name },
                    sets,
                } as PlannedExercise;
            }
            return {
                uniqueId: generateId(),
                wgerData: { id: Math.floor(Math.random() * -10000), name: queryName, displayName: queryName, category: { id: 1, name: "AI Generated" } },
                sets,
            } as PlannedExercise;
        });
    };

    const handleViewPlan = (planData: any) => {
        const exercises = buildMappedExercises(planData);
        setPreviewPlan({
            planName: planData.name || "AI Workout Plan",
            exercises,
            creatorName: "AI Trainer",
            creatorPhoto: "",
        });
    };

    const handleImportPlan = () => {
        if (!previewPlan) return;
        setIsImporting(true);
        try {
            savePlan(previewPlan.planName, previewPlan.exercises);
            setPreviewPlan(null);
            setMessages(prev => [...prev, { id: generateId(), role: 'ai', type: 'chat', text: `Done! "${previewPlan.planName}" has been saved to your Dashboard.` }]);
        } catch {
            Alert.alert("Error", "Could not import plan.");
        } finally {
            setIsImporting(false);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        
        const markdownStyles = StyleSheet.create({
            body: {
                color: isUser ? '#ffffff' : '#e4e4e7',
                fontSize: 16,
                lineHeight: 24,
            },
            strong: {
                fontWeight: 'bold',
                color: isUser ? '#ffffff' : '#f4f4f5',
            },
            em: {
                fontStyle: 'italic',
            },
            paragraph: {
                marginTop: 0,
                marginBottom: 10,
            },
            bullet_list: {
                marginBottom: 10,
            },
            ordered_list: {
                marginBottom: 10,
            },
            bullet_list_icon: {
                color: isUser ? '#ffffff' : '#e4e4e7',
            }
        });

        return (
            <View className={`mb-4 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
                <View className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-primary rounded-tr-sm' : 'bg-surface-dark rounded-tl-sm border border-surface'}`}>
                    {/* Only render Markdown when text is present — empty strings cause a crash */}
                    {item.text ? (
                        <View style={{ marginBottom: -10 }}>
                            <Markdown style={markdownStyles}>
                                {item.text}
                            </Markdown>
                        </View>
                    ) : (
                        <Text className="text-zinc-400 italic">Here is your plan!</Text>
                    )}
                </View>

                {item.type === 'plan' && item.planData && (
                    <Card
                        className="mt-2 p-4 border border-indigo-500/30 bg-indigo-500/5"
                        style={{ width: Dimensions.get('window').width * 0.72 }}
                    >
                        <View className="flex-row items-center mb-3">
                            <Feather name="zap" size={18} color="#6366f1" />
                            <Text variant="h3" className="ml-2 flex-1" numberOfLines={1}>{item.planData.name}</Text>
                        </View>
                        <Text color="muted" variant="caption" className="mb-4">
                            {item.planData.exercises?.length} exercises
                        </Text>
                        <Button
                            title="View Plan"
                            variant="secondary"
                            onPress={() => handleViewPlan(item.planData)}
                        />
                    </Card>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: insets.top }}>
            <View className="flex-row items-center justify-between p-4 border-b border-surface">
                <Text variant="h1">AI Coach</Text>
                {tokensUsed !== null && (() => {
                    const remaining = dailyLimit - tokensUsed;
                    const isOut = remaining <= 0;
                    const isLow = remaining <= 2000 && !isOut;
                    const pillBg = isOut ? '#7f1d1d' : isLow ? '#78350f' : '#27272a';
                    const pillText = isOut ? 'Limit reached' : `${remaining.toLocaleString()} tokens left`;
                    const dotColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';
                    return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 6 }} />
                            <Text style={{ color: '#e4e4e7', fontSize: 12 }}>{pillText}</Text>
                        </View>
                    );
                })()}
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }} 
                behavior="padding"
                keyboardVerticalOffset={0}
            >
                <FlatList
                    style={{ flex: 1 }}
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <View 
                    className="pt-4 px-4 bg-background border-t border-surface flex-row items-center"
                    style={{ paddingBottom: Math.max(insets.bottom, 16) }} 
                >
                    <TextInput
                        className="flex-1 bg-surface-dark text-text px-4 py-3 rounded-full border border-surface-light mr-3"
                        placeholder="Ask for advice..."
                        placeholderTextColor="#a1a1aa"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <Pressable 
                        onPress={sendMessage} 
                        disabled={!inputText.trim() || isTyping} 
                        className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-surface'}`}
                    >
                        {isTyping ? <ActivityIndicator color="white" /> : <Feather name="send" size={20} color={inputText.trim() ? "white" : "#52525b"} />}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>

            {previewPlan && (
                <SharedPlanPanel
                    isVisible={true}
                    plan={previewPlan}
                    onClose={() => setPreviewPlan(null)}
                    onImport={handleImportPlan}
                    isImporting={isImporting}
                />
            )}
        </View>
    );
};