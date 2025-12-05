import { observable, action, computed, makeObservable } from 'mobx';
import { Client } from '@langchain/langgraph-sdk';

// Configuration
const GRAPH_ID = 'scopeAgent';
const API_URL = 'http://localhost:2024';

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
  @observable events: Executor.OutputEvent[] = [];

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

  /** 添加事件到列表 */
  @action.bound
  private addEvent(event: Executor.OutputEvent) {
    this.events.push(event);
  }

  /** 清空事件列表 */
  @action.bound
  clearEvents() {
    this.events = [];
  }

  /** 处理接收到的 chunk 数据，返回创建的事件（如果有） */
  @action.bound
  private handleChunk(chunk: Executor.StreamChunk): Executor.OutputEvent | null {
    // 检查是否是 custom 事件（后端发送的自定义事件）
    if (chunk.event === 'custom' && chunk.data) {
      // 流式数据包裹了一层，直接取 data 中的事件数据
      const wrappedData = chunk.data as Executor.WrappedEventData;
      if (wrappedData.eventType && wrappedData.id) {
        const event: Executor.OutputEvent = {
          id: wrappedData.id, // 使用后端生成的 uuid
          eventType: wrappedData.eventType,
          content: wrappedData.content,
        };
        this.addEvent(event);
        return event;
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
    onEventCreated?: (event: Executor.OutputEvent) => void
  ): Promise<void> {
    if (!this.client || !this.threadId) {
      throw new Error('Executor not initialized');
    }

    this.setExecuting(true);

    try {
      const stream = this.client.runs.stream(this.threadId, GRAPH_ID, {
        input: {
          messages: [{ role: 'user', content }],
        },
        streamMode: 'custom',
      });

      for await (const chunk of stream) {
        console.log('Received chunk:', chunk);
        const event = this.handleChunk(chunk as Executor.StreamChunk);
        // 如果成功创建了事件且有回调函数，则调用回调
        if (event && onEventCreated) {
          onEventCreated(event);
        }
      }
    } finally {
      this.setExecuting(false);
    }
  }

  /**
   * views - 将 events 组织成符合 UI 渲染的数据结构
   * 返回按顺序排列的事件视图数组，可直接用于遍历渲染
   */
  @computed
  get views(): Executor.EventView[] {
    return this.events.map((event) => ({
      id: event.id,
      event,
    }));
  }

  /** 根据事件类型获取所有事件 */
  getEventsByType<T>(eventType: Executor.EventType): Executor.OutputEvent<T>[] {
    return this.events.filter(e => e.eventType === eventType) as Executor.OutputEvent<T>[];
  }
}

export namespace Executor {
  /** 事件类型 */
  export type EventType = 'clarify' | 'brief' | 'chat';

  /** 事件内容基础接口 */
  export interface EventContent<T = unknown> {
    /** 内容类型 */
    contentType: 'text';
    /** 内容数据 */
    data: T;
  }

  /** 流式数据 chunk 结构 */
  export interface StreamChunk {
    /** 事件类型 */
    event: string;
    /** 唯一标识 */
    id: string;
    /** 事件数据 */
    data: unknown;
  }

  /** 包裹的事件数据（后端发送的原始格式） */
  export interface WrappedEventData<T = unknown> {
    /** 事件唯一标识（后端生成的 uuid） */
    id: string;
    /** 事件类型 */
    eventType: EventType;
    /** 事件内容 */
    content: EventContent<T>;
  }

  /** 输出事件接口（前端存储的格式） */
  export interface OutputEvent<T = unknown> {
    /** 事件唯一标识（来自后端生成的 uuid） */
    id: string;
    /** 事件类型 */
    eventType: EventType;
    /** 事件内容 */
    content: EventContent<T>;
  }

  /** 事件视图（用于 UI 渲染） */
  export interface EventView {
    /** 唯一标识 */
    id: string;
    /** 原始事件 */
    event: OutputEvent;
  }

  /** Clarify 事件数据 */
  export interface ClarifyEventData {
    /** 是否需要澄清 */
    need_clarification: boolean;
    /** 澄清问题 */
    question: string;
    /** 验证信息 */
    verification: string;
  }

  /** Clarify 事件类型 */
  export type ClarifyEvent = OutputEvent<ClarifyEventData>;

  /** Brief 事件数据 */
  export interface BriefEventData {
    /** 研究概要内容 */
    research_brief: string;
  }

  /** Brief 事件类型 */
  export type BriefEvent = OutputEvent<BriefEventData>;

  /** Chat 事件数据 */
  export interface ChatEventData {
    /** 消息内容 */
    message: string;
  }

  /**
   * 创建 Chat 事件数据（前端本地创建，用于欢迎消息、错误消息等）
   * @param id 事件唯一标识
   * @param message 消息内容
   */
  export function createChatEvent(id: string, message: string): OutputEvent<ChatEventData> {
    return {
      id,
      eventType: 'chat',
      content: {
        contentType: 'text',
        data: { message },
      },
    };
  }
}
