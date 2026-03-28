'use client';

import { useState } from 'react';
import { Edit2, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserEditModal } from './UserEditModal';

interface UserTableProps {
    users: any[];
    total: number;
}

// 날짜를 YYYY.MM.DD HH:MM (24시간) 형식으로 변환
function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
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
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800">
                                {/* 기획 순서: id / 계정종류 / 닉네임 / 권한 / 활성화 / 가입일시 / 마지막로그인 / 테스트계정 / 관리 */}
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">ID</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">계정 종류</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">닉네임</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">권한</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">활성화</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">가입일시</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">마지막 로그인</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">테스트 계정</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-16">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                    {/* ID */}
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-slate-400 text-xs">{user.id}</span>
                                    </td>

                                    {/* 계정 종류 */}
                                    <td className="px-4 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize",
                                            user.provider === 'kakao'
                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        )}>
                                            {user.provider || 'Email'}
                                        </span>
                                    </td>

                                    {/* 닉네임 */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-white">{user.nickname || '익명'}</span>
                                        </div>
                                    </td>

                                    {/* 권한 */}
                                    <td className="px-4 py-4">
                                        {user.role === 'admin' ? (
                                            <div className="flex items-center gap-1.5 text-indigo-400">
                                                <Shield className="w-4 h-4" />
                                                <span className="text-xs font-bold">Admin</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">User</span>
                                        )}
                                    </td>

                                    {/* 활성화 */}
                                    <td className="px-4 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[11px] font-bold",
                                            user.is_active
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-rose-500/10 text-rose-400"
                                        )}>
                                            {user.is_active ? 'On' : 'Off'}
                                        </span>
                                    </td>

                                    {/* 가입일시 */}
                                    <td className="px-4 py-4">
                                        <span className="text-xs text-slate-400 tabular-nums">
                                            {formatDateTime(user.created_at)}
                                        </span>
                                    </td>

                                    {/* 마지막 로그인 */}
                                    <td className="px-4 py-4">
                                        <span className="text-xs text-slate-400 tabular-nums">
                                            {formatDateTime(user.last_login_at)}
                                        </span>
                                    </td>

                                    {/* 테스트 계정 */}
                                    <td className="px-4 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[11px] font-bold",
                                            user.is_test
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-slate-700/50 text-slate-500"
                                        )}>
                                            {user.is_test ? 'Y' : 'N'}
                                        </span>
                                    </td>

                                    {/* 관리 */}
                                    <td className="px-4 py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(user)}
                                            className="text-slate-500 hover:text-white hover:bg-slate-800 h-8 w-8"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="py-20 text-center text-slate-500">조회된 사용자가 없습니다.</div>
                    )}
                </div>
            </div>

            <UserEditModal
                user={selectedUser}
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {}}
            />
        </div>
    );
}
