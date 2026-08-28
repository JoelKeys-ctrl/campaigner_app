import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, icon, iconRight, onIconRightClick, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          id={id}
          ref={ref}
          className={`w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${icon ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''}`}
          {...props}
        />
        {iconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Toggle password visibility"
          >
            {iconRight}
          </button>
        )}
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;