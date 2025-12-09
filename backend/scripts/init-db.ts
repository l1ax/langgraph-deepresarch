/**
 * 数据库初始化脚本
 * 
 * 运行此脚本来初始化 LangGraph checkpointer 所需的数据库表
 * 
 * 使用方法：
 *   cd backend && pnpm tsx scripts/init-db.ts
 */

import { initCheckpointer } from '../src/utils/checkpointer';

async function main() {
    console.log('Initializing database tables for LangGraph checkpointer...');
    
    try {
        await initCheckpointer();
        console.log('✅ Database tables initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize database tables:', error);
        process.exit(1);
    }
}

main();

