import React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  showValue = false,
  unit = '',
  id,
  value,
  className = '',
  ...props
}) => {
  const sliderId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={sliderId} className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        {showValue && value !== undefined && (
          <span className="text-sm text-gray-400">
            {value}{unit}
          </span>
        )}
      </div>
      <input
        id={sliderId}
        type="range"
        value={value}
        className={[
          'h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700',
          'accent-green-500',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  );
};
