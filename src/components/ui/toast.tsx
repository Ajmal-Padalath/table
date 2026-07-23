'use client';

import { useToastStore } from '@/store/useToastStore';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full p-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto transition-all transform translate-y-0 duration-300 animate-in fade-in slide-in-from-bottom-5',
            {
              'bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50':
                t.variant === 'default' || !t.variant,
              'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-50':
                t.variant === 'success',
              'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-900 dark:text-red-50':
                t.variant === 'destructive',
            }
          )}
          role="alert"
        >
          <div className="shrink-0 mt-0.5">
            {t.variant === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {t.variant === 'destructive' && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {(t.variant === 'default' || !t.variant) && <Info className="h-5 w-5 text-primary" />}
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-semibold">{t.title}</h4>
            {t.description && (
              <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t.description}
              </p>
            )}
          </div>

          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
