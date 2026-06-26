import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-[#fffdf9] rounded-2xl shadow-sm border border-amber-100/50 p-4
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
