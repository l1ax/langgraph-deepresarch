import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/threads - 获取所有对话（可按用户筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const threads = await prisma.thread.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: {
            id: true
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

// POST /api/threads - 创建新对话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, id } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 创建新对话，支持自定义 ID（与 LangGraph thread_id 对应）
    const thread = await prisma.thread.create({
      data: {
        ...(id && { id }),
        userId,
        title: title || null,
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}

