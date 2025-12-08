import { observable, action, makeObservable } from 'mobx';
import { Client } from '@langchain/langgraph-sdk';
import { 
  BaseEvent, 
  AnyEvent, 
  createEventFromData,
  ClarifyEvent,
  BriefEvent,
  ChatEvent,
  ToolCallEvent,
} from './events';
import { ExecutionResponse } from './ExecutionResponse';

// Configuration
const GRAPH_ID = 'fullResearchAgent';
const API_URL = 'http://localhost:2024';

/** 流式数据 chunk 结构 */
interface StreamChunk {
  event: string;
  id: string;
  data: unknown;
}

/**
 * Executor 类
 * 负责与后端通信、存储和处理事件
 */
export class Executor {
  /** LangGraph SDK 客户端实例 */
  @observable client: Client | null = null;

  /** 当前会话线程 ID */
  @observable threadId: string | null = null;

  /** 是否正在执行请求 */
  @observable isExecuting: boolean = false;

  constructor() {
    makeObservable(this);
  }

  /** 初始化客户端和会话线程 */
  @action.bound
  async init(): Promise<void> {
    try {
      this.client = new Client({ apiUrl: API_URL });
      const thread = await this.client.threads.create();
      this.threadId = thread.thread_id;
    } catch (error) {
      console.error('Failed to initialize executor:', error);
      throw error;
    }
  }

  /** 根据 id 更新已存在的事件，如果不存在则添加 */
  @action.bound
  private upsertEvent(
    data: BaseEvent.IEventData<unknown>,
    executionResponse: ExecutionResponse
  ): AnyEvent {
    const event = createEventFromData(data);

    // 更新 executionResponse
    executionResponse.upsertEvent(event);
    return event;
  }

  /** 处理接收到的 chunk 数据，返回创建或更新的事件（如果有） */
  @action.bound
  private handleChunk(
    chunk: StreamChunk,
    executionResponse: ExecutionResponse
  ): AnyEvent | null {
    if (chunk.event === 'custom' && chunk.data) {
      console.log('chunk.data', chunk.data);
      const data = chunk.data as BaseEvent.IEventData<unknown>;
      if (data.eventType && data.id) {
        // 兼容旧数据，默认 status 为 finished
        data.status = data.status || 'finished';
        
        return this.upsertEvent(data, executionResponse);
      }
    }
    return null;
  }

  /** 设置执行状态 */
  @action.bound
  private setExecuting(value: boolean) {
    this.isExecuting = value;
  }

  /**
   * 执行对话请求
   * @param content 用户输入的内容
   * @param executionResponse 已创建的 ExecutionResponse 实例（可选，如果不提供则创建新的）
   * @returns ExecutionResponse 包含本次执行的所有事件和 treeView
   */
  @action.bound
  async invoke(content: string, executionResponse?: ExecutionResponse): Promise<ExecutionResponse> {
    if (!this.client || !this.threadId) {
      throw new Error('Executor not initialized');
    }

    this.setExecuting(true);

    // 如果没有提供 executionResponse，创建新的
    const response = executionResponse || new ExecutionResponse();

    try {
      const stream = this.client.runs.stream(this.threadId, GRAPH_ID, {
        input: {
          messages: [{ role: 'user', content }],
        },
        streamMode: 'custom',
        config: {
          recursion_limit: 100,
        },
      });

      for await (const chunk of stream) {
        this.handleChunk(chunk as StreamChunk, response);
      }

      // 标记执行完成
      response.markCompleted();
    } catch (error) {
      console.error('Stream error:', error);
      response.markCompleted();
      throw error;
    } finally {
      this.setExecuting(false);
    }

    return response;
  }
}

export namespace Executor {
  // Re-export types from BaseEvent for convenience
  export type RoleName = BaseEvent.RoleName;
  export type SubType = BaseEvent.SubType;
  export type EventType = BaseEvent.EventType;
  export type EventStatus = BaseEvent.EventStatus;

  // Re-export event data types
  export type ClarifyEventData = ClarifyEvent.IData;
  export type BriefEventData = BriefEvent.IData;
  export type ChatEventData = ChatEvent.IData;
  export type ToolCallEventData = ToolCallEvent.IData;

  // Re-export utility functions
  export const parseEventType = BaseEvent.parseEventType;
  export const createEventType = BaseEvent.createEventType;
}
