import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  id,
  className = '',
  ...props
}) => {
  const checkboxId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex items-start gap-3">
      <input
        id={checkboxId}
        type="checkbox"
        className={[
          'mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-900 text-green-600',
          'focus:ring-2 focus:ring-green-500 focus:ring-offset-gray-950',
          error ? 'border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="text-sm font-medium text-gray-300 cursor-pointer">
          {label}
        </label>
        {description && <span className="text-xs text-gray-500">{description}</span>}
        {error && <span className="text-xs text-red-400" role="alert">{error}</span>}
      </div>
    </div>
  );
};
