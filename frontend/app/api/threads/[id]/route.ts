import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/threads/[id] - 获取单个对话
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}

// PATCH /api/threads/[id] - 更新对话
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    const thread = await prisma.thread.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 });
  }
}

// DELETE /api/threads/[id] - 删除对话
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.thread.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}

