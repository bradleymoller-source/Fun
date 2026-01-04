import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-medieval text-gold text-lg">{label}</label>
      )}
      <input
        className={`
          bg-parchment text-dark-wood font-medieval text-xl
          px-4 py-3 rounded-lg border-2 border-leather
          focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/50
          placeholder:text-leather/50
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
