import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, id, className = '', ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'rounded-md border bg-gray-900 px-3 py-2 text-white placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          error ? 'border-red-500' : 'border-gray-700',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-red-400" role="alert">{error}</span>}
    </div>
  );
};
