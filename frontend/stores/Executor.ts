import { observable, action, computed, makeObservable } from 'mobx';
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

// Configuration
const GRAPH_ID = 'supervisorAgent';
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

  /** 接收到的事件列表 */
  @observable events: AnyEvent[] = [];

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
  private upsertEvent(data: BaseEvent.IEventData<unknown>): AnyEvent {
    const event = createEventFromData(data);

    const index = this.events.findIndex(e => e.id === data.id);
    if (index !== -1) {
      // 替换整个对象，确保 MobX 能检测到变化
      const oldEvent = this.events[index];
      console.log(`[Executor] Updating event:`, {
        id: data.id,
        oldStatus: oldEvent.status,
        newStatus: event.status,
        eventType: event.eventType,
        subType: event.subType
      });
      this.events[index] = event;
    } else {
      // 检查是否是 tool_call 事件，如果是，检查是否有相同 tool_call_id 但不同 id 的事件
      const { subType } = BaseEvent.parseEventType(data.eventType);
      if (subType === 'tool_call') {
        const toolData = (data.content.data as any);
        const toolCallId = toolData?.tool_call_id;
        if (toolCallId) {
          const existingEvent = this.events.find(e => {
            if (e.subType === 'tool_call') {
              const eToolData = (e.content.data as any);
              return eToolData?.tool_call_id === toolCallId && e.id !== data.id;
            }
            return false;
          });
          
          if (existingEvent) {
            console.warn(`[Executor] Found existing event with same tool_call_id but different id:`, {
              existingId: existingEvent.id,
              existingStatus: existingEvent.status,
              newId: data.id,
              newStatus: data.status,
              tool_call_id: toolCallId,
              tool_name: toolData?.tool_name
            });
            // 删除旧事件，添加新事件
            const oldIndex = this.events.findIndex(e => e.id === existingEvent.id);
            if (oldIndex !== -1) {
              this.events.splice(oldIndex, 1);
            }
          }
        }
      }
      
      console.log(`[Executor] Adding new event:`, {
        id: data.id,
        status: event.status,
        eventType: event.eventType,
        subType: event.subType
      });
      this.events.push(event);
    }
    return event;
  }

  /** 清空事件列表 */
  @action.bound
  clearEvents() {
    this.events = [];
  }

  /** 处理接收到的 chunk 数据，返回创建或更新的事件（如果有） */
  @action.bound
  private handleChunk(chunk: StreamChunk): AnyEvent | null {
    if (chunk.event === 'custom' && chunk.data) {
      const data = chunk.data as BaseEvent.IEventData<unknown>;
      if (data.eventType && data.id) {
        // 兼容旧数据，默认 status 为 finished
        data.status = data.status || 'finished';
        
        // 调试：检查是否是 ResearchComplete 的 tool_call
        const { subType } = BaseEvent.parseEventType(data.eventType);
        if (subType === 'tool_call') {
          const toolData = (data.content.data as any);
          if (toolData?.tool_name === 'ResearchComplete') {
            console.log('[Executor] Received ResearchComplete tool_call event:', {
              id: data.id,
              status: data.status,
              tool_name: toolData.tool_name,
              tool_call_id: toolData.tool_call_id
            });
          }
        }
        
        return this.upsertEvent(data);
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
   * @param onEventCreated 事件创建后的回调函数（可选）
   */
  @action.bound
  async invoke(
    content: string,
    onEventCreated?: (event: AnyEvent) => void
  ): Promise<void> {
    if (!this.client || !this.threadId) {
      throw new Error('Executor not initialized');
    }

    this.setExecuting(true);

    try {
      const stream = this.client.runs.stream(this.threadId, GRAPH_ID, {
        input: {
          supervisor_messages: [{ role: 'user', content }],
        },
        streamMode: 'custom',
        config: {
          recursion_limit: 100,
        },
      });

      let chunkCount = 0;
      for await (const chunk of stream) {
        chunkCount++;
        console.log(`[Executor] Chunk #${chunkCount}:`, chunk);
        const event = this.handleChunk(chunk as StreamChunk);
        if (event && onEventCreated) {
          console.log(`[Executor] Event created/updated:`, {
            id: event.id,
            eventType: event.eventType,
            status: event.status,
            subType: event.subType
          });
          onEventCreated(event);
        }
      }
      console.log(`[Executor] Stream ended normally after ${chunkCount} chunks`);
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    } finally {
      console.log('Setting isExecuting to false');
      this.setExecuting(false);
    }
  }

  /**
   * views - 将 events 组织成符合 UI 渲染的数据结构
   */
  @computed
  get views(): Executor.EventView[] {
    return this.events.map((event) => ({
      id: event.id,
      event,
    }));
  }

  /** 根据 subType 获取所有事件 */
  getEventsBySubType<T extends AnyEvent>(subType: BaseEvent.SubType): T[] {
    return this.events.filter(e => e.subType === subType) as T[];
  }
}

export namespace Executor {
  /** 事件视图（用于 UI 渲染） */
  export interface EventView {
    id: string;
    event: AnyEvent;
  }

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
