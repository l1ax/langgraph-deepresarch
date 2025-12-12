import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MemorySaver, type BaseCheckpointSaver } from "@langchain/langgraph";
import dotenv from 'dotenv';

dotenv.config();

const useMemorySaver = process.env.NODE_ENV !== 'production' && process.env.USE_MEMORY_SAVER !== 'false';

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
