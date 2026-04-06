import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Calendar, WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useHistoryStore } from '@/store/historyStore';
import { Text } from '@/components/ui/Typography';
import { Card } from './ui/Card';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function ActivityChart() {
    const { workoutHistory } = useHistoryStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const colors = useThemeColors();

    const [calendarWidth, setCalendarWidth] = useState(0);

    const onDayPress = (day: any) => {
        router.push({
            pathname: '/history',
            params: { selectedDate: day.dateString }
        });
    };

    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};
        const todayStr = new Date().toISOString().split('T')[0];

        const workoutStyle = {
            container: {
                backgroundColor: '#3b82f6',
                borderRadius: 16,
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
            },
            text: { color: '#ffffff', fontWeight: '500' as const }
        };

        const todayStyle = {
            container: {
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
            },
            text: { color: '#3b82f6', fontWeight: 'bold' as const }
        };

        workoutHistory.forEach(workout => {
            const dateStr = workout.dateCompleted.split('T')[0];
            marks[dateStr] = { customStyles: workoutStyle };
        });

        // Style today even if no workout was logged
        if (!marks[todayStr]) {
            marks[todayStr] = { customStyles: todayStyle };
        }

        return marks;
    }, [workoutHistory]);

    // Override internal calendar margins so day numbers are centered correctly.
    // Memoized so react-native-calendars detects the change and remounts its
    // internal stylesheet when the color scheme switches.
    const themeSettings: any = useMemo(() => ({
        backgroundColor: colors.card,
        calendarBackground: colors.card,
        textSectionTitleColor: colors.textMuted,
        monthTextColor: colors.text,
        dayTextColor: colors.text,
        arrowColor: colors.textMuted,
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '600',
        selectedDayBackgroundColor: 'transparent',
        selectedDayTextColor: colors.text,
        todayBackgroundColor: 'transparent',
        'stylesheet.day.custom': {
            base: {
                width: 32,
                height: 32,
                alignItems: 'center',
            },
            text: {
                marginTop: 0,
                marginBottom: 0,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: '500',
                color: colors.text,
            }
        }
    }), [colors]);

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <Card className="mb-6 mx-1">
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text variant="h3">Consistency</Text>
                    <Text color="muted" variant="caption">Days you hit the gym</Text>
                </View>

                <Pressable
                    onPress={() => setIsExpanded(!isExpanded)}
                    className="flex-row items-center bg-card-dark px-3 py-1.5 rounded-full active:bg-card-light mt-1"
                >
                    <Text color="primary" variant="caption" className="mr-1">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </Text>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#60a5fa" />
                </Pressable>
            </View>

            <View className="rounded-2xl overflow-hidden border border-card-light">
                <View onLayout={(event) => setCalendarWidth(event.nativeEvent.layout.width)}>
                    <CalendarProvider date={todayStr}>
                        {isExpanded ? (
                            <Calendar
                                key={colors.card}
                                hideExtraDays={true}
                                markingType="custom"
                                markedDates={markedDates}
                                theme={themeSettings}
                                onDayPress={onDayPress}
                            />
                        ) : (
                            calendarWidth > 0 && (
                                <WeekCalendar
                                    key={colors.card}
                                    firstDay={0}
                                    markingType="custom"
                                    markedDates={markedDates}
                                    theme={themeSettings}
                                    calendarWidth={calendarWidth}
                                    allowShadow={false}
                                    onDayPress={onDayPress}
                                />
                            )
                        )}
                    </CalendarProvider>
                </View>
            </View>
        </Card>
    );
}
