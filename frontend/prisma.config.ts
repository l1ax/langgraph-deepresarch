import path from 'node:path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  // 用于 Prisma CLI 命令 (db push, migrate 等)
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
