import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`
        bg-gradient-to-b from-leather to-dark-wood
        border-4 border-gold rounded-xl
        shadow-2xl p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}
