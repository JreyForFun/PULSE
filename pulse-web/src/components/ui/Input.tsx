import clsx from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow',
            icon ? 'pl-10 pr-4 py-2' : 'px-4 py-2',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-indigo-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
