import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function BigButton({ children, className = '', type = 'button', ...props }: BigButtonProps) {
  return (
    <button
      className={`bb-child-target inline-flex items-center justify-center gap-2 bg-bb-teal-deep px-6 text-[20px] font-extrabold text-bb-surface shadow-sm ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
