import React from 'react';
import { BaseEvent, AnyEvent } from '@/stores';

/** 事件渲染器组件 Props */
export interface EventRendererProps<T = unknown> {
  /** 事件数据 */
  data: T;
  /** 事件状态 */
  status: BaseEvent.EventStatus;
  /** 角色名称 */
  roleName: BaseEvent.RoleName;
  /** 自定义类名 */
  className?: string;
}

/** 事件渲染器组件类型 */
export type EventRenderer<T = unknown> = React.ComponentType<EventRendererProps<T>>;

/**
 * EventRendererRegistry
 * 管理 subType -> Renderer 的映射
 * 渲染器按 subType 注册，获取时根据 eventType 解析 subType 后查找
 */
class EventRendererRegistryClass {
  private renderers: Map<BaseEvent.SubType, EventRenderer<unknown>> = new Map();

  /**
   * 注册渲染器
   * @param subType 事件子类型
   * @param renderer 渲染器组件
   */
  register<T>(subType: BaseEvent.SubType, renderer: EventRenderer<T>): void {
    this.renderers.set(subType, renderer as EventRenderer<unknown>);
  }

  /**
   * 根据 subType 获取渲染器
   * @param subType 事件子类型
   * @returns 渲染器组件，如果未注册则返回 undefined
   */
  get<T>(subType: BaseEvent.SubType): EventRenderer<T> | undefined {
    return this.renderers.get(subType) as EventRenderer<T> | undefined;
  }

  /**
   * 检查是否已注册某子类型的渲染器
   * @param subType 事件子类型
   */
  has(subType: BaseEvent.SubType): boolean {
    return this.renderers.has(subType);
  }

  /**
   * 注销渲染器
   * @param subType 事件子类型
   */
  unregister(subType: BaseEvent.SubType): boolean {
    return this.renderers.delete(subType);
  }

  /**
   * 获取所有已注册的事件子类型
   */
  getRegisteredTypes(): BaseEvent.SubType[] {
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
  event: AnyEvent;
  className?: string;
}> = ({ event, className }) => {
  const Renderer = EventRendererRegistry.get(event.subType);

  if (!Renderer) {
    return null;
  }

  return <Renderer data={event.content.data} status={event.status} roleName={event.roleName} className={className} />;
};

