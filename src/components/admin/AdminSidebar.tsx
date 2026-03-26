'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    Users, 
    BookOpen, 
    Activity, 
    Wrench, 
    LogOut,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
    { name: '대시보드', href: '/admin', icon: LayoutDashboard },
    { name: '사용자 관리', href: '/admin/users', icon: Users },
    { name: '콘텐츠 관리', href: '/admin/contents', icon: BookOpen },
    { name: '활동 관리', href: '/admin/activities', icon: Activity },
    { name: '리그 테스트', href: '/admin/league-test', icon: Wrench },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 transition-all duration-300 ease-in-out">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                    A
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Admin</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive 
                                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform duration-200",
                                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 border border-transparent hover:border-rose-500/20"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">사이트로 돌아가기</span>
                </Link>
            </div>
        </aside>
    );
}
