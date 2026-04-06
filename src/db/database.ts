import * as SQLite from 'expo-sqlite';
import { CompletedWorkout } from '@/types';
import * as Crypto from 'expo-crypto';

// Single shared connection — expo-sqlite native handles are not safe to
// re-open on every call; a stale handle causes NullPointerException on Android.
let dbInstance: SQLite.SQLiteDatabase | null = null;

const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync('fitness.db');
    }
    return dbInstance;
}

export const initDB = async () => {
    try {
        const db = await getDB();

        await db.execAsync(`
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS workout_history (
                id TEXT PRIMARY KEY NOT NULL,
                plan_id TEXT NOT NULL,
                plan_name TEXT NOT NULL,
                date_completed TEXT NOT NULL,
                exercises_data TEXT NOT NULL,
                duration_seconds INTEGER NOT NULL DEFAULT 0,
                is_synced INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                updated_at TEXT NOT NULL
            );
        `);

        // Add duration_seconds to existing installs that pre-date this column.
        // ALTER TABLE errors if the column already exists, so we catch and ignore.
        try {
            await db.execAsync(`ALTER TABLE workout_history ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 0;`);
        } catch (_) {
            // Column already exists — safe to continue
        }

        console.log('SQLite DB initialized.');
    } catch (error) {
        console.log('Error initializing DB:', error);
    }
}

// Accepts an optional isSynced flag so server-pulled records aren't immediately re-pushed
export const insertWorkout = async (workout: CompletedWorkout, isSynced: boolean = false) => {
    const db = await getDB();

    // Normalize field names from both camelCase (local) and snake_case (server) responses
    const id = workout.id || (workout as any)._id || (workout as any).ID || Crypto.randomUUID();
    const planId = workout.planId || (workout as any).plan_id || 'unknown_plan';
    const planName = workout.planName || (workout as any).plan_name || 'Unknown Plan';
    const dateCompleted = workout.dateCompleted || (workout as any).date_completed || new Date().toISOString();
    const durationSeconds = workout.durationSeconds || (workout as any).duration_seconds || 0;

    const exercises = typeof workout.exercises === 'string'
        ? JSON.parse(workout.exercises)
        : (workout.exercises || []);

    await db.runAsync(
        `INSERT OR REPLACE INTO workout_history
        (id, plan_id, plan_name, date_completed, exercises_data, duration_seconds, is_synced, is_deleted, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        planId,
        planName,
        dateCompleted,
        JSON.stringify(exercises),
        durationSeconds,
        isSynced ? 1 : 0,
        0,
        dateCompleted
    );
};

export const getWorkoutHistory = async (): Promise<CompletedWorkout[]> => {
    const db = await getDB();
    const rows = await db.getAllAsync(
        `SELECT * FROM workout_history WHERE is_deleted = 0 ORDER BY date_completed DESC`
    );
    return rows.map((row: any) => ({
        id: row.id,
        planId: row.plan_id,
        planName: row.plan_name,
        dateCompleted: row.date_completed,
        durationSeconds: row.duration_seconds ?? 0,
        exercises: JSON.parse(row.exercises_data)
    }));
}

export const getUnsyncedWorkouts = async (): Promise<CompletedWorkout[]> => {
    const db = await getDB();
    const rows = await db.getAllAsync(
        `SELECT * FROM workout_history WHERE is_synced = 0 AND is_deleted = 0`
    );
    return rows.map((row: any) => ({
        id: row.id,
        planId: row.plan_id,
        planName: row.plan_name,
        dateCompleted: row.date_completed,
        durationSeconds: row.duration_seconds ?? 0,
        exercises: JSON.parse(row.exercises_data)
    }));
}

export const markWorkoutsAsSynced = async (ids: string[]) => {
    if (ids.length === 0) return;
    const db = await getDB();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
        `UPDATE workout_history SET is_synced = 1 WHERE id IN (${placeholders})`,
        ...ids
    );
}

export const clearWorkoutHistory = async () => {
    const db = await getDB();
    await db.runAsync(`DELETE FROM workout_history`);
    console.log('Local SQLite history cleared.');
}
