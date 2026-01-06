import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MemorySaver, type BaseCheckpointSaver } from "@langchain/langgraph";
import dotenv from 'dotenv';

dotenv.config();

// MemorySaver 使用逻辑：
// 1. 如果 USE_MEMORY_SAVER=true，强制使用 MemorySaver（用于 Supabase 不可用时）
// 2. 如果 USE_MEMORY_SAVER=false，强制使用 PostgresSaver
// 3. 否则，非生产环境默认使用 MemorySaver
const useMemorySaver = 
    process.env.USE_MEMORY_SAVER === 'true' || 
    (process.env.NODE_ENV !== 'production' && process.env.USE_MEMORY_SAVER !== 'false');

const checkpointer: BaseCheckpointSaver = useMemorySaver
    ? new MemorySaver()
    : PostgresSaver.fromConnString(
        process.env.DATABASE_URL || (() => { throw new Error("DATABASE_URL is not defined"); })()
    );

export { checkpointer };

export async function initCheckpointer() {
    if (checkpointer instanceof PostgresSaver) {
        await checkpointer.setup();
    }
}
