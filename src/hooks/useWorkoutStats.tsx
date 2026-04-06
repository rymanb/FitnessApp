import { useMemo } from 'react';
import { CompletedWorkout, WgerExercise } from '@/types';

export function useWorkoutStats(workoutHistory: CompletedWorkout[]) {
    return useMemo(() => {
        let totalVolume = 0;
        let totalSets = 0;
        const weeksMap: Record<string, number> = {};
        const exerciseFrequency: Record<number, { wgerData: WgerExercise, count: number }> = {};
        const exerciseProgress: Record<number, { value: number, label: string, date: Date, sessionVolume: number }[]> = {};

        workoutHistory.forEach(workout => {
            const date = new Date(workout.dateCompleted);
            const weekYear = `${date.getFullYear()}-${Math.ceil(date.getDate() / 7)}`;
            weeksMap[weekYear] = (weeksMap[weekYear] || 0) + 1;

            workout.exercises.forEach(ex => {
                const exId = ex.wgerData.id;

                if (!exerciseFrequency[exId]) {
                    exerciseFrequency[exId] = { wgerData: ex.wgerData, count: 0 };
                    exerciseProgress[exId] = [];
                }
                exerciseFrequency[exId].count += 1;

                let sessionMaxWeight = 0;
                let sessionVolume = 0;
                ex.sets.forEach(set => {
                    totalSets += 1;
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseInt(set.reps) || 0;
                    totalVolume += weight * reps;
                    sessionVolume += weight * reps;
                    if (weight > sessionMaxWeight) sessionMaxWeight = weight;
                });

                if (sessionMaxWeight > 0) {
                    exerciseProgress[exId].push({
                        value: sessionMaxWeight,
                        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        date: date,
                        sessionVolume,
                    });
                }
            });
        });

        const weeklyCounts = Object.values(weeksMap);
        const recordWeek = weeklyCounts.length > 0 ? Math.max(...weeklyCounts) : 0;
        const avgWeek = weeklyCounts.length > 0 ? (weeklyCounts.reduce((a, b) => a + b, 0) / weeklyCounts.length).toFixed(1) : 0;

        // Use real recorded duration where available, fall back to a set-based estimate for older records
        const timed = workoutHistory.filter(w => w.durationSeconds > 0);
        const avgWorkoutLength = timed.length > 0
            ? Math.round(timed.reduce((sum, w) => sum + w.durationSeconds, 0) / timed.length / 60)
            : workoutHistory.length > 0 ? Math.round((totalSets * 3) / workoutHistory.length) : 0;

        const top3 = Object.values(exerciseFrequency)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(e => e.wgerData);

        return { totalVolume, recordWeek, avgWeek, avgWorkoutLength, exerciseProgress, top3 };
    }, [workoutHistory]);
}