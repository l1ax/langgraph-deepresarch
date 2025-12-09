'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { DeepResearchPageStore } from '@/stores';
import { userStore } from '@/stores/User';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, Sparkles, Trash2, Loader2, LogOut, User, Github } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dayjs from '@/lib/dayjs';
import {flowResult} from 'mobx';

interface ConversationSidebarProps {
  store: DeepResearchPageStore;
}

export const ConversationSidebar = observer(({ store }: ConversationSidebarProps) => {
  const { conversations, currentConversation, isSidebarOpen, isLoadingConversations } = store;

  /** 处理登录 */
  const handleSignIn = async () => {
    try {
      await flowResult(userStore.signInWithGitHub());
    } catch (error) {
      store.showToast('GitHub 登录失败，请重试', 'error');
    }
  };

  /** 处理登出 */
  const handleSignOut = async () => {
    try {
      await flowResult(userStore.signOut());
      store.showToast('已成功登出', 'success');
    } catch (error) {
      store.showToast('登出失败，请重试', 'error');
    }
  };

  /** 处理删除会话 */
  const handleDeleteConversation = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发切换会话
    
    // 如果正在删除，忽略点击
    if (store.isConversationDeleting(threadId)) return;
    
    if (window.confirm('确定要删除这个对话吗？')) {
      store.deleteConversation(threadId);
    }
  };

  if (!isSidebarOpen) return null;

  return (
    <div className="w-64 h-full bg-[#E9EEF6] text-slate-900 flex flex-col border-r border-[#D4DBE8]">
      {/* 顶部：新建对话按钮 */}
      <div className="h-20 p-4 bg-[#E3EAF5]">
        <Button
          onClick={() => store.createNewConversation()}
          className="w-full h-12 rounded-lg bg-[#4F6EC7] hover:bg-[#3C5AB1] text-white font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>新建对话</span>
        </Button>
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1 px-3 py-4">
        {/* 加载状态 */}
        {isLoadingConversations ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <span className="text-sm">加载对话列表...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <span className="text-sm">暂无对话</span>
            <span className="text-xs mt-1">点击上方按钮开始新对话</span>
          </div>
        ) : (
          <div className="space-y-2 w-56">
            {conversations.map((conversation) => {
              const isActive = currentConversation?.threadId === conversation.threadId;
              const isDeleting = store.isConversationDeleting(conversation.threadId);
              const title = conversation.getTitle();

              return (
                <div
                  key={conversation.threadId}
                  className={cn(
                    'w-full rounded-2xl p-[2px] transition-all duration-200',
                    isDeleting && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div
                    className={cn(
                      'w-full text-left px-3 py-3 rounded-[1.35rem] transition-all duration-150 group relative',
                      isActive ? 'bg-white' : 'bg-transparent hover:bg-white/70'
                    )}
                  >
                    <button
                      onClick={() => store.switchToConversation(conversation.threadId)}
                      className="w-full text-left"
                      disabled={isDeleting}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 p-1.5 rounded-md shrink-0 border border-transparent transition-colors',
                            isActive
                              ? 'bg-[#4F6EC7]/15 border-[#4F6EC7]/30 text-[#3D5AB8]'
                              : 'bg-[#DFE6F3] text-[#7A88AB] group-hover:bg-white group-hover:text-[#4F6EC7]'
                          )}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={cn(
                            'text-sm font-semibold leading-tight truncate max-w-[140px] block',
                            isActive ? 'text-slate-900' : 'text-slate-700'
                          )}>
                            {title}
                          </p>
                          {conversation.createdAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              {isDeleting ? '删除中...' : dayjs(conversation.createdAt).fromNow()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.threadId)}
                      disabled={isDeleting}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-150',
                        'opacity-0 group-hover:opacity-100',
                        'text-slate-400 hover:text-red-500 hover:bg-red-50',
                        isDeleting && 'opacity-100 cursor-not-allowed'
                      )}
                      title="删除对话"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* 底部：用户信息 */}
      <div className="p-4 border-t border-[#D4DBE8] bg-[#E3EAF5]">
        {userStore.currentUser ? (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/70">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 shrink-0">
                {userStore.currentUser.avatarUrl && (
                  <AvatarImage src={userStore.currentUser.avatarUrl} alt={userStore.currentUser.name || ''} />
                )}
                <AvatarFallback className="bg-[#4F6EC7]/15 text-[#4F6EC7]">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {userStore.currentUser.name || userStore.currentUser.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-500 hover:bg-red-50"
              title="登出"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSignIn}
            disabled={userStore.isAuthLoading}
            className="w-full gap-2 bg-[#24292e] hover:bg-[#1a1e22] text-white"
          >
            <Github className="h-4 w-4" />
            使用 GitHub 登录
          </Button>
        )}
      </div>
    </div>
  );
});
