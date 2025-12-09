'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { User, Bot, Sparkles, Menu, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DeepResearchPageStore, Conversation, ClarifyEvent, BriefEvent, ChatEvent, ToolCallEvent, GroupEvent } from '@/stores';
import { userStore } from '@/stores/User';
import { EventRendererRegistry } from '@/services';
import { ClarifyEventRenderer } from '@/components/ClarifyEventRenderer';
import { BriefEventRenderer } from '@/components/BriefEventRenderer';
import { ChatEventRenderer } from '@/components/ChatEventRenderer';
import { ToolCallEventRenderer } from '@/components/ToolCallEventRenderer';
import { GroupEventRenderer } from '@/components/GroupEventRenderer';
import { TreeViewUI } from '@/components/TreeViewUI';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ConversationComposer } from '@/components/ConversationComposer';
import { ToastContainer } from '@/components/Toast';
import { AuthButton } from '@/components/AuthButton';
import {flowResult} from 'mobx';

// 按 subType 注册渲染器
EventRendererRegistry.register<ClarifyEvent.IData>('clarify', ClarifyEventRenderer);
EventRendererRegistry.register<BriefEvent.IData>('brief', BriefEventRenderer);
EventRendererRegistry.register<ChatEvent.IData>('chat', ChatEventRenderer);
EventRendererRegistry.register<ToolCallEvent.IData>('tool_call', ToolCallEventRenderer);
EventRendererRegistry.register<GroupEvent.IData>('group', GroupEventRenderer);

/** 用户消息元素渲染组件 */
const UserElementRenderer = observer<{ element: Conversation.UserElement }>(({ element }) => (
  <div className="flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 justify-end pl-12">
    <div className="relative rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm max-w-full overflow-hidden bg-primary text-primary-foreground rounded-tr-sm">
      <div className="whitespace-pre-wrap break-words">{element.content}</div>
    </div>
    <Avatar className="h-8 w-8 border shrink-0">
      {userStore.currentUser?.avatarUrl && <AvatarImage src={userStore.currentUser.avatarUrl} />}
      <AvatarFallback className="bg-muted">
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  </div>
));

/** 助手元素渲染组件 - 渲染包含 ExecutionResponse 的 assistant element */
const AssistantElementRenderer = observer<{ element: Conversation.AssistantElement }>(({ element }) => {
  const { executionResponse } = element;
  
  return (
    <div className="flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 justify-start pr-12">
      <Avatar className="h-8 w-8 border bg-background shadow-sm shrink-0">
        <AvatarFallback className="bg-primary/5 text-primary">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3 min-w-0">
        {executionResponse.treeView.topLevelEventNodes.length > 0 ? (
          <TreeViewUI treeView={executionResponse.treeView} />
        ) : null}
      </div>
    </div>
  );
});


/** Loading 指示器组件 */
const LoadingIndicator = observer(() => (
  <div className="flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 justify-start pr-12">
    <Avatar className="h-8 w-8 border bg-background shadow-sm shrink-0">
      <AvatarFallback className="bg-primary/5 text-primary">
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="relative rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm bg-background border text-foreground rounded-tl-sm">
      <div className="flex items-center gap-1 h-5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]"></span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]"></span>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]"></span>
      </div>
    </div>
  </div>
));

/** 登录提示组件 */
const LoginPrompt = observer<{ store: DeepResearchPageStore }>(({ store }) => {
  const handleSignIn = async () => {
    try {
      await flowResult(userStore.signInWithGitHub());
    } catch (error) {
      store.showToast('GitHub 登录失败，请重试', 'error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E9EEF6]">
        <Sparkles className="h-10 w-10 text-[#4F6EC7]" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">欢迎使用 DeepResearch</h2>
        <p className="text-slate-600 max-w-md">
          使用 GitHub 账号登录后，即可开始深度研究之旅。
          <br />
          您的对话历史将被安全保存。
        </p>
      </div>
      <Button
        onClick={handleSignIn}
        disabled={userStore.isAuthLoading}
        size="lg"
        className="gap-2 bg-[#24292e] hover:bg-[#1a1e22] text-white"
      >
        <Github className="h-5 w-5" />
        使用 GitHub 登录
      </Button>
    </div>
  );
});

const DeepResearchPage = observer(() => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const store = useMemo(() => new DeepResearchPageStore(), []);

  // Initialize client and auth
  useEffect(() => {
    store.initClient();
    
    // Cleanup on unmount
    return () => {
      store.dispose();
    };
  }, [store]);

  // Auto-scroll to bottom when elements change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.handleSubmit();
  };

  const handleSuggestedPrompt = (prompt: string) => {
    store.setInputValue(prompt);
    composerInputRef.current?.focus();
  };

  // 判断是否显示 loading：正在加载且最后一个元素是用户消息
  const lastElement = store.elements[store.elements.length - 1];
  const showLoading = store.isLoading && lastElement && Conversation.isUserElement(lastElement);
  const hasConversation = Boolean(store.currentConversation);
  const isAuthenticated = userStore.isAuthenticated;

  return (
    <div className="flex h-screen w-full min-h-0 bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Toast 通知 */}
      <ToastContainer store={store} />
      
      {/* Sidebar */}
      <ConversationSidebar store={store} />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between bg-white/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => store.toggleSidebar()}
              className="h-9 w-9 text-slate-600 hover:bg-[#E9EEF6] hover:text-slate-900"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9EEF6] text-[#4F6EC7]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">DeepResearch</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden md:block">
              Powered by LangGraph
            </span>
            <AuthButton store={store} />
          </div>
        </header>

        {/* Chat Area */}
        <div
          className={cn(
            'flex-1 min-h-0 overflow-hidden relative transition-colors duration-200',
            hasConversation ? 'bg-white' : 'bg-[#F0F4F8]'
          )}
        >
          {hasConversation ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full p-4 md:p-8" ref={scrollAreaRef}>
                  <div className="mx-auto max-w-3xl space-y-8 pb-24">
                    {/* 按照 elements 的顺序渲染所有元素 */}
                    {store.elements.map((element) => {
                      if (Conversation.isUserElement(element)) {
                        return <UserElementRenderer key={element.id} element={element} />;
                      } else if (Conversation.isAssistantElement(element)) {
                        return <AssistantElementRenderer key={element.id} element={element} />;
                      }
                      return null;
                    })}

                    {/* Loading 指示器 */}
                    {showLoading && <LoadingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              <div className="border-t border-[#E1E6F0] bg-white p-4 md:p-6">
                <div className="mx-auto max-w-3xl">
                  <ConversationComposer
                    variant="chat"
                    value={store.inputValue}
                    typewriterOptions={{
                      enable: false
                    }}
                    placeholder="Ask anything"
                    onChange={(value) => store.setInputValue(value)}
                    onSubmit={handleSubmit}
                    isLoading={store.isLoading}
                    canSubmit={store.canSubmit}
                    inputRef={composerInputRef}
                  />
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    DeepResearch 可以帮助您进行深度话题研究，可能需要一些时间来生成报告。
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 py-10">
              <div className="w-full max-w-4xl space-y-6">
                {!isAuthenticated ? (
                  // 未登录状态：显示登录提示
                  <LoginPrompt store={store} />
                ) : (
                  // 已登录状态：显示输入框和推荐提示
                  <>
                    <ConversationComposer
                      variant="landing"
                      value={store.inputValue}
                      onChange={(value) => store.setInputValue(value)}
                      onSubmit={handleSubmit}
                      isLoading={store.isLoading || store.isCreatingConversation}
                      canSubmit={store.canSubmit && !store.isCreatingConversation}
                      inputRef={composerInputRef}
                    />
                    {store.isCreatingConversation && (
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#4F6EC7]" />
                        <span>正在创建对话...</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[
                        '2024 年 AI 投融资趋势',
                        '为初创公司设计研究流程',
                        'Tavily 搜索在研究代理中的作用',
                        'Supervisor Agent 的协作模式'
                      ].map((prompt) => (
                        <Button
                          key={prompt}
                          variant="ghost"
                          className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:bg-slate-50"
                          onClick={() => handleSuggestedPrompt(prompt)}
                          disabled={store.isCreatingConversation}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
       </div>
      </div>
    </div>
  );
});

export default DeepResearchPage;
