import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.LANGGRAPH_BACKEND_URL || 'http://localhost:2024';

/**
 * POST /api/langgraph/run - 运行 LangGraph graph（流式响应）
 * 转发到 backend 的 /api/langgraph/run 接口，支持 SSE 流式传输
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 向 backend 发起流式请求
    const response = await fetch(`${BACKEND_URL}/api/langgraph/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `Backend error: ${error}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 创建流式响应，直接转发 backend 的 SSE 流
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            // 直接转发数据块
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    // 返回流式响应，设置正确的 SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error running LangGraph:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to run graph' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
