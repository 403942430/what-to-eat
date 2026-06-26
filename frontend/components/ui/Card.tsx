import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-stone-50 rounded-2xl shadow-sm border border-stone-200 p-4
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
