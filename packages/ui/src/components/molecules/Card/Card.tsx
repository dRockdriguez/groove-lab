import React from 'react';

export interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  footer,
  className = '',
}) => (
  <div
    className={[
      'rounded-lg border border-gray-800 bg-gray-900 shadow-md',
      className,
    ].join(' ')}
  >
    {(title || description) && (
      <div className="border-b border-gray-800 px-5 py-4">
        {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      </div>
    )}
    <div className="px-5 py-4">{children}</div>
    {footer && (
      <div className="border-t border-gray-800 px-5 py-3">{footer}</div>
    )}
  </div>
);
