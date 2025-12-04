import { observable, action, flow, computed, makeObservable } from 'mobx';
import { Client } from '@langchain/langgraph-sdk';

// Configuration
const GRAPH_ID = 'scopeAgent';
const API_URL = 'http://localhost:2024';

export class DeepResearchPageStore {
  /** 聊天消息列表 */
  @observable messages: DeepResearchPageStore.ChatMessage[] = [];

  /** 输入框当前值 */
  @observable inputValue: string = '';

  /** 是否正在加载/处理请求 */
  @observable isLoading: boolean = false;

  /** 当前会话线程 ID */
  @observable threadId: string | null = null;

  /** LangGraph SDK 客户端实例 */
  @observable client: Client | null = null;

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

  /** 设置加载状态 */
  @action.bound
  private setLoading(value: boolean) {
    this.isLoading = value;
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
      this.client = new Client({ apiUrl: API_URL });
      const thread: { thread_id: string } = yield this.client.threads.create();

      this.threadId = thread.thread_id;
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

  /** 提交用户消息并处理流式响应 */
  async handleSubmit() {
    if (!this.inputValue.trim() || !this.client || !this.threadId) return;

    const userMessageContent = this.inputValue;
    const userMessage: DeepResearchPageStore.ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    // 创建助手消息占位符
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: DeepResearchPageStore.ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    this.addMessage(userMessage);
    this.addMessage(assistantMessage);
    this.clearInput();
    this.setLoading(true);

    try {
      // 开始流式请求
      const stream = this.client.runs.stream(this.threadId, GRAPH_ID, {
        input: {
          messages: [{ role: 'user', content: userMessageContent }],
        },
        streamMode: 'values',
      });

      for await (const chunk of stream) {
        console.log(chunk);

        // 类型安全检查 values 事件
        if (!DeepResearchPageStore.isValuesChunk(chunk)) continue;

        const { messages: stateMessages } = chunk.data;

        if (stateMessages.length > 0) {
          const lastMessage = stateMessages[stateMessages.length - 1];

          // 仅当最后一条消息来自 AI 时更新
          if (lastMessage.type === 'ai') {
            const content = DeepResearchPageStore.extractMessageContent(
              lastMessage.content
            );
            this.updateMessageContent(assistantMessageId, content);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.updateMessageContent(
        assistantMessageId,
        '抱歉，处理您的请求时出现错误。请确保后端服务已启动 (http://localhost:2024)。'
      );
    } finally {
      this.setLoading(false);
    }
  }

  /** 是否可以提交（非加载中且输入不为空） */
  @computed
  get canSubmit(): boolean {
    return !this.isLoading && !!this.inputValue.trim();
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
