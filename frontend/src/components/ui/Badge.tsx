import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type BadgeProps = {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
};

const toneMap: Record<NonNullable<BadgeProps['tone']>, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  danger: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  info: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/30',
  muted: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
};

export function Badge({ children, tone = 'muted', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1', toneMap[tone], className)}>
      {children}
    </span>
  );
}