/**
 * API 服务层（MobX + flow）
 * 封装对 User 和 Thread API 的调用，暴露单例 apiService
 */
import { flow, makeObservable } from 'mobx';

// User 类型定义
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  threads?: Thread[];
}

// Thread 类型定义
export interface Thread {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

class ApiService {
  constructor() {
    makeObservable(this, {
      getOrCreateUser: flow.bound,
      getUser: flow.bound,
      updateUser: flow.bound,
      getThreadsByUser: flow.bound,
      createThread: flow.bound,
      getThread: flow.bound,
      updateThread: flow.bound,
      deleteThread: flow.bound,
    });
  }

  /**
   * 获取或创建用户（基于 email）
   */
  *getOrCreateUser(email: string, name?: string): Generator<Promise<Response>, User, any> {
    const response: Response = yield fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to get or create user');
    }

    return (yield response.json()) as User;
  }

  /**
   * 获取单个用户（包含其所有 threads）
   */
  *getUser(userId: string): Generator<Promise<Response>, User | null, any> {
    const response: Response = yield fetch(`/api/users/${userId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return (yield response.json()) as User;
  }

  /**
   * 更新用户信息
   */
  *updateUser(userId: string, data: { name?: string; avatarUrl?: string }): Generator<Promise<Response>, User, any> {
    const response: Response = yield fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return (yield response.json()) as User;
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