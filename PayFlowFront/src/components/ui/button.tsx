import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        primary:   'bg-[#3525cd] text-white hover:bg-[#2a1db5] shadow-sm',
        secondary: 'bg-white border text-[#131b2e] hover:bg-[#f2f3ff]',
        ghost:     'hover:bg-[#eaedff] text-[#464555]',
        destructive: 'bg-[#131b2e] text-white hover:bg-[#131b2e]/90',
        outline:   'border border-[#777587] bg-transparent text-[#131b2e] hover:bg-[#eaedff]',
      },
      size: {
        sm:  'h-8 px-3 text-xs',
        md:  'h-9 px-4',
        lg:  'h-11 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
