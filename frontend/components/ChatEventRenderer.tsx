'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { Loader2, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatEvent } from '@/stores';
import { EventRendererProps } from '@/services';
import { Streamdown } from 'streamdown';

/**
 * ChatEventRenderer 渲染器组件
 * 用于渲染聊天消息（包括流式生成的最终报告等）
 */
export const ChatEventRenderer = observer(
  ({ data, status, roleName, className }: EventRendererProps<ChatEvent.IData>) => {
    const { message } = data;

    const isPending = status === 'pending';
    const isRunning = status === 'running';
    const isFinished = status === 'finished';
    const isError = status === 'error';
    const isLoading = isPending || isRunning;

    // 判断是否为最终报告生成场景（消息以 "Generating" 开头或包含大量内容）
    const isFinalReportGeneration = message.includes('Generating final report') || message.length > 200;

    return (
      <div
        className={cn(
          'relative rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm max-w-full overflow-hidden transition-all duration-300',
          isError
            ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-100'
            : isFinalReportGeneration
              ? 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700/50'
              : 'bg-background border text-foreground',
          'rounded-tl-sm',
          className
        )}
      >
        {/* 最终报告生成时显示标题栏 */}
        {isFinalReportGeneration && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/40">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                isError
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : isFinished ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  'text-sm font-semibold',
                  isError
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-slate-800 dark:text-slate-200'
                )}
              >
                最终研究报告
              </h3>
              <p
                className={cn(
                  'text-xs',
                  isError
                    ? 'text-red-600/80 dark:text-red-400/80'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                {isPending
                  ? '准备中...'
                  : isRunning
                    ? '生成中...'
                    : isError
                      ? 'Error'
                      : isFinished
                        ? 'Completed'
                        : 'Final Report'}
              </p>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none break-words',
            'prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
            'prose-pre:my-2 prose-pre:bg-muted prose-pre:rounded-lg',
            'prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
            'prose-code:before:content-none prose-code:after:content-none'
          )}
        >
          {isError ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>生成报告时发生错误，请重试。</span>
            </div>
          ) : message.trim() ? (
            <div className="relative">
              <Streamdown>{message}</Streamdown>
              {isRunning && !message.includes('Generating final report...') && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-slate-600 dark:bg-slate-400 animate-pulse" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground italic">
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isPending ? '准备生成内容...' : isRunning ? '正在生成内容...' : '内容为空'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChatEventRenderer.displayName = 'ChatEventRenderer';

export default ChatEventRenderer;

