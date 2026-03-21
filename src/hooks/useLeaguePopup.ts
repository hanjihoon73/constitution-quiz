'use client';

import { useState, useEffect } from 'react';
import { checkLeagueParticipation, getLastWeekRanking } from '@/lib/api/league';
import { useAuth } from '@/components/auth';

/** KST 기준 이번 주 월요일과 다음 주 월요일 날짜를 'YYYY-MM-DD' 형식으로 반환 */
function getWeekDates(): { weekStart: string; weekEnd: string; lastWeekStart: string } {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    const dayOfWeek = kstNow.getUTCDay(); // 0=일, 1=월 ... 6=토
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(kstNow);
    monday.setUTCDate(kstNow.getUTCDate() - daysSinceMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setUTCDate(monday.getUTCDate() + 7);

    const lastMonday = new Date(monday);
    lastMonday.setUTCDate(monday.getUTCDate() - 7);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    return {
        weekStart: fmt(monday),
        weekEnd: fmt(nextMonday),
        lastWeekStart: fmt(lastMonday),
    };
}

function getCookieValue(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export interface LeaguePopupState {
    showEndPopup: boolean;
    showStartPopup: boolean;
    endRank: number;
    weekStartDate: string;
    weekEndDate: string;
    lastWeekStartDate: string;
    closeEndPopup: () => void;
    closeStartPopup: () => void;
}

/**
 * 주간 리그 팝업 노출 조건을 관리하는 훅
 *
 * 우선순위:
 * 1. 리그 종료 팝업 (지난주 결과) 먼저 표시
 * 2. 종료 팝업 닫기 후 리그 시작 안내 팝업 표시 (참여한 경우에만)
 *
 * 쿠키로 주 1회 노출 제어
 */
export function useLeaguePopup(): LeaguePopupState {
    const { dbUser, isDbUserLoaded } = useAuth();

    const [showEndPopup, setShowEndPopup] = useState(false);
    const [showStartPopup, setShowStartPopup] = useState(false);
    const [endRank, setEndRank] = useState(0);
    const [pendingShowStart, setPendingShowStart] = useState(false);

    const { weekStart, weekEnd, lastWeekStart } = getWeekDates();

    useEffect(() => {
        if (!isDbUserLoaded || !dbUser?.id) return;

        const init = async () => {
            const endWeekKey = lastWeekStart.replace(/-/g, '');
            const startWeekKey = weekStart.replace(/-/g, '');

            const endSeen = getCookieValue(`league_end_seen_${endWeekKey}`);
            const startSeen = getCookieValue(`league_start_seen_${startWeekKey}`);

            // 1. 리그 종료 팝업 체크 (지난주 데이터가 있고, 아직 안 봤으면)
            if (!endSeen) {
                const lastRanking = await getLastWeekRanking(dbUser.id);
                if (lastRanking && lastRanking.weekStartDate === lastWeekStart) {
                    setEndRank(lastRanking.rank);
                    setShowEndPopup(true);

                    // 시작 팝업은 종료 팝업을 닫은 후에 보여줌 (pendingShowStart)
                    if (!startSeen) {
                        const participated = await checkLeagueParticipation(dbUser.id);
                        if (participated) {
                            setPendingShowStart(true);
                        }
                    }
                    return; // 종료 팝업이 있으면 시작 팝업은 나중에
                }
            }

            // 2. 리그 시작 안내 팝업 체크 (이번 주 참여했고, 아직 안 봤으면)
            if (!startSeen) {
                const participated = await checkLeagueParticipation(dbUser.id);
                if (participated) {
                    setShowStartPopup(true);
                }
            }
        };

        init();
    }, [isDbUserLoaded, dbUser?.id, weekStart, lastWeekStart]);

    const closeEndPopup = () => {
        setShowEndPopup(false);
        // 종료 팝업 닫힌 후, 대기 중인 시작 팝업이 있으면 표시
        if (pendingShowStart) {
            setTimeout(() => {
                setShowStartPopup(true);
                setPendingShowStart(false);
            }, 300);
        }
    };

    const closeStartPopup = () => {
        setShowStartPopup(false);
    };

    return {
        showEndPopup,
        showStartPopup,
        endRank,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        lastWeekStartDate: lastWeekStart,
        closeEndPopup,
        closeStartPopup,
    };
}
