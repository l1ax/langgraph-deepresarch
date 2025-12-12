import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.LANGGRAPH_BACKEND_URL || 'http://localhost:2024';

/**
 * GET /api/langgraph/threads/:threadId/state - 获取 LangGraph thread 状态
 * 转发到 backend 的 /api/langgraph/threads/:threadId/state 接口
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/langgraph/threads/${threadId}/state`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LangGraph thread state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread state' },
      { status: 500 }
    );
  }
}
