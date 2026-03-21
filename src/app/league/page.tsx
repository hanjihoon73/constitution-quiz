'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { MobileFrame, Header } from '@/components/common';
import { getWeeklyRanking, WeeklyRankingItem } from '@/lib/api/league';
import { Trophy, Box, CircleCheckBig, ArrowLeft, RefreshCw } from 'lucide-react';

/** KST 기준 이번 주 기간 표시 문자열 */
function getCurrentWeekLabel(): string {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const day = kstNow.getUTCDay();
    const daysSince = day === 0 ? 6 : day - 1;

    const monday = new Date(kstNow);
    monday.setUTCDate(kstNow.getUTCDate() - daysSince);
    monday.setUTCHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setUTCDate(monday.getUTCDate() + 7);

    const fmt = (d: Date) => {
        const yy = String(d.getUTCFullYear()).slice(2);
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yy}.${mm}.${dd}`;
    };

    return `${fmt(monday)} 월 0시 ~ ${fmt(nextMonday)} 월 0시`;
}

/** 순위 배지 색상 */
function getRankStyle(rank: number): { color: string; fontWeight: string } {
    if (rank === 1) return { color: '#FFD700', fontWeight: '900' };
    if (rank === 2) return { color: '#C0C0C0', fontWeight: '800' };
    if (rank === 3) return { color: '#CD7F32', fontWeight: '800' };
    return { color: '#2D2D2D', fontWeight: '700' };
}

interface RankItemProps {
    item: WeeklyRankingItem;
    animationDelay: number;
}

function RankItem({ item, animationDelay }: RankItemProps) {
    const rankStyle = getRankStyle(item.rank);
    const isMe = item.isMe;

    return (
        <div
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            style={{ animationDelay: `${animationDelay}ms`, animationDuration: '350ms' }}
        >
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isMe ? 'shadow-sm' : ''}`}
                style={{
                    backgroundColor: isMe ? '#FFF8F1' : '#ffffff',
                    border: isMe ? '2px solid #FF8400' : '1px solid #ebebeb',
                }}
            >
                {/* 순위 */}
                <div className="w-8 text-center flex-shrink-0">
                    <span className="text-[18px]" style={rankStyle}>
                        {item.rank}
                    </span>
                </div>

                {/* 타이틀 뱃지 */}
                {item.titleCode ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/${item.titleCode}.svg`} alt={item.title || ''} className="w-5 h-5 object-contain" />
                    </div>
                ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
                )}

                {/* 닉네임 + 직급 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[14px] font-semibold text-gray-900 truncate">{item.nickname}</span>
                        {item.title && (
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{item.title}</span>
                        )}
                        {isMe && (
                            <span
                                className="text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: '#FF8400', color: '#fff' }}
                            >
                                나
                            </span>
                        )}
                    </div>
                    {/* 누적 XP */}
                    <span className="text-[11px] text-gray-400">
                        누적 XP {item.totalXp.toLocaleString('ko-KR')}
                    </span>
                </div>

                {/* 우측 통계들 */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {/* 주간 XP */}
                    <span
                        className="text-[15px] font-bold tabular-nums"
                        style={{ color: '#FF8400' }}
                    >
                        {item.weeklyXp.toLocaleString('ko-KR')} XP
                    </span>

                    {/* 아이콘 통계 */}
                    <div className="flex items-center gap-2">
                        {/* 고유 완료 팩 수 */}
                        <div className="relative">
                            <Box className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                            <span
                                className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ backgroundColor: '#2D2D2D', padding: '0 3px' }}
                            >
                                {item.weeklyUniquePacks}
                            </span>
                        </div>

                        {/* 총 완료 횟수 */}
                        <div className="relative">
                            <CircleCheckBig className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                            <span
                                className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ backgroundColor: '#2D2D2D', padding: '0 3px' }}
                            >
                                {item.weeklyTotalPacks}
                            </span>
                        </div>

                        {/* 평균 정답률 */}
                        <span className="text-[11px] text-gray-500 tabular-nums">
                            {item.quizpackAvrgCorrect.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LeaguePage() {
    const router = useRouter();
    const { dbUser, isDbUserLoaded } = useAuth();

    const [rankings, setRankings] = useState<WeeklyRankingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [weekLabel, setWeekLabel] = useState('');

    const loadRankings = useCallback(async (showRefreshing = false) => {
        if (!dbUser?.id) return;
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await getWeeklyRanking(dbUser.id);
            setRankings(data);
        } catch (err) {
            console.error('[LeaguePage] 랭킹 조회 에러:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [dbUser?.id]);

    useEffect(() => {
        setWeekLabel(getCurrentWeekLabel());
    }, []);

    useEffect(() => {
        if (isDbUserLoaded && dbUser?.id) {
            loadRankings();
        }
    }, [isDbUserLoaded, dbUser?.id, loadRankings]);

    // TOP 5와 내 주변 항목을 합쳐서 중복 없이 정렬
    const displayItems: WeeklyRankingItem[] = (() => {
        const seen = new Set<number>();
        const result: WeeklyRankingItem[] = [];
        for (const item of rankings) {
            if (!seen.has(item.userId)) {
                seen.add(item.userId);
                result.push(item);
            }
        }
        return result.sort((a, b) => a.rank - b.rank);
    })();

    return (
        <MobileFrame>
            <Header />
            <main className="flex-1 overflow-y-auto flex flex-col animate-in fade-in duration-400">
                {/* 상단 컨트롤 */}
                <div className="px-4 pt-4 flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-gray-700 cursor-pointer"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <button
                        onClick={() => loadRankings(true)}
                        disabled={isRefreshing}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-gray-700 cursor-pointer disabled:opacity-50"
                        aria-label="랭킹 새로고침"
                    >
                        <RefreshCw
                            size={20}
                            className={isRefreshing ? 'animate-spin' : ''}
                        />
                    </button>
                </div>

                {/* 헤더 타이틀 영역 */}
                <div className="px-4 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-400 fill-mode-both">
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#2D2D2D' }}
                        >
                            <Trophy className="w-5 h-5" style={{ color: '#FF8400' }} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-[18px] font-bold text-gray-900">주간 리그 랭킹</h1>
                            <p className="text-[11px] text-gray-400">{weekLabel}</p>
                        </div>
                    </div>
                </div>

                {/* 랭킹 목록 */}
                <div className="px-4 pb-12 flex flex-col gap-2">
                    {isLoading ? (
                        <div className="flex flex-col gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                />
                            ))}
                        </div>
                    ) : displayItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Trophy className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                            <p className="text-[14px] text-gray-400 text-center">
                                아직 이번 주 리그 참여자가 없습니다.<br />
                                퀴즈팩을 완료하고 첫 번째 랭커가 되세요!
                            </p>
                        </div>
                    ) : (
                        displayItems.map((item, idx) => (
                            <RankItem
                                key={item.userId}
                                item={item}
                                animationDelay={idx * 50}
                            />
                        ))
                    )}
                </div>
            </main>
        </MobileFrame>
    );
}
