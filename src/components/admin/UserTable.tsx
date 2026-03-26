'use client';

import { useState } from 'react';
import { 
    Search, 
    Filter, 
    MoreHorizontal, 
    Edit2, 
    CheckCircle2, 
    XCircle,
    Shield,
    User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UserEditModal } from './UserEditModal';

interface UserTableProps {
    users: any[];
    total: number;
}

export function UserTable({ users, total }: UserTableProps) {
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    전체 <span className="text-white font-bold">{total}</span>명의 사용자
                </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">사용자</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">권한</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">계정 종류</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">상태</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">가입일</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{user.nickname || '익명'}</span>
                                                    {user.is_test && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">TEST</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 block mt-0.5 font-mono">ID: {user.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'admin' ? (
                                            <div className="flex items-center gap-1.5 text-indigo-400">
                                                <Shield className="w-4 h-4" />
                                                <span className="text-xs font-bold">Admin</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize",
                                            user.provider === 'kakao' 
                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" 
                                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        )}>
                                            {user.provider || 'Email'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_active ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-xs font-medium">Active</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-rose-500">
                                                <XCircle className="w-4 h-4" />
                                                <span className="text-xs font-medium">Deactivated</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleEdit(user)}
                                            className="text-slate-500 hover:text-white hover:bg-slate-800"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserEditModal 
                user={selectedUser}
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    // revalidatePath가 서버 액션에서 이미 호출됨
                }}
            />
        </div>
    );
}
