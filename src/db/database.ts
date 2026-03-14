import * as SQLite from 'expo-sqlite';
import { CompletedWorkout } from '@/types';

export const getDB = async () => {
    return await SQLite.openDatabaseAsync('fitness.db');
}

export const initDB = async () => {
    try {
        const db = await getDB();



        await db.execAsync(`
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS workout_history (
                id TEXT PRIMARY_KEY NOT NULL,
                plan_id TEXT NOT NULL,
                plan_name TEXT NOT NULL,
                date_completed TEXT NOT NULL,
                exercises_data TEXT NOT NULL,
                is_synced INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                updated_at TEXT NOT NULL
            );
        `);

        console.log('SQLite DB initialized successfully');
    } catch (error) {
        console.log('Error initializing db:', error);
    }
}

export const insertWorkout = async (workout: CompletedWorkout) => {
    const db = await getDB();

    await db.runAsync(
        `INSERT INTO workout_history
        (id, plan_id, plan_name, date_completed, exercises_data, is_synced, is_deleted, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            workout.id,
            workout.planId,
            workout.planName,
            workout.dateCompleted,
            JSON.stringify(workout.exercises),
            0,
            0,
            new Date().toISOString()
        ]
    );
};

export const getWorkoutHistory = async (): Promise<CompletedWorkout[]> => {
    const db = await getDB();

    const rows = await db.getAllAsync(
        `SELECT * FROM workout_history WHERE is_deleted = 0 ORDER BY date_completed DESC`
    );

    console.log("Raw DB Data:", rows);

    return rows.map((row: any) => ({
        id: row.id,
        planId: row.plan_id,
        planName: row.plan_name,
        dateCompleted: row.date_completed,
        exercises: JSON.parse(row.exercises_data)
    }));
}