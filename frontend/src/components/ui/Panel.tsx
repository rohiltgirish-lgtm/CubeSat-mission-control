import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type PanelProps = PropsWithChildren<{
  className?: string;
}>;

export function Panel({ children, className }: PanelProps) {
  return <div className={cn('rounded-2xl border border-white/8 bg-slate-950/35 p-4', className)}>{children}</div>;
}