import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition-colors',
  {
    variants: {
      variant: {
        paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending:   'bg-slate-100 text-slate-700 border-slate-200',
        overdue:   'bg-amber-50 text-amber-700 border-amber-200',
        suspended: 'bg-rose-50 text-rose-700 border-rose-200',
        healthy:   'bg-[#e2dfff] text-[#3525cd] border-[#c3c0ff]',
        default:   'bg-[#eaedff] text-[#464555] border-[#c7c4d8]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
