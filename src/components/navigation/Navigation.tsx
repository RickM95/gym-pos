"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Users,
    ShoppingBag,
    Package,
    BarChart3,
    TrendingUp,
    FileText,
    Settings,
    ChevronDown,
    Menu,
    X,
    Dumbbell,
    Scan
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
    children?: NavItem[];
    highlight?: boolean;
}

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const pathname = usePathname();

    const navigationItems: NavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <Home size={20} />,
            href: '/'
        },
        {
            id: 'scan',
            label: 'Quick Check-In',
            icon: <Scan size={20} />,
            href: '/scan',
            highlight: true
        },
        {
            id: 'members',
            label: 'Members',
            icon: <Users size={20} />,
            href: '/clients'
        },
        {
            id: 'analytics',
            label: 'Business Analytics',
            icon: <BarChart3 size={20} />,
            href: '/analytics'
        },
        {
            id: 'sales',
            label: 'Sales & Revenue',
            icon: <TrendingUp size={20} />,
            href: '/sales'
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: <Package size={20} />,
            href: '/inventory'
        },
        {
            id: 'programs',
            label: 'Programs',
            icon: <Dumbbell size={20} />,
            href: '/workouts',
            children: [
                {
                    id: 'workouts',
                    label: 'Workouts',
                    icon: <Dumbbell size={16} />,
                    href: '/workouts'
                },
                {
                    id: 'exercises',
                    label: 'Exercises',
                    icon: <Dumbbell size={16} />,
                    href: '/exercises'
                },
                {
                    id: 'plans',
                    label: 'Plans',
                    icon: <Dumbbell size={16} />,
                    href: '/plans'
                }
            ]
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: <FileText size={20} />,
            href: '/reports'
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings size={20} />,
            href: '/settings',
            children: [
                {
                    id: 'general',
                    label: 'General',
                    icon: <Settings size={16} />,
                    href: '/settings'
                },
                {
                    id: 'access',
                    label: 'Access Control',
                    icon: <Settings size={16} />,
                    href: '/settings/access'
                },
                {
                    id: 'sync',
                    label: 'Sync Settings',
                    icon: <Settings size={16} />,
                    href: '/settings/sync'
                }
            ]
        }
    ];

    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    const isChildActive = (children?: NavItem[]) => {
        if (!children) return false;
        return children.some(child => isActive(child.href));
    };

    const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const active = isActive(item.href) || (hasChildren && isChildActive(item.children));

        if (hasChildren) {
            return (
                <div key={item.id}>
                    <button
                        onClick={() => toggleExpanded(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            } ${level > 0 ? 'pl-' + (4 + level * 4) : ''}`}
                    >
                        {item.icon}
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isExpanded && item.children && (
                        <div className="mt-1 space-y-1">
                            {item.children.map(child => (
                                <NavItemComponent key={child.id} item={child} level={1} />
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${active
                        ? (item.highlight ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-blue-500/50' : 'bg-blue-600 text-white')
                        : (item.highlight ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/30' : 'text-gray-300 hover:bg-gray-800 hover:text-white')
                    } ${level > 0 ? 'pl-' + (4 + level * 4) : ''} ${item.highlight ? 'font-bold' : ''}`}
                onClick={() => setIsOpen(false)}
            >
                {item.icon}
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <nav className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Dumbbell size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Spartan Gym</h1>
                                <p className="text-xs text-gray-400">Management System</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navigationItems.map(item => (
                            <NavItemComponent key={item.id} item={item} />
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-800">
                        <div className="text-center text-xs text-gray-500">
                            <p>Spartan Gym Platform</p>
                            <p>v1.0.0</p>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}