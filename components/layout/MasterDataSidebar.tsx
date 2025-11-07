import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    ChevronDownIcon, ChevronRight, Building, GitFork, Briefcase, FileCog, Handshake, Badge, UserCog, FileText, Globe, Map, Heart, Users, PersonStanding, Filter, TrendingDown, TrendingUp, Puzzle, Award, CalendarHeart
} from 'lucide-react';

interface NavItem {
    to: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    hasChildren?: boolean;
    children?: NavItem[];
}

export const masterDataNavItems: NavItem[] = [
    { to: "/masterData/companyMaster", label: "Company Master", icon: Building },
    { to: "/masterData/branch", label: "Branch", icon: GitFork },
    { to: "/masterData/businessVertical", label: "Business Vertical", icon: Briefcase },
    { to: "/masterData/geography", label: "Geography Management", icon: Globe },
    { to: "/masterData/customerSegment", label: "Customer Segment", icon: Puzzle },
    { to: "/masterData/tierAndGift", label: "Type & Gift Management", icon: Award },
    { to: "/masterData/policyConfiguration", label: "Policy Configuration", icon: FileCog },
    { to: "/masterData/agency", label: "Agency and Scheme", icon: Handshake },
    { to: "/masterData/designation", label: "Designation", icon: Badge },
    { to: "/masterData/role", label: "Role", icon: UserCog },
    { to: "/masterData/documentMaster", label: "Document Master", icon: FileText },
    { to: "/masterData/route", label: "Route Master", icon: Map },
    { to: "/masterData/maritalStatus", label: "Marital Status", icon: Heart },
    { to: "/masterData/gender", label: "Gender", icon: Users },
    { to: "/masterData/relationship", label: "Relationship Master", icon: PersonStanding },
    { to: "/masterData/religionAndFestival", label: "Religion & Festival", icon: CalendarHeart },
    { to: "/masterData/leadStage", label: "Lead Stage Master", icon: Filter },
    { to: "/masterData/expenseCategory", label: "Expense Category", icon: TrendingDown },
    { to: "/masterData/incomeCategory", label: "Income Category", icon: TrendingUp },
];


const NavItemLink: React.FC<{ item: NavItem; isOpen: boolean; onToggle: () => void; }> = ({ item, isOpen, onToggle }) => {
    const hasChildren = !!item.children || item.hasChildren;
    
    return (
        <li>
            <NavLink
                to={item.to}
                onClick={(e) => {
                    if (hasChildren) {
                        e.preventDefault();
                        onToggle();
                    }
                    if (item.to === '#') e.preventDefault();
                }}
                end={!hasChildren}
                className={({ isActive }) =>
                    `flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive
                            ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/50 dark:text-blue-400'
                            : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`
                }
            >
                <div className="flex items-center gap-3">
                   <item.icon className="h-4 w-4 flex-shrink-0" />
                   <span>{item.label}</span>
                </div>
                {hasChildren && (isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            </NavLink>
            {hasChildren && isOpen && item.children && (
                <ul className="pl-4 mt-1 space-y-1">
                    {item.children.map(child => (
                         <li key={child.to + child.label}>
                            <NavLink
                                to={child.to}
                                onClick={(e) => { if(child.to === '#') e.preventDefault()}}
                                className={({ isActive }) =>
                                    `flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/50 dark:text-blue-400'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <child.icon className="h-4 w-4" />
                                    <span>{child.label}</span>
                                </div>
                            </NavLink>
                         </li>
                    ))}
                </ul>
            )}
        </li>
    )
};


const MasterDataSidebar: React.FC = () => {
    const location = useLocation();
    const [openItems, setOpenItems] = useState<string[]>(() => {
        const activeParent = masterDataNavItems.find(item => item.children?.some(child => location.pathname.startsWith(child.to)) || location.pathname.startsWith(item.to));
        return activeParent ? [activeParent.label] : [];
    });

    const toggleItem = (label: string) => {
        setOpenItems(prev => prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]);
    };

    return (
        <aside className="w-64 bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4 h-full">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Master Data</h2>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
                <ul>
                    {masterDataNavItems.map((item) => (
                        <NavItemLink 
                            key={item.label}
                            item={item}
                            isOpen={openItems.includes(item.label)}
                            onToggle={() => toggleItem(item.label)}
                        />
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default MasterDataSidebar;