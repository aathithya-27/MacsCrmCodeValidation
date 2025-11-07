import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, name, id, type, ...props }, ref) => {
    const inputId = id || name;
    const isDate = type === 'date';

    return (
        <div>
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label}
            </label>
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    type={type}
                    className={`block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:disabled:bg-slate-600 ${isDate ? 'pr-10' : ''}`}
                    style={isDate ? { colorScheme: 'dark' } : {}}
                    {...props}
                />
                {isDate && (
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
            </div>
        </div>
    );
});

Input.displayName = 'Input';

export default Input;