import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-[--color-outline]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{
          background: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
          color: 'var(--color-on-surface)',
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
