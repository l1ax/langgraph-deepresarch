import { observable, action, flow, computed, makeObservable } from 'mobx';
import { Executor } from './Executor';

export class DeepResearchPageStore {
  /** 聊天消息列表 */
  @observable messages: DeepResearchPageStore.ChatMessage[] = [];

  /** 输入框当前值 */
  @observable inputValue: string = '';

  /** Executor 实例 */
  @observable executor: Executor = new Executor();

  constructor() {
    makeObservable(this);
  }

  /** 设置输入框的值 */
  @action.bound
  setInputValue(value: string) {
    this.inputValue = value;
  }

  /** 添加一条消息到消息列表 */
  @action.bound
  private addMessage(message: DeepResearchPageStore.ChatMessage) {
    this.messages.push(message);
  }

  /** 更新指定消息的内容 */
  @action.bound
  private updateMessageContent(messageId: string, content: string) {
    const message = this.messages.find((msg) => msg.id === messageId);
    if (message) {
      message.content = content;
    }
  }

  /** 清空输入框 */
  @action.bound
  private clearInput() {
    this.inputValue = '';
  }

  /** 初始化客户端和会话线程 */
  @flow.bound
  *initClient() {
    try {
      yield this.executor.init();
      this.messages = [
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是 DeepResearch 助手。请告诉我你想研究什么主题？',
          timestamp: new Date(),
        },
      ];
    } catch (error) {
      console.error('Failed to initialize client:', error);
    }
  }

  /** 添加错误消息 */
  @action.bound
  private addErrorMessage(content: string) {
    this.messages.push({
      id: `error-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
  }

  /** 提交用户消息并处理流式响应 */
  async handleSubmit() {
    if (!this.inputValue.trim() || !this.executor.client || !this.executor.threadId) return;

    const userMessageContent = this.inputValue;
    const userMessage: DeepResearchPageStore.ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    this.addMessage(userMessage);
    this.clearInput();

    try {
      await this.executor.invoke(userMessageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      this.addErrorMessage(
        '抱歉，处理您的请求时出现错误。请确保后端服务已启动 (http://localhost:2024)。'
      );
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

  /** 获取事件视图列表（用于 UI 渲染） */
  @computed
  get eventViews(): Executor.EventView[] {
    return this.executor.views;
  }
}

export namespace DeepResearchPageStore {
  /** UI 层聊天消息类型 */
  export type ChatMessage = {
    /** 消息唯一标识 */
    id: string;
    /** 消息角色：用户或助手 */
    role: 'user' | 'assistant';
    /** 消息内容 */
    content: string;
    /** 消息时间戳 */
    timestamp: Date;
  };

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
