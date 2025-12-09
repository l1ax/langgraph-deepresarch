/**
 * API 服务层（MobX + flow）
 * 封装对 Thread API 的调用，暴露单例 apiService
 */
import { flow, makeObservable } from 'mobx';

// Thread 类型定义
export interface Thread {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  constructor() {
    makeObservable(this, {
      getThreadsByUser: flow.bound,
      createThread: flow.bound,
      getThread: flow.bound,
      updateThread: flow.bound,
      deleteThread: flow.bound,
    });
  }

  /**
   * 获取用户的所有 threads
   */
  *getThreadsByUser(userId: string): Generator<Promise<Response>, Thread[], any> {
    const response: Response = yield fetch(`/api/threads?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch threads');
    }

    return (yield response.json()) as Thread[];
  }

  /**
   * 创建新 thread
   */
  *createThread(userId: string, title?: string, id?: string): Generator<Promise<Response>, Thread, any> {
    const response: Response = yield fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, id }),
    });

    if (!response.ok) {
      throw new Error('Failed to create thread');
    }

    return (yield response.json()) as Thread;
  }

  /**
   * 获取单个 thread
   */
  *getThread(threadId: string): Generator<Promise<Response>, Thread | null, any> {
    const response: Response = yield fetch(`/api/threads/${threadId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch thread');
    }

    return (yield response.json()) as Thread;
  }

  /**
   * 更新 thread（例如更新标题）
   */
  *updateThread(threadId: string, data: { title?: string }): Generator<Promise<Response>, Thread, any> {
    const response: Response = yield fetch(`/api/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update thread');
    }

    return (yield response.json()) as Thread;
  }

  /**
   * 删除 thread
   */
  *deleteThread(threadId: string): Generator<Promise<Response>, void, any> {
    const response: Response = yield fetch(`/api/threads/${threadId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }
  }
}

export const apiService = new ApiService();
