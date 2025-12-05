'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { FileText, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Executor } from '@/stores';
import { EventRendererProps } from '@/services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * BriefEventRenderer 渲染器组件
 * 用于展示研究概要信息
 */
export const BriefEventRenderer = observer(
  ({ data, className }: EventRendererProps<Executor.BriefEventData>) => {
    const { research_brief } = data;

    return (
      <div
        className={cn(
          'rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 shadow-sm',
          'dark:border-sky-900/50 dark:from-sky-950/40 dark:to-indigo-950/40',
          className
        )}
      >
        {/* 标题栏 */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-sky-200/60 dark:border-sky-800/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-sky-800 dark:text-sky-200">
              研究概要
            </h3>
            <p className="text-xs text-sky-600/80 dark:text-sky-400/80">
              Research Brief
            </p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-100/60 text-sky-500 dark:bg-sky-900/30 dark:text-sky-400">
            <FileText className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-sky-800 dark:prose-headings:text-sky-200 prose-p:text-sky-700 dark:prose-p:text-sky-300 prose-li:text-sky-700 dark:prose-li:text-sky-300 prose-strong:text-sky-800 dark:prose-strong:text-sky-200 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {research_brief || '正在生成研究概要...'}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
);

BriefEventRenderer.displayName = 'BriefEventRenderer';

export default BriefEventRenderer;

