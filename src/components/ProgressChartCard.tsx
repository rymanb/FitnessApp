import React, { useMemo, useState } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { WgerExercise } from '@/types';

const screenWidth = Dimensions.get('window').width;

interface DataPoint {
    value: number;
    label: string;
    date: Date;
    sessionVolume: number;
}

interface ProgressChartCardProps {
    exercise: WgerExercise;
    allData: DataPoint[];
    isManuallyTracked: boolean;
    onRemove: () => void;
}

const TIME_RANGES = ['1M', '3M', '6M', 'ALL'] as const;
type TimeRange = typeof TIME_RANGES[number];

export default function ProgressChartCard({ exercise, allData, isManuallyTracked, onRemove }: ProgressChartCardProps) {
    const [tab, setTab] = useState<'chart' | 'stats'>('stats');
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

    const filteredData = useMemo(() => {
        const cutoff = new Date();
        if (timeRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
        else if (timeRange === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
        else if (timeRange === '6M') cutoff.setMonth(cutoff.getMonth() - 6);
        else cutoff.setTime(0);

        const rawFiltered = allData.filter(d => d.date.getTime() >= cutoff.getTime());
        const grouped = new Map<string, DataPoint>();

        const oldestDate = rawFiltered.length > 0 ? rawFiltered[rawFiltered.length - 1].date : new Date();
        const daysDiff = (new Date().getTime() - oldestDate.getTime()) / (1000 * 3600 * 24);

        rawFiltered.forEach(point => {
            let bucketKey = '';
            let bucketLabel = '';

            if (timeRange === '1M' || (timeRange === 'ALL' && daysDiff <= 60)) {
                bucketKey = point.date.toISOString().split('T')[0];
                bucketLabel = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (timeRange === '3M' || timeRange === '6M' || (timeRange === 'ALL' && daysDiff <= 180)) {
                const d = new Date(point.date);
                d.setDate(d.getDate() - d.getDay());
                bucketKey = d.toISOString().split('T')[0];
                bucketLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                bucketKey = `${point.date.getFullYear()}-${point.date.getMonth()}`;
                bucketLabel = point.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }

            if (grouped.has(bucketKey)) {
                const existing = grouped.get(bucketKey)!;
                if (point.value > existing.value) {
                    existing.value = point.value;
                    existing.date = point.date;
                }
            } else {
                grouped.set(bucketKey, { ...point, label: bucketLabel });
            }
        });

        return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [allData, timeRange]);

    const stats = useMemo(() => {
        if (allData.length === 0) return null;

        const sorted = [...allData].sort((a, b) => a.date.getTime() - b.date.getTime());
        const maxWeightPoint = allData.reduce((best, d) => d.value > best.value ? d : best, allData[0]);
        const maxVolumePoint = allData.reduce((best, d) => d.sessionVolume > best.sessionVolume ? d : best, allData[0]);
        const totalVolume = allData.reduce((sum, d) => sum + d.sessionVolume, 0);

        const recent = sorted.slice(-5);
        let trend: 'up' | 'down' | 'flat' = 'flat';
        if (recent.length >= 2) {
            const delta = recent[recent.length - 1].value - recent[0].value;
            if (delta > 0) trend = 'up';
            else if (delta < 0) trend = 'down';
        }

        const prDate = maxWeightPoint.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

        return {
            timesPerformed: allData.length,
            maxWeight: maxWeightPoint.value,
            prDate,
            maxSessionVolume: maxVolumePoint.sessionVolume,
            totalVolume,
            trend,
        };
    }, [allData]);

    const trendLabel = stats?.trend === 'up' ? 'Improving' : stats?.trend === 'down' ? 'Declining' : 'Steady';
    const trendIcon: React.ComponentProps<typeof Feather>['name'] = stats?.trend === 'up' ? 'trending-up' : stats?.trend === 'down' ? 'trending-down' : 'minus';
    const trendColor = stats?.trend === 'up' ? '#22c55e' : stats?.trend === 'down' ? '#ef4444' : '#a1a1aa';

    return (
        <Card className="mb-4">
            {/* Header */}
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                    <Text variant="h3">{exercise.displayName}</Text>
                    {allData.length > 0 && (
                        <Text color="primary" className="font-bold text-lg mt-1">
                            {allData[allData.length - 1].value} lbs
                        </Text>
                    )}
                </View>
                {isManuallyTracked && (
                    <Pressable onPress={onRemove} className="p-2 -mr-2 -mt-2 active:opacity-50">
                        <Feather name="trash-2" size={16} color="#ef4444" />
                    </Pressable>
                )}
            </View>

            {/* Tab switcher */}
            <View className="flex-row bg-surface-dark p-1 rounded-xl mb-5">
                <Pressable
                    onPress={() => setTab('stats')}
                    className={`flex-1 py-1.5 items-center rounded-lg ${tab === 'stats' ? 'bg-surface border border-surface-light' : ''}`}
                >
                    <Text className={`text-xs font-bold ${tab === 'stats' ? 'text-primary-light' : 'text-text-muted'}`}>Stats</Text>
                </Pressable>
                <Pressable
                    onPress={() => setTab('chart')}
                    className={`flex-1 py-1.5 items-center rounded-lg ${tab === 'chart' ? 'bg-surface border border-surface-light' : ''}`}
                >
                    <Text className={`text-xs font-bold ${tab === 'chart' ? 'text-primary-light' : 'text-text-muted'}`}>Chart</Text>
                </Pressable>
            </View>

            {tab === 'chart' ? (
                <>
                    {/* Time range selector */}
                    <View className="flex-row bg-surface-dark p-1 rounded-xl mb-6">
                        {TIME_RANGES.map(range => (
                            <Pressable
                                key={range}
                                onPress={() => setTimeRange(range)}
                                className={`flex-1 py-1.5 items-center rounded-lg ${timeRange === range ? 'bg-surface border border-surface-light' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${timeRange === range ? 'text-primary-light' : 'text-text-muted'}`}>
                                    {range}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {filteredData.length < 2 ? (
                        <View className="h-[150px] items-center justify-center">
                            <Feather name="trending-up" size={24} color="#3f3f46" className="mb-2" />
                            <Text color="muted" variant="caption">Not enough data for this timeframe.</Text>
                        </View>
                    ) : (
                        <View className="-ml-2 items-center">
                            <LineChart
                                data={filteredData}
                                width={screenWidth - 110}
                                height={170}
                                thickness={3}
                                color="#3b82f6"
                                hideYAxisText={false}
                                yAxisTextStyle={{ color: '#a1a1aa', fontSize: 11 }}
                                yAxisLabelWidth={35}
                                hideRules={false}
                                rulesColor="#27272a"
                                rulesType="dashed"
                                yAxisThickness={0}
                                xAxisThickness={1}
                                xAxisColor="#3f3f46"
                                dataPointsColor="#60a5fa"
                                dataPointsRadius={4}
                                initialSpacing={20}
                                spacing={Math.max((screenWidth - 160) / filteredData.length, 50)}
                                xAxisLabelTextStyle={{ color: '#a1a1aa', fontSize: 10, marginTop: 4 }}
                                pointerConfig={{
                                    pointerStripHeight: 160,
                                    pointerStripColor: '#52525b',
                                    pointerStripWidth: 2,
                                    pointerColor: '#60a5fa',
                                    radius: 6,
                                    pointerLabelWidth: 100,
                                    pointerLabelHeight: 60,
                                    activatePointersOnLongPress: false,
                                    persistPointer: true,
                                    shiftPointerLabelX: -40,
                                    shiftPointerLabelY: -70,
                                    autoAdjustPointerLabelPosition: true,
                                    pointerLabelComponent: (items: any) => {
                                        const item = items[0];
                                        return (
                                            <View
                                                style={{ zIndex: 1000, elevation: 10 }}
                                                className="bg-surface-dark px-3 py-2 rounded-xl border border-surface shadow-md items-center justify-center"
                                            >
                                                <Text color="primary" className="font-bold text-sm">{item.value} lbs</Text>
                                                <Text color="muted" className="text-[10px] mt-0.5">{item.label}</Text>
                                            </View>
                                        );
                                    },
                                }}
                            />
                        </View>
                    )}
                </>
            ) : (
                <>
                    {!stats ? (
                        <View className="h-[150px] items-center justify-center">
                            <Text color="muted" variant="caption">No data yet.</Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            <View className="flex-row gap-3">
                                <StatCard icon="repeat" iconColor="#60a5fa" value={String(stats.timesPerformed)} label="Times Done" />
                                <StatCard icon={trendIcon} iconColor={trendColor} value={trendLabel} label="Trend" />
                            </View>
                            <View className="flex-row gap-3">
                                <StatCard icon="award" iconColor="#f59e0b" value={`${stats.maxWeight} lbs`} label="Max Weight" sub={stats.prDate} />
                                <StatCard icon="zap" iconColor="#a78bfa" value={`${(stats.maxSessionVolume / 1000).toFixed(1)}k`} label="Best Session" sub="lbs total vol." />
                            </View>
                            <Card className="items-center p-4">
                                <Feather name="layers" size={20} color="#60a5fa" className="mb-2" />
                                <Text variant="h2">{(stats.totalVolume / 1000).toFixed(1)}<Text variant="body" color="muted">k lbs</Text></Text>
                                <Text color="muted" variant="caption">Total Volume Lifted</Text>
                            </Card>
                        </View>
                    )}
                </>
            )}
        </Card>
    );
}

interface StatCardProps {
    icon: React.ComponentProps<typeof Feather>['name'];
    iconColor: string;
    value: string;
    label: string;
    sub?: string;
}

function StatCard({ icon, iconColor, value, label, sub }: StatCardProps) {
    return (
        <Card className="flex-1 items-center p-4">
            <Feather name={icon} size={20} color={iconColor} className="mb-2" />
            <Text variant="h2">{value}</Text>
            <Text color="muted" variant="caption">{label}</Text>
            {sub && <Text color="muted" className="text-[10px] mt-0.5">{sub}</Text>}
        </Card>
    );
}
