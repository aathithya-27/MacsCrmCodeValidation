
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const PlaceholderPage: React.FC = () => {
    const location = useLocation();
    const pageName = location.pathname.substring(1) 
        .replace(/-/g, ' ') 
        .replace(/([A-Z])/g, ' $1') 
        .replace(/\b\w/g, char => char.toUpperCase()); 

    return (
        <div className="p-8 text-center flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <Wrench className="h-16 w-16 mb-4 text-slate-400 dark:text-slate-500" />
            <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-300 mb-2">{pageName}</h1>
            <p className="text-lg">This page is under construction.</p>
            <p className="text-md mt-1">Please check back later!</p>
        </div>
    );
};

export default PlaceholderPage;
