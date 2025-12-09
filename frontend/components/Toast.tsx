'use client';

import React from 'react';
import { observer } from 'mobx-react-lite';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeepResearchPageStore } from '@/stores';

interface ToastContainerProps {
  store: DeepResearchPageStore;
}

const toastIcons: Record<DeepResearchPageStore.ToastType, React.ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

const toastStyles: Record<DeepResearchPageStore.ToastType, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

interface ToastItemProps {
  toast: DeepResearchPageStore.Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => (
  <div
    className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
      'animate-in slide-in-from-top-2 fade-in duration-300',
      toastStyles[toast.type]
    )}
  >
    {toastIcons[toast.type]}
    <span className="text-sm font-medium flex-1">{toast.message}</span>
    <button
      onClick={() => onRemove(toast.id)}
      className="p-1 hover:bg-black/5 rounded transition-colors"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

export const ToastContainer = observer(({ store }: ToastContainerProps) => {
  if (store.toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {store.toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={(id) => store.removeToast(id)} 
        />
      ))}
    </div>
  );
});
