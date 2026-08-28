import React, { useState, useEffect, useRef } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(prev => !prev)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10 animate-fade-in-up">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {/* FIX: Use a generic with `React.isValidElement` to inform TypeScript that child elements are expected to have an `onClick` prop. This resolves errors when cloning the element to inject behavior (closing the dropdown) before calling the original handler. */}
            {React.Children.map(children, (child) => {
              if (React.isValidElement<{ onClick?: () => void }>(child)) {
                return React.cloneElement(child, {
                  onClick: () => {
                    setIsOpen(false);
                    if (child.props.onClick) {
                      child.props.onClick();
                    }
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ children, icon, className = '', ...props }) => {
    return (
        <button
            {...props}
            className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${className}`}
            role="menuitem"
        >
            {icon && <span className="mr-3 text-gray-400 dark:text-gray-500">{icon}</span>}
            {children}
        </button>
    );
};


export default Dropdown;