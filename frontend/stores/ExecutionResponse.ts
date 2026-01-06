import { observable, action, makeObservable } from 'mobx';
import { AnyEvent } from './events';
import { TreeView } from './views/treeViews';
import {WorkflowViews} from './views/workflowViews';

/**
 * ExecutionResponse 类
 * 表示一次执行（invoke）的响应，包含本次执行的所有事件和 treeView
 * 
 * 性能优化：使用 requestAnimationFrame 批量更新事件，
 * 避免流式场景下高频触发 MobX 更新导致的渲染压力
 */
export class ExecutionResponse {
  /** 本次执行的所有事件 */
  @observable.shallow
  events: AnyEvent[] = [];

  /** 本次执行的 treeView */
  @observable.ref
  treeView: TreeView = new TreeView();

  @observable.ref
  WorkflowView: WorkflowViews = new WorkflowViews();

  /** 执行是否完成 */
  @observable
  isCompleted: boolean = false;

  /** 待处理的事件队列（用于 RAF 批量更新） */
  private pendingEvents: Map<string, AnyEvent> = new Map();
  
  /** RAF 请求 ID */
  private rafId: number | null = null;

  constructor() {
  }

  /** 
   * 添加或更新事件（使用 RAF 批量更新）
   * 高频调用时，会在下一帧统一处理所有待更新的事件
   */
  @action.bound
  upsertEvent(event: AnyEvent): void {
    // 处理 concat 聚合：需要在入队时就拼接，避免同 id 的多个 chunk 互相覆盖
    if (event.content.aggregateRule === 'concat') {
      // 先检查 pendingEvents 中是否有同 id 的事件
      const pendingEvent = this.pendingEvents.get(event.id);
      if (pendingEvent) {
        const existingData = pendingEvent.content.data;
        const newData = event.content.data;
        if (typeof existingData === 'string' && typeof newData === 'string') {
          event.content.data = existingData + newData;
        }
      } else {
        // pendingEvents 中没有，检查已提交的 events 数组
        const existingEvent = this.events.find(e => e.id === event.id);
        if (existingEvent) {
          const existingData = existingEvent.content.data;
          const newData = event.content.data;
          if (typeof existingData === 'string' && typeof newData === 'string') {
            event.content.data = existingData + newData;
          }
        }
      }
    }

    // 存入待处理队列
    this.pendingEvents.set(event.id, event);
    
    // 使用 RAF 批量更新，避免高频渲染
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushPendingEvents();
      });
    }
  }

  /** 立即刷新所有待处理的事件（用于完成时确保所有更新已应用） */
  @action.bound
  flushPendingEvents(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.pendingEvents.size === 0) return;

    // 批量处理所有待更新的事件
    this.pendingEvents.forEach((event) => {
      const index = this.events.findIndex(e => e.id === event.id);
      
      if (index !== -1) {
        // 更新已存在的事件（concat 聚合已在 upsertEvent 中处理）
        this.events[index] = event;
      } else {
        this.events.push(event);
      }

      // 更新 treeView 和 WorkflowView
      this.treeView.upsertEvent(event);
      this.WorkflowView.transformEventsToViews([event]);
    });
    
    this.pendingEvents.clear();
  }

  /** 标记执行完成 */
  @action.bound
  markCompleted(): void {
    // 完成前先刷新所有待处理的事件
    this.flushPendingEvents();
    this.isCompleted = true;
  }

  /** 清理资源 */
  dispose(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingEvents.clear();
  }
}
