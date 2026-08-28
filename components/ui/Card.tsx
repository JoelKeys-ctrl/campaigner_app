import React from 'react';

// FIX: The Card component's props are extended to include all standard HTML div attributes.
// This allows passing props like `onClick`, which is needed by the Modal component.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div {...props} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;