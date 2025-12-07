import { observable, action, flow, computed, makeObservable } from 'mobx';
import { Executor } from './Executor';
import { Conversation } from './Conversation';
import { AnyEvent, ChatEvent } from './events';

/**
 * DeepResearchPageStore
 * 页面级 Store，管理 executor 和 conversations
 */
export class DeepResearchPageStore {
  /** 输入框当前值 */
  @observable inputValue: string = '';

  /** Executor 实例 */
  @observable executor: Executor = new Executor();

  /** 会话列表 */
  @observable conversations: Conversation[] = [];

  /** 当前活跃的会话 */
  @observable currentConversation: Conversation | null = null;

  constructor() {
    makeObservable(this);
  }

  /** 设置输入框的值 */
  @action.bound
  setInputValue(value: string) {
    this.inputValue = value;
  }

  /** 清空输入框 */
  @action.bound
  private clearInput() {
    this.inputValue = '';
  }

  /** 创建新会话 */
  @action.bound
  private createConversation(threadId: string): Conversation {
    const conversation = new Conversation(threadId);
    this.conversations.push(conversation);
    this.currentConversation = conversation;
    return conversation;
  }

  /** 初始化客户端和会话线程 */
  @flow.bound
  *initClient() {
    try {
      yield this.executor.init();

      // 创建新会话
      if (this.executor.threadId) {
        const conversation = this.createConversation(this.executor.threadId);
        // 添加欢迎消息
        const welcomeEvent = ChatEvent.create(
          'welcome',
          '你好！我是 DeepResearch 助手。请告诉我你想研究什么主题？'
        );
        conversation.addStandaloneAssistantEvent(welcomeEvent);
      }
    } catch (error) {
      console.error('Failed to initialize client:', error);
    }
  }

  /** 添加错误消息到当前会话 */
  @action.bound
  private addErrorMessage(content: string) {
    if (this.currentConversation) {
      const errorEvent = ChatEvent.create(
        `error-${Date.now()}`,
        content
      );
      // 错误消息添加到当前的助手元素中
      this.currentConversation.addEventToCurrentAssistant(errorEvent);
    }
  }

  /**
   * 事件创建后的回调方法
   * 将 event 添加到当前助手元素
   */
  @action.bound
  private handleEventCreated(event: AnyEvent) {
    if (this.currentConversation) {
      this.currentConversation.addEventToCurrentAssistant(event);
    }
  }

  /** 提交用户消息并处理流式响应 */
  @flow.bound
  *handleSubmit() {
    if (!this.inputValue.trim() || !this.executor.client || !this.executor.threadId) return;
    if (!this.currentConversation) return;

    const userMessageContent = this.inputValue;

    // 添加用户消息到当前会话（会自动创建新的助手元素）
    this.currentConversation.addUserMessage(userMessageContent);
    this.clearInput();

    try {
      // 调用 executor，传入事件创建回调
      yield this.executor.invoke(
        userMessageContent,
        this.handleEventCreated
      );
    } catch (error) {
      console.error('Error sending message:', error);
      this.addErrorMessage(
        '抱歉，处理您的请求时出现错误。请确保后端服务已启动 (http://localhost:2024)。'
      );
    } finally {
      // 完成当前助手元素的接收
      this.currentConversation?.finishCurrentAssistant();
    }
  }

  /** 是否正在加载/处理请求 */
  @computed
  get isLoading(): boolean {
    return this.executor.isExecuting;
  }

  /** 是否可以提交（非加载中且输入不为空） */
  @computed
  get canSubmit(): boolean {
    return !this.isLoading && !!this.inputValue.trim();
  }

  /** 获取当前会话的所有元素（用于 UI 渲染） */
  @computed
  get elements(): Conversation.Element[] {
    return this.currentConversation?.allElements ?? [];
  }
}

export namespace DeepResearchPageStore {
  /** LangChain 消息内容类型（字符串或内容块数组） */
  export type MessageContent = string | Array<{ type: string; text?: string }>;

  /** LangChain 消息类型 */
  export interface LangChainMessage {
    /** 消息类型 */
    type: 'human' | 'ai' | 'system' | 'tool';
    /** 消息内容 */
    content: MessageContent;
    /** 消息 ID */
    id?: string;
    /** 消息名称 */
    name?: string;
  }

  /** Graph 状态类型（匹配后端 StateAnnotation） */
  export interface GraphState {
    /** 消息列表 */
    messages: LangChainMessage[];
    /** 研究摘要 */
    research_brief: string | null;
    /** 监督者消息 */
    supervisor_messages: LangChainMessage[];
    /** 原始笔记 */
    raw_notes: string[];
    /** 处理后的笔记 */
    notes: string[];
    /** 研究迭代次数 */
    research_iterations: number;
    /** 最终报告 */
    final_report: string | null;
  }

  /** 从 LangChain 消息中提取文本内容 */
  export function extractMessageContent(content: MessageContent): string {
    if (typeof content === 'string') {
      return content;
    }
    return content.map((block) => block.text || '').join('');
  }

  /** 类型守卫：检查 chunk 是否为包含 GraphState 的 values 事件 */
  export function isValuesChunk(
    chunk: { event: string; data: unknown }
  ): chunk is { event: 'values'; data: GraphState } {
    return (
      chunk.event === 'values' &&
      chunk.data !== null &&
      typeof chunk.data === 'object' &&
      'messages' in chunk.data &&
      Array.isArray((chunk.data as GraphState).messages)
    );
  }
}
