'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityStat } from '@/actions/admin/activities';
import { ActivityTableRow } from './ActivityTableRow';

interface ActivitiesClientProps {
    initialActivities: ActivityStat[];
    total: number;
}

type SortKey = 'id' | 'total_xp' | 'weekly_xp' | 'weekly_ranking';
type SortOrder = 'asc' | 'desc';

export function ActivitiesClient({ initialActivities, total }: ActivitiesClientProps) {
    const [search, setSearch] = useState('');

    // Default 정렬: 누적 XP 기준 내림차순
    const [sortKey, setSortKey] = useState<SortKey>('total_xp');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            // Default sort direction for new key
            setSortOrder(key === 'id' ? 'asc' : 'desc');
        }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-400" />
            : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-400" />;
    };

    const resetFilters = () => {
        setSearch('');
    };

    const filtered = useMemo(() => {
        let result = [...initialActivities];

        if (search.trim()) {
            const term = search.trim().toLowerCase();
            result = result.filter(
                (a) =>
                    String(a.id).includes(term) ||
                    (a.nickname || '').toLowerCase().includes(term)
            );
        }

        result.sort((a, b) => {
            const aVal = Number(a[sortKey] || 0);
            const bVal = Number(b[sortKey] || 0);

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [initialActivities, search, sortKey, sortOrder]);

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] gap-4">
            {/* 검색 Filter Row */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5 shrink-0">
                <div className="flex flex-wrap gap-6 items-end">
                    {/* 검색창 */}
                    <div className="space-y-1.5 flex-1 min-w-[200px] max-w-[300px]">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">검색</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ID 또는 닉네임 검색"
                                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-600"
                            />
                        </div>
                    </div>

                    {/* 초기화 버튼 */}
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-slate-500 hover:text-white gap-1.5 h-10 px-4"
                        >
                            <X className="w-3.5 h-3.5" />
                            초기화
                        </Button>
                    )}

                    {/* 집계 카운터 */}
                    <div className="ml-auto space-y-1.5 text-right">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">사용자 수</p>
                        <p className="text-sm text-slate-400">
                            <span className="text-gray-400 font-bold">{filtered.length}</span> / {' '}
                            <span className="text-indigo-400 font-bold">{total}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="w-full relative">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-950 border-b border-slate-800 shadow-sm">
                                <th onClick={() => handleSort('id')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none w-16">
                                    ID <SortIcon col="id" />
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                                    닉네임
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                                    타이틀
                                </th>
                                <th onClick={() => handleSort('total_xp')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none text-right w-28">
                                    누적 XP <SortIcon col="total_xp" />
                                </th>
                                <th onClick={() => handleSort('weekly_xp')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none text-right w-28">
                                    주간 XP <SortIcon col="weekly_xp" />
                                </th>
                                <th onClick={() => handleSort('weekly_ranking')} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none text-right w-24">
                                    주간 랭킹 <SortIcon col="weekly_ranking" />
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24 whitespace-nowrap">
                                    퀴즈 개수
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24 whitespace-nowrap">
                                    정답 개수
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24 whitespace-nowrap">
                                    평균 정답률
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-40 whitespace-nowrap">
                                    완료팩개수 / 팩완료횟수
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-36 whitespace-nowrap">
                                    마지막 로그인
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filtered.map((activity) => (
                                <ActivityTableRow key={activity.id} activity={activity} />
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="py-24 text-center text-slate-500">
                            해당 조건의 활동 통계가 존재하지 않습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
