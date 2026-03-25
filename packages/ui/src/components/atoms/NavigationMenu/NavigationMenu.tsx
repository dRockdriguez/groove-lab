import React from 'react';

export interface NavigationMenuItem {
  href: string;
  label: string;
}

export interface NavigationMenuProps {
  items: NavigationMenuItem[];
  activeHref?: string;
  className?: string;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ items, activeHref, className = '' }) => {
  return (
    <nav
      role="navigation"
      className={['flex items-center gap-4', className].filter(Boolean).join(' ')}
    >
      {items.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={[
              'transition-colors duration-200',
              isActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400',
            ].join(' ')}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
};
