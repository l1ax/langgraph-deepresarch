import { Pool } from 'pg';
import { BaseEvent } from '../outputAdapters';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function getNextSequence(threadId: string): Promise<number> {
    try {
        const result = await pool.query(
            'SELECT COALESCE(MAX(sequence), 0) as max_seq FROM "Event" WHERE "threadId" = $1',
            [threadId]
        );
        const maxSeq = result.rows[0]?.max_seq || 0;
        return maxSeq + 1;
    } catch (error) {
        console.error('[EventStore] Failed to get max sequence:', error);
        return Date.now();
    }
}

export async function upsertEvent(threadId: string, event: BaseEvent.IJsonData): Promise<void> {
    try {
        const existing = await pool.query(
            'SELECT sequence FROM "Event" WHERE id = $1',
            [event.id]
        );

        const sequence = existing.rows.length > 0
            ? existing.rows[0].sequence
            : await getNextSequence(threadId);

        await pool.query(
            `INSERT INTO "Event" (id, "threadId", "eventType", status, content, "parentId", sequence, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET
               "eventType" = EXCLUDED."eventType",
               status = EXCLUDED.status,
               content = EXCLUDED.content,
               "parentId" = EXCLUDED."parentId",
               "updatedAt" = NOW()`,
            [
                event.id,
                threadId,
                event.eventType,
                event.status,
                JSON.stringify(event.content),
                event.parentId || null,
                sequence,
            ]
        );
    } catch (error) {
        console.error('[EventStore] Failed to upsert event:', error);
    }
}

export async function getEventsByThread(threadId: string): Promise<BaseEvent.IJsonData[]> {
    try {
        const result = await pool.query(
            `SELECT id, "eventType", status, content, "parentId"
             FROM "Event"
             WHERE "threadId" = $1
             ORDER BY sequence ASC`,
            [threadId]
        );
        
        return result.rows.map(row => ({
            id: row.id,
            eventType: row.eventType,
            status: row.status,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
            ...(row.parentId && { parentId: row.parentId }),
        }));
    } catch (error) {
        console.error('[EventStore] Failed to get events:', error);
        return [];
    }
}

export async function deleteEventsByThread(threadId: string): Promise<void> {
    try {
        await pool.query('DELETE FROM "Event" WHERE "threadId" = $1', [threadId]);
    } catch (error) {
        console.error('[EventStore] Failed to delete events:', error);
    }
}

export async function syncEventsFromState(threadId: string, stateEvents: BaseEvent.IJsonData[]): Promise<void> {
    if (!stateEvents || stateEvents.length === 0) {
        return;
    }

    try {
        // 获取数据库中已有的 event IDs
        const result = await pool.query(
            'SELECT id FROM "Event" WHERE "threadId" = $1',
            [threadId]
        );
        const existingIds = new Set(result.rows.map(row => row.id));

        // 找出数据库中没有的 events
        const missingEvents = stateEvents.filter(event => !existingIds.has(event.id));

        if (missingEvents.length === 0) {
            return;
        }

        let nextSequence = await getNextSequence(threadId);

        for (const event of missingEvents) {
            await pool.query(
                `INSERT INTO "Event" (id, "threadId", "eventType", status, content, "parentId", sequence, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                 ON CONFLICT (id) DO NOTHING`,
                [
                    event.id,
                    threadId,
                    event.eventType,
                    event.status,
                    JSON.stringify(event.content),
                    event.parentId || null,
                    nextSequence++,
                ]
            );
        }
    } catch (error) {
        console.error('[EventStore] Failed to sync events from state:', error);
    }
}

export async function closePool(): Promise<void> {
    await pool.end();
}
