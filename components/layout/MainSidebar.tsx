import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MasterDataIcon, LogoutIcon, DashboardIcon, ReportsIcon, ProfitLossIcon } from '../icons/Icons';
import { 
    X, User, BarChart3, Users, Filter, UserCheck, ClipboardList, 
    FileText, Landmark, ArrowUpRight, Calendar, StickyNote, 
    Zap, Wrench, MapPin, Bot 
} from 'lucide-react';
import * as api from '../../services/api';

const mainNavItems = [
    { to: "/dashboard", icon: DashboardIcon, label: "Dashboard" },
    { to: "/reports-and-insights", icon: ReportsIcon, label: "Reports & Insights" },
    { to: "/advanced-reports", icon: BarChart3, label: "Advanced Reports" },
    { to: "/profit-and-loss", icon: ProfitLossIcon, label: "Profit & Loss" },
    { to: "/employee-management", icon: Users, label: "Employee Management" },
    { to: "/lead-management", icon: Filter, label: "Lead Management" },
    { to: "/customers", icon: UserCheck, label: "Customers" },
    { to: "/task-management", icon: ClipboardList, label: "Task Management" },
    { to: "/policy-list", icon: FileText, label: "Policy List" },
    { to: "/mutual-funds", icon: Landmark, label: "Mutual Funds" },
    { to: "/upselling", icon: ArrowUpRight, label: "Upselling" },
    { to: "/calendar", icon: Calendar, label: "Calendar" },
    { to: "/notes", icon: StickyNote, label: "Notes" },
    { to: "/action-hub", icon: Zap, label: "Action Hub" },
    { to: "/services-hub", icon: Wrench, label: "Services Hub" },
    { to: "/location-services", icon: MapPin, label: "Location Services" },
    { to: "/chatbot", icon: Bot, label: "Chatbot" },
    { to: "/masterData", icon: MasterDataIcon, label: "Master Data" },
];

interface MainSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({ isOpen, setIsOpen }) => {
    const [companyName, setCompanyName] = useState('Finroots');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadCompany = async () => {
            setIsLoading(true);
            try {
                const user = await api.fetchCurrentUser();
                const companies = await api.fetchCompanies();
                const currentCompany = companies.find(c => c.COMP_ID === user.comp_id);
                if (currentCompany) {
                    setCompanyName(currentCompany.COMP_NAME);
                }
            } catch (error) {
                console.error("Failed to load company name for sidebar", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadCompany();
    }, []);

    return (
        <>
            {/* Mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 xl:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />
            <aside className={`fixed xl:relative inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
                <div className="h-16 flex items-center justify-between px-4">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{isLoading ? 'Loading...' : companyName}</h1>
                     <button onClick={() => setIsOpen(false)} className="xl:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <ul>
                        {mainNavItems.map((item) => (
                            <li key={item.label}>
                                <NavLink
                                    to={item.to}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`
                                    }
                                >
                                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 space-y-2">
                     <NavLink
                        to="/my-profile"
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                            `w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                            isActive
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        <User className="h-5 w-5 mr-3" />
                        My Profile
                    </NavLink>
                    <button 
                        onClick={() => {
                            console.log('Logout clicked');
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <LogoutIcon className="h-5 w-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default MainSidebar;