import { PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return <section className={cn('glass noise-overlay relative overflow-hidden rounded-3xl p-6 shadow-[0_24px_46px_rgba(2,6,23,0.38)]', className)}>{children}</section>;
}