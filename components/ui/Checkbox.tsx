import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // FIX: Changed label type from `string` to `React.ReactNode` to allow JSX elements.
  label?: React.ReactNode;
  indeterminate?: boolean;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
  </svg>
);

const IndeterminateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 8a1 1 0 011-1h6a1 1 0 110 2H5a1 1 0 01-1-1z" />
    </svg>
);


const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', indeterminate = false, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    
    React.useEffect(() => {
        if (internalRef.current) {
            internalRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
      <label className="inline-flex items-center space-x-3 cursor-pointer">
        <div className="relative flex items-center">
            <input 
                type="checkbox" 
                ref={r => {
                    if (typeof ref === 'function') ref(r);
                    else if (ref) ref.current = r;
                    // @ts-ignore
                    internalRef.current = r;
                }}
                className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-400 dark:border-gray-600 transition-all checked:border-brand-600 checked:bg-brand-600 indeterminate:border-brand-600 indeterminate:bg-brand-600"
                {...props}
            />
            <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-100">
                {indeterminate ? <IndeterminateIcon className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" />}
            </div>
        </div>
        {label && <span className="text-gray-700 dark:text-gray-300 select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;