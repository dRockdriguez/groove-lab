import React, { useState, useRef, useEffect } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface MenuProps {
  trigger: React.ReactElement;
  items: MenuItem[];
  align?: 'left' | 'right';
}

export const Menu: React.FC<MenuProps> = ({ trigger, items, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {React.cloneElement(trigger, { onClick: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={[
            'absolute z-50 mt-1 min-w-[160px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {items.map((item) =>
            item.separator ? (
              <div key={item.id} className="my-1 border-t border-gray-800" role="separator" />
            ) : (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center gap-2 px-4 py-2 text-sm text-left',
                  'text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
                  item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
