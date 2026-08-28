import React from 'react';

// FIX: Added `as` prop to allow rendering as a span.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  as?: 'button' | 'span';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', as = 'button', ...props }) => {
  const baseClasses = 'rounded-md font-semibold focus:outline-none focus:ring-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 ease-in-out hover:-translate-y-px active:scale-95 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 shadow-md hover:shadow-lg',
    secondary: 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:ring-brand-500',
    ghost: 'bg-transparent hover:bg-brand-500/10 text-brand-600 dark:text-brand-300 focus:ring-brand-500',
  };
  
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </>
  );

  if (as === 'span') {
    return (
      <span className={combinedClasses} role="button">
        {content}
      </span>
    );
  }

  return (
    <button className={combinedClasses} disabled={isLoading} {...props}>
      {content}
    </button>
  );
};

export default Button;