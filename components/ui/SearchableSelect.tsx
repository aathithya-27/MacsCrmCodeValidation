import React, { useState, useRef, useEffect } from 'react';
import type { SelectOption } from '../../types';
import { ChevronDownIcon } from '../icons/Icons';

interface SearchableSelectProps {
    label: string;
    options: SelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(opt => opt.value === value)?.label || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredOptions = searchTerm
        ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
        : options;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="w-full flex items-center justify-between bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed dark:disabled:bg-slate-600"
                >
                    <span className="block truncate text-slate-900 dark:text-slate-200">{selectedLabel || `Select ${label}...`}</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 focus:outline-none sm:text-sm flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                             <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                autoFocus
                            />
                        </div>
                       
                        <ul className="flex-1 overflow-y-auto py-1">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${value === option.value ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'} hover:bg-slate-100 dark:hover:bg-slate-700`}
                                >
                                    <span className={`block truncate ${value === option.value ? 'font-semibold' : 'font-normal'}`}>
                                        {option.label}
                                    </span>
                                </li>
                            )) : (
                                <li className="cursor-default select-none relative py-2 px-4 text-slate-500 dark:text-slate-400">
                                    No options found.
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;