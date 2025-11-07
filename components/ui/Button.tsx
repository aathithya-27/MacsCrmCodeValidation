import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'light';
    size?: 'normal' | 'small';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, variant = 'primary', size = 'normal', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2";
    
    const sizeClasses = {
        normal: "px-4 py-2 text-sm",
        small: "px-2.5 py-1 text-xs",
    };

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
        light: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
    };

    return (
        <button ref={ref} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;