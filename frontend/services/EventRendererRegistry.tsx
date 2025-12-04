import React from 'react';
import { Executor } from '@/stores';

/** 事件渲染器组件 Props */
export interface EventRendererProps<T = unknown> {
  /** 事件数据 */
  data: T;
  /** 自定义类名 */
  className?: string;
}

/** 事件渲染器组件类型 */
export type EventRenderer<T = unknown> = React.ComponentType<EventRendererProps<T>>;

/**
 * EventRendererRegistry
 * 管理 eventType -> Renderer 的映射
 * 支持动态注册和获取渲染器
 */
class EventRendererRegistryClass {
  private renderers: Map<Executor.EventType, EventRenderer<unknown>> = new Map();

  /**
   * 注册渲染器
   * @param eventType 事件类型
   * @param renderer 渲染器组件
   */
  register<T>(eventType: Executor.EventType, renderer: EventRenderer<T>): void {
    this.renderers.set(eventType, renderer as EventRenderer<unknown>);
  }

  /**
   * 获取渲染器
   * @param eventType 事件类型
   * @returns 渲染器组件，如果未注册则返回 undefined
   */
  get<T>(eventType: Executor.EventType): EventRenderer<T> | undefined {
    return this.renderers.get(eventType) as EventRenderer<T> | undefined;
  }

  /**
   * 检查是否已注册某类型的渲染器
   * @param eventType 事件类型
   */
  has(eventType: Executor.EventType): boolean {
    return this.renderers.has(eventType);
  }

  /**
   * 注销渲染器
   * @param eventType 事件类型
   */
  unregister(eventType: Executor.EventType): boolean {
    return this.renderers.delete(eventType);
  }

  /**
   * 获取所有已注册的事件类型
   */
  getRegisteredTypes(): Executor.EventType[] {
    return Array.from(this.renderers.keys());
  }
}

/** 全局单例 */
export const EventRendererRegistry = new EventRendererRegistryClass();

/**
 * EventView 组件
 * 根据事件类型自动选择对应的渲染器进行渲染
 */
export const EventView: React.FC<{
  event: Executor.OutputEvent;
  className?: string;
}> = ({ event, className }) => {
  const Renderer = EventRendererRegistry.get(event.eventType);

  if (!Renderer) {
    console.warn(`No renderer registered for event type: ${event.eventType}`);
    return null;
  }

  return <Renderer data={event.content.data} className={className} />;
};

