import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-primary text-primary-foreground': variant === 'default',
          'border-transparent bg-secondary text-secondary-foreground': variant === 'secondary',
          'border-transparent bg-destructive text-destructive-foreground': variant === 'destructive',
          'border-transparent bg-emerald-500/10 text-emerald-600 border border-emerald-500/20': variant === 'success',
          'border-transparent bg-amber-500/10 text-amber-600 border border-amber-500/20': variant === 'warning',
          'border-transparent bg-blue-500/10 text-blue-600 border border-blue-500/20': variant === 'info',
          'text-foreground border-border': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
