import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}
