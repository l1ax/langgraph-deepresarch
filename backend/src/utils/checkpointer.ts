import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

// 使用 fromConnString 创建 PostgresSaver
export const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL);

/**
 * Initialize the checkpointer tables.
 * This should be called once before using the checkpointer.
 * Note: PostgresSaver.setup() creates the necessary tables if they don't exist.
 */
export async function initCheckpointer() {
    await checkpointer.setup();
}
