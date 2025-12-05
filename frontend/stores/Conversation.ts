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

  constructor(threadId: string) {
    this.threadId = threadId;
    makeObservable(this);
  }

  /** 添加用户消息元素 */
  @action.bound
  addUserMessage(content: string): Conversation.UserElement {
    const element: Conversation.UserElement = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.elements.push(element);
    return element;
  }

  /** 添加助手事件元素 */
  @action.bound
  addAssistantEvent(event: Executor.OutputEvent): Conversation.AssistantElement {
    const element: Conversation.AssistantElement = {
      id: event.id,
      role: 'assistant',
      event,
      timestamp: new Date(),
    };
    this.elements.push(element);
    return element;
  }

  /** 获取所有元素（用于 UI 渲染） */
  @computed
  get allElements(): Conversation.Element[] {
    return this.elements;
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
    /** 助手回答事件 */
    event: Executor.OutputEvent;
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
