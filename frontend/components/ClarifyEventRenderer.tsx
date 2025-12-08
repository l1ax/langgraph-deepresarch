'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { MessageCircleQuestion, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseIncompleteJson } from '@/lib/json-parser';
import { ClarifyEvent } from '@/stores';
import { EventRendererProps } from '@/services';

/**
 * ClarifyEvent 渲染器组件
 * - 如果 status 为 pending/running，显示加载状态
 * - 如果 status 为 error，显示错误状态
 * - 如果 need_clarification 为 true，显示澄清问题
 * - 如果 need_clarification 为 false，显示验证信息提示
 */
export const ClarifyEventRenderer = observer(
  ({ data, status, roleName: _roleName, className }: EventRendererProps<ClarifyEvent.IData>) => {
    // 解析可能不完整的JSON字符串
    const parsedData = parseIncompleteJson<ClarifyEvent.IData>(data as ClarifyEvent.IData | string);
    const { need_clarification, question, verification } = parsedData;

    const isPending = status === 'pending';
    const isRunning = status === 'running';
    const isError = status === 'error';
    const isLoading = isPending || isRunning;

    // 加载状态
    if (isLoading) {
      return (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm animate-pulse',
            'dark:border-slate-700 dark:bg-slate-900/30',
            className
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {isPending ? '准备分析...' : '正在分析您的需求...'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {verification || question || '请稍候，正在理解您的研究意图'}
            </p>
          </div>
        </div>
      );
    }

    // 错误状态
    if (isError) {
      return (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm',
            'dark:border-red-900/50 dark:bg-red-950/30',
            className
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              分析失败
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              分析您的需求时发生错误，请重试。
            </p>
          </div>
        </div>
      );
    }

    if (need_clarification) {
      // 需要澄清：显示问题
      return (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm',
            'dark:border-amber-900/50 dark:bg-amber-950/30',
            className
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <MessageCircleQuestion className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              需要更多信息
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {question}
            </p>
          </div>
        </div>
      );
    }

    // 不需要澄清：显示验证信息
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm',
          'dark:border-emerald-900/50 dark:bg-emerald-950/30',
          className
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            理解确认
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
            {verification || '已理解您的研究需求，正在开始研究...'}
          </p>
        </div>
      </div>
    );
  }
);

ClarifyEventRenderer.displayName = 'ClarifyEventRenderer';

export default ClarifyEventRenderer;
