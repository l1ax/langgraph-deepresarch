'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationComposerProps {
  variant?: 'chat' | 'landing';
  value: string;
  placeholder?: string;
  useTypewriter?: boolean;
  typewriterStrings?: string[];
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isLoading: boolean;
  canSubmit: boolean;
  inputRef?: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  className?: string;
}

const DEFAULT_TYPEWRITER_STRINGS = [
  "分析下英伟达最新财报的亮点与风险...",
  "对比特斯拉与比亚迪供应链的差异...",
  "研究具身智能的商业化现状...",
  "预测量子计算在金融领域的应用...",
];

export const ConversationComposer: React.FC<ConversationComposerProps> = ({
  variant = 'chat',
  value,
  placeholder = "问点什么...",
  useTypewriter = false,
  typewriterStrings = DEFAULT_TYPEWRITER_STRINGS,
  onChange,
  onSubmit,
  isLoading,
  canSubmit,
  inputRef,
  className,
}) => {
  const isLanding = variant === 'landing';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Typewriter state
  const [displayPlaceholder, setDisplayPlaceholder] = useState('');
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Typewriter effect
  useEffect(() => {
    if (!useTypewriter || typewriterStrings.length === 0) {
      setDisplayPlaceholder(placeholder);
      return;
    }

    const currentString = typewriterStrings[stringIndex];
    
    const tick = () => {
      if (isPaused) return;
      
      if (isDeleting) {
        // Deleting characters
        setDisplayPlaceholder(currentString.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        
        if (charIndex <= 1) {
          setIsDeleting(false);
          setStringIndex((prev) => (prev + 1) % typewriterStrings.length);
        }
      } else {
        // Typing characters
        setDisplayPlaceholder(currentString.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        
        if (charIndex >= currentString.length) {
          // Pause before deleting
          setIsPaused(true);
          setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(true);
          }, 2000); // Pause for 2 seconds
        }
      }
    };

    const typingSpeed = isDeleting ? 30 : 80;
    const timer = setTimeout(tick, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [useTypewriter, typewriterStrings, stringIndex, charIndex, isDeleting, isPaused, placeholder]);

  // Auto-resize
  useEffect(() => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  // Sync ref
  useEffect(() => {
    if (inputRef && textareaRef.current) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        inputRef.current = textareaRef.current;
    }
  }, [inputRef]);
  
  const effectivePlaceholder = useTypewriter ? displayPlaceholder : placeholder;

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'relative w-full transition-all duration-300',
        isLanding ? 'max-w-2xl mx-auto' : 'w-full',
        className
      )}
    >
      <div className={cn(
          "relative flex items-end gap-2 w-full bg-prompter-bg border border-prompter-border overflow-hidden transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 shadow-lg",
          isLanding ? "rounded-3xl p-4 min-h-[120px]" : "rounded-[28px] p-2 pl-4 pr-2"
      )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={effectivePlaceholder}
            disabled={isLoading}
            rows={1}
            className={cn(
                "w-full resize-none bg-transparent text-base md:text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-hide",
                isLanding ? "h-full py-2" : "max-h-[200px] py-3.5"
            )}
            style={{ minHeight: isLanding ? '80px' : '24px' }}
          />
          
          <div className="flex shrink-0 pb-1.5">
             <Button
                type="submit"
                size="icon"
                disabled={!canSubmit && !isLoading}
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-200",
                  canSubmit 
                     ? "bg-foreground text-background hover:bg-foreground/90 hover:scale-105" 
                     : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                  isLoading && "opacity-100 bg-muted cursor-wait"
                )}
             >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                ) : (
                    <ArrowUp className="h-5 w-5" />
                )}
                <span className="sr-only">发送</span>
             </Button>
          </div>
      </div>
    </form>
  );
};
