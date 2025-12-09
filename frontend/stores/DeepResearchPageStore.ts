import { observable, action, flow, computed, makeObservable, flowResult } from 'mobx';
import { Client, Thread as LangGraphThread } from '@langchain/langgraph-sdk';
import { Conversation } from './Conversation';
import { ChatEvent } from './events';
import { ExecutionResponse } from './ExecutionResponse';
import { apiService, type User, type Thread } from '@/services/api';

// Configuration
const API_URL = 'http://localhost:2024';

// 临时用户 email（后续可以接入真实的用户认证系统）
const TEMP_USER_EMAIL = 'default@deepresearch.local';

/**
 * DeepResearchPageStore
 * 页面级 Store，管理 client 和 conversations
 */
export class DeepResearchPageStore {
  /** 输入框当前值 */
  @observable inputValue: string = '';

  /** LangGraph SDK 客户端实例 */
  @observable client: Client | null = null;

  /** 当前用户 */
  @observable currentUser: User | null = null;

  /** 会话列表 */
  @observable conversations: Conversation[] = [];

  /** 当前活跃的会话 */
  @observable currentConversation: Conversation | null = null;

  /** 侧边栏是否展开 */
  @observable isSidebarOpen: boolean = true;

  /** 是否正在初始化 */
  @observable isInitializing: boolean = false;

  // ===== UI Loading 状态 =====

  /** 删除会话的 loading 状态，key 是 threadId */
  @observable deletingConversationIds: Set<string> = new Set();

  /** 创建会话的 loading 状态 */
  @observable isCreatingConversation: boolean = false;

  /** 发送消息的 loading 状态 */
  @observable isSendingMessage: boolean = false;

  /** Toast 消息队列 */
  @observable toasts: DeepResearchPageStore.Toast[] = [];

  constructor() {
    makeObservable(this);
  }

  // ===== Toast 消息方法 =====

  @action.bound
  showToast(message: string, type: DeepResearchPageStore.ToastType = 'info', duration: number = 3000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: DeepResearchPageStore.Toast = { id, message, type, duration };
    this.toasts.push(toast);

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  @action.bound
  removeToast(id: string) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.toasts.splice(index, 1);
    }
  }

  // ===== Loading 状态检查方法 =====

  /** 检查指定会话是否正在删除 */
  isConversationDeleting(threadId: string): boolean {
    return this.deletingConversationIds.has(threadId);
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

  /** 切换侧边栏展开/收起 */
  @action.bound
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /** 创建新会话 */
  @action.bound
  private createConversation(threadId: string, title?: string | null): Conversation {
    const conversation = new Conversation(threadId, this.client, title);
    this.conversations.push(conversation);
    return conversation;
  }

  /** 切换到指定的会话 */
  @action.bound
  switchToConversation(threadId: string) {
    const conversation = this.conversations.find(c => c.threadId === threadId);
    if (conversation) {
      this.currentConversation = conversation;
    }
  }

  /** 创建新对话入口：重置当前会话，回到欢迎页 */
  @action.bound
  createNewConversation() {
    this.currentConversation = null;
    this.clearInput();
  }

  /** 删除指定会话 */
  @flow.bound
  *deleteConversation(threadId: string): Generator<Promise<any>, void, any> {
    // 设置删除中状态
    this.deletingConversationIds.add(threadId);
    
    try {
      // 从数据库删除
      yield flowResult(apiService.deleteThread(threadId));

      // 从本地列表移除
      const index = this.conversations.findIndex(c => c.threadId === threadId);
      if (index !== -1) {
        this.conversations.splice(index, 1);
      }

      // 如果删除的是当前会话，重置当前会话
      if (this.currentConversation?.threadId === threadId) {
        this.currentConversation = null;
      }

      this.showToast('对话已删除', 'success');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      this.showToast('删除对话失败，请重试', 'error');
    } finally {
      this.deletingConversationIds.delete(threadId);
    }
  }

  /** 初始化客户端和会话线程 */
  @flow.bound
  *initClient(): Generator<Promise<any>, void, any> {
    if (this.isInitializing) return;

    try {
      this.isInitializing = true;

      // 初始化 client
      this.client = new Client({ apiUrl: API_URL });

      // 获取或创建当前用户
      this.currentUser = yield flowResult(apiService.getOrCreateUser(TEMP_USER_EMAIL, 'Default User'));

      if (this.currentUser) {
        // 从数据库加载用户的所有 threads
        const threads: Thread[] = yield flowResult(apiService.getThreadsByUser(this.currentUser.id));

        // 恢复所有会话
        for (const thread of threads) {
          const conversation = this.createConversation(thread.id, thread.title);
          conversation.restoreDataByThreadId(thread.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize client:', error);
      this.showToast('初始化失败，请刷新页面重试', 'error');
    } finally {
      this.isInitializing = false;
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
      // 创建包含错误事件的 ExecutionResponse
      const executionResponse = new ExecutionResponse();
      executionResponse.upsertEvent(errorEvent);
      executionResponse.markCompleted();
      this.currentConversation.addExecutionResponse(executionResponse);
    }
  }

  /** 提交用户消息并处理流式响应 */
  @flow.bound
  *handleSubmit() {
    if (!this.inputValue.trim() || !this.client) return;

    let conversation = this.currentConversation;

    if (!conversation) {
      try {
        this.isCreatingConversation = true;
        
        // 创建 LangGraph thread
        const thread: LangGraphThread = yield this.client.threads.create();
        const threadId = thread.thread_id;

        if (this.currentUser) {
          yield flowResult(apiService.createThread(this.currentUser.id, undefined, threadId));
        }

        conversation = this.createConversation(threadId);
        this.currentConversation = conversation;
      } catch (error) {
        console.error('Failed to create conversation thread:', error);
        this.addErrorMessage('无法创建新的对话，请稍后重试或确认服务配置。');
        this.showToast('创建对话失败', 'error');
        return;
      } finally {
        this.isCreatingConversation = false;
      }
    }

    if (!conversation) return;

    const userMessageContent = this.inputValue;

    // 添加用户消息到当前会话
    conversation.addUserMessage(userMessageContent);
    this.clearInput();

    // 先创建 ExecutionResponse 并添加到 conversation，这样在流式接收过程中 UI 就能实时渲染
    const executionResponse = new ExecutionResponse();
    conversation.addExecutionResponse(executionResponse);

    try {
      this.isSendingMessage = true;
      
      // 调用 conversation 的 executor，传入 executionResponse，让它在流式接收过程中更新
      yield conversation.executor.invoke(userMessageContent, executionResponse);

      // 成功完成后，更新 thread 标题（使用第一条用户消息作为标题）
      if (this.currentUser && !conversation.title) {
        const title = userMessageContent.slice(0, 100);
        yield flowResult(apiService.updateThread(conversation.threadId, { title }));
        conversation.setTitle(title);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 如果出错，移除刚才添加的 executionResponse，改用错误消息
      const elements = conversation.elements;
      const lastElement = elements[elements.length - 1];
      if (Conversation.isAssistantElement(lastElement) && lastElement.executionResponse === executionResponse) {
        elements.pop();
      }
      this.addErrorMessage(
        '抱歉，处理您的请求时出现错误。请确保后端服务已启动 (http://localhost:2024)。'
      );
      this.showToast('发送消息失败', 'error');
    } finally {
      this.isSendingMessage = false;
    }
  }

  /** 是否正在加载/处理请求 */
  @computed
  get isLoading(): boolean {
    return this.currentConversation?.executor.isExecuting ?? false;
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

  /** 是否有任何会话正在删除 */
  @computed
  get isAnyConversationDeleting(): boolean {
    return this.deletingConversationIds.size > 0;
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
    /** 事件列表（用于恢复历史对话） */
    events: Record<string, unknown>[];
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

  /** Toast 类型 */
  export type ToastType = 'info' | 'success' | 'warning' | 'error';

  /** Toast 消息 */
  export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
  }
}
