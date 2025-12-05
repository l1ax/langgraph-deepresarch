import { observable, action, computed, makeObservable } from 'mobx';
import { Executor } from './Executor';

/**
 * Conversation 类
 * 以 threadId 为唯一标识，管理一次对话中的所有 elements
 */
export class Conversation {
  /** 会话唯一标识（对应 LangGraph threadId） */
  readonly threadId: string;

  /** 会话中的元素列表（用户消息和助手回答） */
  @observable elements: Conversation.Element[] = [];

  /** 当前正在接收 events 的助手元素 */
  @observable private currentAssistantElement: Conversation.AssistantElement | null = null;

  constructor(threadId: string) {
    this.threadId = threadId;
    makeObservable(this);
  }

  /** 添加用户消息元素，并创建新的助手元素准备接收回复 */
  @action.bound
  addUserMessage(content: string): Conversation.UserElement {
    const element: Conversation.UserElement = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.elements.push(element);

    // 创建新的助手元素准备接收回复
    this.currentAssistantElement = {
      id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      events: [],
      timestamp: new Date(),
    };
    this.elements.push(this.currentAssistantElement);

    return element;
  }

  /** 添加独立的助手事件元素（用于欢迎消息等不需要用户提问的场景） */
  @action.bound
  addStandaloneAssistantEvent(event: Executor.OutputEvent): Conversation.AssistantElement {
    const element: Conversation.AssistantElement = {
      id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      events: [event],
      timestamp: new Date(),
    };
    this.elements.push(element);
    return element;
  }

  /** 将 event 添加或更新到当前助手元素 */
  @action.bound
  addEventToCurrentAssistant(event: Executor.OutputEvent): void {
    if (!this.currentAssistantElement) return;

    const index = this.currentAssistantElement.events.findIndex(e => e.id === event.id);
    if (index !== -1) {
      // 替换整个 event 对象，确保 MobX 能检测到变化
      this.currentAssistantElement.events[index] = event;
    } else {
      // 添加新 event
      this.currentAssistantElement.events.push(event);
    }
  }

  /** 完成当前助手元素的接收 */
  @action.bound
  finishCurrentAssistant(): void {
    this.currentAssistantElement = null;
  }

  /** 获取所有元素（用于 UI 渲染），过滤掉空的助手元素 */
  @computed
  get allElements(): Conversation.Element[] {
    return this.elements.filter(el => {
      if (Conversation.isAssistantElement(el)) {
        return el.events.length > 0;
      }
      return true;
    });
  }

  /** 获取元素数量 */
  @computed
  get elementCount(): number {
    return this.elements.length;
  }
}

export namespace Conversation {
  /** 用户元素 */
  export interface UserElement {
    /** 元素唯一标识 */
    id: string;
    /** 角色 */
    role: 'user';
    /** 用户消息内容 */
    content: string;
    /** 时间戳 */
    timestamp: Date;
  }

  /** 助手元素 */
  export interface AssistantElement {
    /** 元素唯一标识 */
    id: string;
    /** 角色 */
    role: 'assistant';
    /** 助手回答事件列表（一次问答可能产生多个事件） */
    events: Executor.OutputEvent[];
    /** 时间戳 */
    timestamp: Date;
  }

  /** 元素类型（用户消息或助手回答） */
  export type Element = UserElement | AssistantElement;

  /** 类型守卫：判断是否为用户元素 */
  export function isUserElement(element: Element): element is UserElement {
    return element.role === 'user';
  }

  /** 类型守卫：判断是否为助手元素 */
  export function isAssistantElement(element: Element): element is AssistantElement {
    return element.role === 'assistant';
  }
}
