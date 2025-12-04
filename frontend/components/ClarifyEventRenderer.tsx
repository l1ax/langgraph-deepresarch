'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { MessageCircleQuestion, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Executor } from '@/stores';
import { EventRendererProps } from '@/services';

/**
 * ClarifyEvent 渲染器组件
 * - 如果 need_clarification 为 true，显示澄清问题
 * - 如果 need_clarification 为 false，显示验证信息提示
 */
export const ClarifyEventRenderer = observer(
  ({ data, className }: EventRendererProps<Executor.ClarifyEventData>) => {
    const { need_clarification, question, verification } = data;

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
