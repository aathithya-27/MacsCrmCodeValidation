

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MasterDataSidebar, { masterDataNavItems } from './MasterDataSidebar';
import { ChevronDownIcon } from '../icons/Icons';
import MasterDataRouter from '../../masterdata/MasterDataRouter';

const MasterDataNavDropdown: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const currentItem = [...masterDataNavItems]
        .reverse()
        .find(item => location.pathname.startsWith(item.to));

    const handleNavigation = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const path = e.target.value;
        if (path) {
            navigate(path);
        }
    };

    return (
        <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Master Data</h2>
            <div className="relative">
                <select
                    value={currentItem?.to || ''}
                    onChange={handleNavigation}
                    className="w-full pl-3 pr-10 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Master Data Navigation"
                >
                    {masterDataNavItems.map(item => (
                        <option key={item.label} value={item.to}>
                            {item.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                    <ChevronDownIcon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
};

const MasterDataLayout: React.FC = () => {
    return (
        <div className="flex h-full">
            <div className="hidden xl:flex flex-shrink-0">
                <MasterDataSidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                 <div className="xl:hidden p-4 sm:p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <MasterDataNavDropdown />
                </div>
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <MasterDataRouter />
                </div>
            </div>
        </div>
    );
};

export default MasterDataLayout;
