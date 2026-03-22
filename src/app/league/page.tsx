'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { MobileFrame, Header } from '@/components/common';
import { getWeeklyRanking, WeeklyRankingItem } from '@/lib/api/league';
import { Trophy, Box, CircleCheckBig, ArrowLeft, RefreshCw, CircleHelp } from 'lucide-react';

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

    return `${fmt(monday)} ~ ${fmt(nextMonday)}`;
}


interface RankItemProps {
    item: WeeklyRankingItem;
    animationDelay: number;
}

function RankItem({ item, animationDelay }: RankItemProps) {
    const isMe = item.isMe;
    const itemRef = useRef<HTMLDivElement>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        if (isMe && itemRef.current) {
            const timer = setTimeout(() => {
                const element = itemRef.current;
                const container = element?.closest('main');

                if (element && container) {
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();

                    // 컨테이너 내부에서의 상대적인 Y 스크롤 위치
                    const relativeY = elementRect.top - containerRect.top + container.scrollTop;

                    // 상단 고정 영역(약 350px) + 살짝 띄워주는 여백(80px)
                    const headerHeight = 350;
                    const margin = 110;
                    const targetTop = relativeY - headerHeight - margin;

                    container.scrollTo({ top: targetTop, behavior: 'smooth' });
                } else {
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isMe]);

    const renderRank = () => {
        if (item.rank <= 3) {
            const medalSrc = item.rank === 1 ? '/medal_gold.svg' : item.rank === 2 ? '/medal_silver.svg' : '/medal_bronze.svg';
            return (
                <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={medalSrc} alt={`rank ${item.rank}`} className="w-full h-full object-contain" />
                    <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-white pb-2">
                        {item.rank}
                    </span>
                </div>
            );
        }
        return (
            <div className="w-12 text-center flex-shrink-0">
                <span className="text-[20px] font-bold text-gray-900">
                    {item.rank}
                </span>
            </div>
        );
    };

    const formatXp = (xp: number) => {
        if (xp >= 1000) return (xp / 1000).toFixed(2).replace(/\.00$/, '') + 'K';
        return xp.toLocaleString('ko-KR');
    };

    return (
        <div
            ref={itemRef}
            className={`animate-in fade-in slide-in-from-bottom-2 fill-mode-both relative ${showTooltip ? 'z-[100]' : 'z-0'}`}
            style={{ animationDelay: `${animationDelay}ms`, animationDuration: '350ms' }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* 툴팁 UI */}
            {showTooltip && (
                <div
                    className="absolute -top-[35px] right-6 z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="bg-white/70 backdrop-blur-lg px-4 py-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center gap-5 border border-white/20">
                        {/* 유니크 팩 수 */}
                        <div className="relative flex items-center">
                            <Box className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                            <div className="absolute -top-1 -right-2.5 bg-[#2D2D2D] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                                {item.weeklyUniquePacks}
                            </div>
                        </div>
                        {/* 총 완료 횟수 */}
                        <div className="relative flex items-center">
                            <CircleCheckBig className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                            <div className="absolute -top-1 -right-2.5 bg-[#2D2D2D] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                                {item.weeklyTotalPacks}
                            </div>
                        </div>
                        {/* 평균 정답률 */}
                        <span className="text-[14px] font-medium text-gray-400 tabular-nums">
                            {item.quizpackAvrgCorrect.toFixed(1)}%
                        </span>
                    </div>
                    {/* 말풍선 꼬리 */}
                    <div className="w-3 h-3 bg-white/70 backdrop-blur-lg border-r border-b border-white/20 shadow-[4px_4px_8px_rgba(0,0,0,0.05)] absolute -bottom-1.5 right-6 rotate-45" />
                </div>
            )}

            <div
                onClick={() => setShowTooltip(!showTooltip)}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${isMe ? 'shadow-sm' : ''}`}
                style={{
                    backgroundColor: isMe ? '#FFF8F1' : '#ffffff',
                    borderColor: isMe ? '#FF8400' : '#DBDBDB',
                }}
            >
                {/* 순위 (메달 또는 숫자) */}
                {renderRank()}

                {/* 사용자 정보 (닉네임 + 타이틀) */}
                <div className="flex-1 min-w-0 flex items-center gap-4">
                    <span className="text-[16px] font-regular text-gray-900 truncate">
                        {item.nickname}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {item.titleCode && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/${item.titleCode}.svg`} alt="" className="w-5 h-5 object-contain" />
                        )}
                        {item.title && (
                            <div className="flex items-center justify-center px-3 h-5 bg-[#2D2D2D] rounded-full">
                                <span className="text-[12px] font-medium text-white leading-none">{item.title}</span>
                            </div>
                        )}
                        {isMe && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF8400] text-white">나</span>
                        )}
                    </div>
                </div>

                {/* XP 정보 (우측 정렬) */}
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    <span className="text-[16px] font-bold text-[#FF8400]">
                        {item.weeklyXp.toLocaleString('ko-KR')} XP
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        누적 XP {formatXp(item.totalXp)}
                    </span>
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
        } catch (err: any) {
            // 페이지 새로고침/언마운트 시 Next.js가 fetch를 정상적으로 중단시키는 경우 → 조용히 무시
            if (err?.name === 'AbortError') return;
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

    const top3Items = displayItems.filter(item => item.rank <= 3);
    const otherItems = displayItems.filter(item => item.rank > 3);

    return (
        <MobileFrame>
            <Header />
            <main className="flex-1 overflow-y-auto flex flex-col animate-in fade-in duration-400 relative">
                <div className="sticky top-0 z-10 bg-background pb-3 shadow-sm shadow-background/50">
                    {/* 상단 컨트롤 */}
                    <div className="px-4 pt-4 flex justify-between items-center bg-background">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-gray-700 cursor-pointer"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => window.open('https://maperson.notion.site/32be387af28e80afa7e8c837829e3825?source=copy_link', '_blank')}
                                className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-gray-600 cursor-pointer"
                                aria-label="도움말"
                            >
                                <CircleHelp size={22} strokeWidth={2} />
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
                    </div>

                    {/* 헤더 타이틀 영역 */}
                    <div className="px-4 pt-2 pb-5 animate-in fade-in slide-in-from-bottom-4 duration-400 fill-mode-both bg-background">
                        <div className="flex items-end justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: '#2D2D2D' }}
                                >
                                    <Trophy className="w-7 h-7" style={{ color: '#FF8400' }} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-[19px] font-bold text-gray-900 leading-tight">주간 리그 랭킹</h1>
                                    <p className="text-[12px] text-gray-400 font-medium">Weekly Leaderboard</p>
                                </div>
                            </div>

                            {/* 리그 기간 표시 (캡슐 스타일) */}
                            <div
                                className="flex items-center justify-center px-4 py-1 rounded-full mb-2"
                                style={{ backgroundColor: '#2D2D2D' }}
                            >
                                <span className="text-[12px] font-regular leading-4" style={{ color: '#FF8400' }}>
                                    {weekLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 1, 2, 3위 랭킹 목록 */}
                    <div className="px-4 flex flex-col gap-2">
                        {isLoading ? (
                            <div className="flex flex-col gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={`top-${i}`}
                                        className="h-16 rounded-xl bg-gray-100 animate-pulse"
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    />
                                ))}
                            </div>
                        ) : displayItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Trophy className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                                <p className="text-[14px] text-gray-400 text-center">
                                    아직 이번 주 리그 참여자가 없습니다.<br />
                                    가장 먼저 퀴즈팩을 완료하고 1위에 등극하세요!
                                </p>
                            </div>
                        ) : (
                            top3Items.map((item, idx) => (
                                <RankItem
                                    key={item.userId}
                                    item={item}
                                    animationDelay={idx * 50}
                                />
                            ))
                        )}
                    </div>
                    {/* 하단 구분선 추가 */}
                    {!isLoading && displayItems.length > 0 && top3Items.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100" />
                    )}
                </div>

                {/* 4위 이하 랭킹 목록 */}
                <div className="px-4 pb-12 pt-2 flex flex-col gap-2 relative">
                    {isLoading ? (
                        <div className="flex flex-col gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={`other-${i}`}
                                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                                    style={{ animationDelay: `${(i + 3) * 60}ms` }}
                                />
                            ))}
                        </div>
                    ) : (
                        otherItems.map((item, idx) => (
                            <RankItem
                                key={item.userId}
                                item={item}
                                animationDelay={(top3Items.length + idx) * 50}
                            />
                        ))
                    )}
                </div>
            </main>
        </MobileFrame>
    );
}
