import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/context/ThemeContext';
import { Calendar } from 'react-native-calendars';
import { useHistoryStore } from '@/store/historyStore';
import { CompletedWorkout } from '@/types';
import HistoryCard from '@/components/HistoryCard';
import HistoryDetailModal from '@/components/HistoryDetailModal';
import AnimatedModal from '@/components/ui/AnimatedModal';
import { Text } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { useLocalSearchParams } from 'expo-router';

const CATEGORIES = ['Abs', 'Arms', 'Back', 'Calves', 'Cardio', 'Chest', 'Legs', 'Shoulders'] as const;

type Category = typeof CATEGORIES[number];

// Background, border, and text colors per category
const CATEGORY_COLORS: Record<Category, { bg: string; border: string; text: string }> = {
    Abs:       { bg: 'bg-yellow-500/20',  border: 'border-yellow-500/50',  text: 'text-yellow-400'  },
    Arms:      { bg: 'bg-blue-500/20',    border: 'border-blue-500/50',    text: 'text-blue-400'    },
    Back:      { bg: 'bg-purple-500/20',  border: 'border-purple-500/50',  text: 'text-purple-400'  },
    Calves:    { bg: 'bg-green-500/20',   border: 'border-green-500/50',   text: 'text-green-400'   },
    Cardio:    { bg: 'bg-red-500/20',     border: 'border-red-500/50',     text: 'text-red-400'     },
    Chest:     { bg: 'bg-orange-500/20',  border: 'border-orange-500/50',  text: 'text-orange-400'  },
    Legs:      { bg: 'bg-pink-500/20',    border: 'border-pink-500/50',    text: 'text-pink-400'    },
    Shoulders: { bg: 'bg-cyan-500/20',    border: 'border-cyan-500/50',    text: 'text-cyan-400'    },
};

export const History = () => {
    const { workoutHistory } = useHistoryStore();
    const colors = useThemeColors();
    const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkout | null>(null);
    const params = useLocalSearchParams();

    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [nameQuery, setNameQuery] = useState('');

    // Pre-populate the date filter when navigating here from the activity calendar
    useEffect(() => {
        if (params.selectedDate && typeof params.selectedDate === 'string') {
            setStartDate(params.selectedDate);
            setEndDate(params.selectedDate);
        }
    }, [params.selectedDate]);

    const hasActiveFilters = !!(startDate || selectedCategories.size > 0 || nameQuery.trim());

    const clearAllFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedCategories(new Set());
        setNameQuery('');
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    const filteredHistory = useMemo(() => {
        return workoutHistory.filter(w => {
            if (nameQuery.trim() && !w.planName.toLowerCase().includes(nameQuery.trim().toLowerCase())) {
                return false;
            }
            const workoutDate = w.dateCompleted.split('T')[0];
            if (startDate && workoutDate < startDate) return false;
            if (endDate && workoutDate > endDate) return false;
            if (selectedCategories.size > 0) {
                const hasMatch = w.exercises.some(ex =>
                    ex.wgerData?.category?.name && selectedCategories.has(ex.wgerData.category.name)
                );
                if (!hasMatch) return false;
            }
            return true;
        });
    }, [workoutHistory, startDate, endDate, selectedCategories, nameQuery]);

    const handleDayPress = (day: any) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(day.dateString);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (day.dateString < startDate) {
                setEndDate(startDate);
                setStartDate(day.dateString);
            } else {
                setEndDate(day.dateString);
            }
        }
    };

    const markedDates = useMemo(() => {
        const marks: any = {};
        if (startDate && startDate === endDate) {
            marks[startDate] = { startingDay: true, endingDay: true, color: '#3b82f6', textColor: 'white' };
        } else {
            if (startDate) marks[startDate] = { startingDay: true, color: '#3b82f6', textColor: 'white' };
            if (endDate) marks[endDate] = { endingDay: true, color: '#3b82f6', textColor: 'white' };
            if (startDate && endDate) {
                let curr = new Date(startDate);
                const end = new Date(endDate);
                curr.setDate(curr.getDate() + 1);
                while (curr < end) {
                    marks[curr.toISOString().split('T')[0]] = { color: '#1e3a8a', textColor: 'white' };
                    curr.setDate(curr.getDate() + 1);
                }
            }
        }
        return marks;
    }, [startDate, endDate]);

    const formatDateLabel = () => {
        if (!startDate) return "Date";
        const fmt = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        if (!endDate || startDate === endDate) return fmt(startDate);
        return `${fmt(startDate)} – ${fmt(endDate)}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-4">

            <View className="flex-row justify-between items-end mb-4 mt-4 px-1">
                <Text variant="h1">History</Text>
                <Text color="primary" variant="caption" className="mb-1.5 font-bold">
                    {filteredHistory.length} {filteredHistory.length === 1 ? 'Workout' : 'Workouts'}
                </Text>
            </View>

            {/* Name search */}
            <View className="flex-row items-center bg-surface border border-surface-light rounded-2xl px-4 mb-3">
                <Feather name="search" size={16} color="#a1a1aa" />
                <TextInput
                    className="flex-1 text-text py-3 ml-3 text-base"
                    placeholder="Search by plan name..."
                    placeholderTextColor="#52525b"
                    value={nameQuery}
                    onChangeText={setNameQuery}
                />
                {nameQuery.length > 0 && (
                    <Pressable onPress={() => setNameQuery('')}>
                        <Feather name="x" size={16} color="#a1a1aa" />
                    </Pressable>
                )}
            </View>

            {/* Filter trigger row: date button + category button + clear */}
            <View className="flex-row items-center gap-2 mb-3">
                <Pressable
                    onPress={() => setIsDateModalOpen(true)}
                    className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                        startDate ? 'bg-primary/20 border-primary/50' : 'bg-surface border-surface-light active:bg-surface-light'
                    }`}
                >
                    <Feather name="calendar" size={13} color={startDate ? "#60a5fa" : "#a1a1aa"} />
                    <Text className={`ml-1.5 text-sm font-medium ${startDate ? 'text-primary-light' : 'text-text-muted'}`}>
                        {formatDateLabel()}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setIsCategoryModalOpen(true)}
                    className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                        selectedCategories.size > 0 ? 'bg-primary/20 border-primary/50' : 'bg-surface border-surface-light active:bg-surface-light'
                    }`}
                >
                    <Feather name="tag" size={13} color={selectedCategories.size > 0 ? "#60a5fa" : "#a1a1aa"} />
                    <Text className={`ml-1.5 text-sm font-medium ${selectedCategories.size > 0 ? 'text-primary-light' : 'text-text-muted'}`}>
                        {selectedCategories.size > 0 ? `${selectedCategories.size} ${selectedCategories.size === 1 ? 'Category' : 'Categories'}` : 'Category'}
                    </Text>
                    <Feather name="chevron-down" size={13} color={selectedCategories.size > 0 ? "#60a5fa" : "#a1a1aa"} className="ml-1" />
                </Pressable>

                {hasActiveFilters && (
                    <Pressable onPress={clearAllFilters} className="p-2 bg-surface rounded-full active:bg-surface-light">
                        <Feather name="x" size={16} color="#a1a1aa" />
                    </Pressable>
                )}
            </View>

            {/* Selected category pills — only shown when categories are active */}
            {selectedCategories.size > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ gap: 6, alignItems: 'center' }}
                >
                    {[...selectedCategories].map(cat => {
                        const c = CATEGORY_COLORS[cat as Category];
                        return (
                            <Pressable
                                key={cat}
                                onPress={() => toggleCategory(cat)}
                                className={`flex-row items-center ${c.bg} border ${c.border} px-3 py-1.5 rounded-full`}
                            >
                                <Text className={`${c.text} text-sm font-medium mr-1.5`}>{cat}</Text>
                                <Feather name="x" size={11} color="#a1a1aa" />
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {/* History list */}
            <View className="flex-1 pb-4">
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredHistory.length === 0 ? (
                        <View className="items-center justify-center py-20 mt-10">
                            <Feather name="search" size={48} color="#3f3f46" className="mb-4" />
                            <Text color="muted" variant="h3">
                                {workoutHistory.length === 0 ? "No workouts logged yet." : "No workouts found."}
                            </Text>
                            <Text color="dark" variant="caption" className="mt-1 text-center px-6">
                                {workoutHistory.length === 0 ? "Go hit the gym!" : "Try adjusting your filters."}
                            </Text>
                        </View>
                    ) : (
                        filteredHistory.map((workout) => (
                            <HistoryCard
                                key={workout.id}
                                workout={workout}
                                onPress={() => setSelectedWorkout(workout)}
                            />
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Date range picker modal — conditionally mounted so translateY always resets to 0 on open */}
            {isDateModalOpen && <AnimatedModal isVisible={true} onClose={() => setIsDateModalOpen(false)} heightClass="h-[75%]">
                <View className="w-full flex-1">
                    <View className="flex-row justify-between items-center mb-4 px-2">
                        <Text variant="h2">Select Date Range</Text>
                        {startDate && (
                            <Pressable onPress={() => { setStartDate(null); setEndDate(null); }}>
                                <Text color="primary" variant="caption">Clear</Text>
                            </Pressable>
                        )}
                    </View>
                    <View className="rounded-2xl overflow-hidden border border-surface-light">
                        <Calendar
                            markingType="period"
                            markedDates={markedDates}
                            onDayPress={handleDayPress}
                            theme={{
                                backgroundColor: colors.card,
                                calendarBackground: colors.card,
                                textSectionTitleColor: colors.textMuted,
                                monthTextColor: colors.text,
                                dayTextColor: colors.text,
                                arrowColor: colors.textMuted,
                                todayTextColor: '#3b82f6',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                        />
                    </View>
                    <View className="mt-auto pb-6 pt-4 px-2">
                        <Button title="Done" onPress={() => setIsDateModalOpen(false)} />
                    </View>
                </View>
            </AnimatedModal>}

            {/* Category multi-select modal — conditionally mounted so translateY always resets to 0 on open */}
            {isCategoryModalOpen && <AnimatedModal isVisible={true} onClose={() => setIsCategoryModalOpen(false)} heightClass="h-[50%]">
                <View className="w-full flex-1">
                    <View className="flex-row justify-between items-center mb-6 px-2">
                        <Text variant="h2">Filter by Category</Text>
                        {selectedCategories.size > 0 && (
                            <Pressable onPress={() => setSelectedCategories(new Set())}>
                                <Text color="primary" variant="caption">Clear</Text>
                            </Pressable>
                        )}
                    </View>

                    <View className="flex-row flex-wrap gap-3 px-2">
                        {CATEGORIES.map(cat => {
                            const active = selectedCategories.has(cat);
                            const c = CATEGORY_COLORS[cat];
                            return (
                                <Pressable
                                    key={cat}
                                    onPress={() => toggleCategory(cat)}
                                    className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${
                                        active ? `${c.bg} ${c.border}` : 'bg-surface border-surface-light active:bg-surface-light'
                                    }`}
                                >
                                    {active && <Feather name="check" size={13} color="#a1a1aa" style={{ marginRight: 6 }} />}
                                    <Text className={`font-medium ${active ? c.text : 'text-text-muted'}`}>
                                        {cat}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View className="mt-auto pb-6 pt-4 px-2">
                        <Button title="Done" onPress={() => setIsCategoryModalOpen(false)} />
                    </View>
                </View>
            </AnimatedModal>}

            <HistoryDetailModal
                workout={selectedWorkout}
                onClose={() => setSelectedWorkout(null)}
            />
        </SafeAreaView>
    );
};
