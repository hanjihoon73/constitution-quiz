'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserTable } from './UserTable';

interface UsersClientProps {
    initialUsers: any[];
    total: number;
}

type SortKey = 'id' | 'created_at' | 'last_login_at';
type SortOrder = 'asc' | 'desc';

// 날짜 포맷 유틸 (UserTable과 동일)
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

// 필터 배지 버튼
function FilterBadge({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            type="button"
            className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                active
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
            )}
        >
            {label}
        </button>
    );
}

export function UsersClient({ initialUsers, total }: UsersClientProps) {
    const [search, setSearch] = useState('');

    // 필터 상태 (단일 선택)
    const [providerFilter, setProviderFilter] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [testFilter, setTestFilter] = useState<boolean | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // 필터 토글 헬퍼 (string[])
    const toggleStringFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
        setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
    };

    // 정렬 헤더 클릭
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'id' ? 'asc' : 'desc');
        }
    };

    // SortIcon 컴포넌트
    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-400" />
            : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-400" />;
    };

    // 활성 필터 수
    const activeFilterCount =
        (providerFilter !== null ? 1 : 0) +
        (roleFilter !== null ? 1 : 0) +
        (activeFilter !== null ? 1 : 0) +
        (testFilter !== null ? 1 : 0);

    const resetFilters = () => {
        setProviderFilter(null);
        setRoleFilter(null);
        setActiveFilter(null);
        setTestFilter(null);
        setSearch('');
    };

    // 실시간 필터링 + 정렬 (클라이언트)
    const filtered = useMemo(() => {
        let result = [...initialUsers];

        // 검색 (id 또는 닉네임)
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            result = result.filter(
                (u) =>
                    String(u.id).includes(term) ||
                    (u.nickname || '').toLowerCase().includes(term)
            );
        }

        // 계정 종류 필터
        if (providerFilter !== null) {
            result = result.filter((u) => u.provider === providerFilter);
        }

        // 권한 필터
        if (roleFilter !== null) {
            result = result.filter((u) => u.role === roleFilter);
        }

        // 활성화 필터
        if (activeFilter !== null) {
            result = result.filter((u) => u.is_active === activeFilter);
        }

        // 테스트 계정 필터
        if (testFilter !== null) {
            result = result.filter((u) => u.is_test === testFilter);
        }

        // 정렬
        result.sort((a, b) => {
            let aVal: any = a[sortKey] ?? '';
            let bVal: any = b[sortKey] ?? '';

            if (sortKey === 'id') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            } else {
                // 날짜 문자열 비교
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [initialUsers, search, providerFilter, roleFilter, activeFilter, testFilter, sortKey, sortOrder]);

    return (
        <div className="flex flex-col h-full gap-4 min-h-0">
            {/* 검색 + 필터 한 행 — 고정 영역 */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 shrink-0">
                <div className="flex flex-wrap gap-6 items-end">
                    {/* 검색창 */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">검색</p>
                        <div className="relative w-52">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ID 또는 닉네임"
                                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-600"
                            />
                        </div>
                    </div>

                    {/* 계정 종류 */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">계정 종류</p>
                        <div className="flex gap-1.5">
                            <FilterBadge label="All" active={providerFilter === null} onClick={() => setProviderFilter(null)} />
                            <FilterBadge label="Google" active={providerFilter === 'google'} onClick={() => setProviderFilter(providerFilter === 'google' ? null : 'google')} />
                            <FilterBadge label="Kakao" active={providerFilter === 'kakao'} onClick={() => setProviderFilter(providerFilter === 'kakao' ? null : 'kakao')} />
                        </div>
                    </div>

                    {/* 권한 */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">권한</p>
                        <div className="flex gap-1.5">
                            <FilterBadge label="All" active={roleFilter === null} onClick={() => setRoleFilter(null)} />
                            <FilterBadge label="User" active={roleFilter === 'user'} onClick={() => setRoleFilter(roleFilter === 'user' ? null : 'user')} />
                            <FilterBadge label="Admin" active={roleFilter === 'admin'} onClick={() => setRoleFilter(roleFilter === 'admin' ? null : 'admin')} />
                        </div>
                    </div>

                    {/* 활성화 */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">활성화</p>
                        <div className="flex gap-1.5">
                            <FilterBadge label="All" active={activeFilter === null} onClick={() => setActiveFilter(null)} />
                            <FilterBadge label="On" active={activeFilter === true} onClick={() => setActiveFilter(activeFilter === true ? null : true)} />
                            <FilterBadge label="Off" active={activeFilter === false} onClick={() => setActiveFilter(activeFilter === false ? null : false)} />
                        </div>
                    </div>

                    {/* 테스트 계정 */}
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">테스트 계정</p>
                        <div className="flex gap-1.5">
                            <FilterBadge label="All" active={testFilter === null} onClick={() => setTestFilter(null)} />
                            <FilterBadge label="Y" active={testFilter === true} onClick={() => setTestFilter(testFilter === true ? null : true)} />
                            <FilterBadge label="N" active={testFilter === false} onClick={() => setTestFilter(testFilter === false ? null : false)} />
                        </div>
                    </div>

                    {/* 초기화 버튼 — 하단 정렬(self-end) */}
                    {(activeFilterCount > 0 || search) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="self-end text-slate-500 hover:text-white gap-1.5 h-9"
                        >
                            <X className="w-3.5 h-3.5" />
                            초기화
                        </Button>
                    )}

                    {/* 사용자 수 카운터 — 우측 끝 하단 정렬 */}
                    <p className="ml-auto self-end text-sm text-slate-400 text-right">
                        <span className="text-gray-400 font-bold">{filtered.length}</span> / {' '}
                        <span className="text-indigo-400 font-bold">{total}</span>
                    </p>
                </div>
            </div>

            {/* 테이블 — 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800">
                                <th onClick={() => handleSort('id')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none w-16">
                                    ID <SortIcon col="id" />
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">계정 종류</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">닉네임</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">타이틀</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">권한</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">활성화</th>
                                <th onClick={() => handleSort('created_at')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none w-40">
                                    가입일시 <SortIcon col="created_at" />
                                </th>
                                <th onClick={() => handleSort('last_login_at')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none w-40">
                                    마지막 로그인 <SortIcon col="last_login_at" />
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">테스트 계정</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-16">수정</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.map((user) => (
                                <UserTableRow key={user.id} user={user} />
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-slate-500">조회된 사용자가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 분리된 행 컴포넌트 (수정 모달 포함)
import { useState as useStateRow } from 'react';
import { Edit2, Shield } from 'lucide-react';
import { Button as Btn } from '@/components/ui/button';
import { UserEditModal } from './UserEditModal';

function UserTableRow({ user }: { user: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <tr className="hover:bg-slate-800/30 transition-colors group">
                {/* ID */}
                <td className="px-4 py-3.5">
                    <span className="font-mono text-slate-400 text-xs">{user.id}</span>
                </td>

                {/* 계정 종류 */}
                <td className="px-4 py-3.5">
                    <span className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize',
                        user.provider === 'kakao'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    )}>
                        {user.provider || 'Email'}
                    </span>
                </td>

                {/* 닉네임 */}
                <td className="px-4 py-3.5">
                    <span className="font-semibold text-white text-sm">{user.nickname || '익명'}</span>
                </td>

                {/* 타이틀 */}
                <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400">{user.title || '-'}</span>
                </td>

                {/* 권한 */}
                <td className="px-4 py-3.5">
                    {user.role === 'admin' ? (
                        <div className="flex items-center gap-1 text-indigo-400">
                            <Shield className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">Admin</span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400">User</span>
                    )}
                </td>

                {/* 활성화 */}
                <td className="px-4 py-3.5">
                    <span className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-bold',
                        user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    )}>
                        {user.is_active ? 'On' : 'Off'}
                    </span>
                </td>

                {/* 가입일시 */}
                <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400 tabular-nums">{formatDateTime(user.created_at)}</span>
                </td>

                {/* 마지막 로그인 */}
                <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400 tabular-nums">{formatDateTime(user.last_login_at)}</span>
                </td>

                {/* 테스트 계정 */}
                <td className="px-4 py-3.5">
                    <span className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-bold',
                        user.is_test ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-500'
                    )}>
                        {user.is_test ? 'Y' : 'N'}
                    </span>
                </td>

                {/* 관리 */}
                <td className="px-4 py-3.5 text-right">
                    <Btn
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsModalOpen(true)}
                        className="text-slate-500 hover:text-white hover:bg-slate-800 h-7 w-7"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </Btn>
                </td>
            </tr>

            <UserEditModal
                user={user}
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { }}
            />
        </>
    );
}
