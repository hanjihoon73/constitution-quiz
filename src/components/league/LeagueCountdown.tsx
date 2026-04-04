'use client';

import { useState, useEffect } from 'react';

/** KST 기준 다음주 월요일 00:00:00 (리그 종료 시점) 을 UTC ms로 반환 */
function getNextMondayKST(): number {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);

    const day = kstNow.getUTCDay(); // 0=일, 1=월 ... 6=토
    const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

    const nextMonday = new Date(kstNow);
    nextMonday.setUTCDate(kstNow.getUTCDate() + daysUntilNextMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);

    // UTC ms로 변환 (KST 오프셋 다시 빼기)
    return nextMonday.getTime() - kstOffset;
}

/** 남은 시간(ms)을 규칙에 따라 문자열로 변환 */
function formatRemaining(ms: number): string {
    if (ms <= 0) return '리그 집계 중';

    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalHours > 24) {
        // rT > 24h: n일 n시간
        const hours = totalHours % 24;
        return `${totalDays}일 ${hours}시간`;
    } else if (totalMinutes > 60) {
        // 24h >= rT > 1h: n시간 n분
        const minutes = totalMinutes % 60;
        return `${totalHours}시간 ${minutes}분`;
    } else {
        // rT <= 1h: n분 n초
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}분 ${String(seconds).padStart(2, '0')}초`;
    }
}

/**
 * 리그 종료까지 남은 시간을 실시간으로 표시하는 카운트다운 컴포넌트
 * - 텍스트 길이에 맞게 배경 너비가 자동으로 조절됩니다.
 */
export function LeagueCountdown() {
    const [remaining, setRemaining] = useState<string>('');

    useEffect(() => {
        const tick = () => {
            const target = getNextMondayKST();
            const diff = target - Date.now();
            setRemaining(formatRemaining(diff));
        };

        tick();
        const id = setInterval(tick, 1000);

        return () => clearInterval(id);
    }, []);

    if (!remaining) return null;

    return (
        <div
            className="flex items-center justify-center px-4 py-1 rounded-full mb-2 transition-all duration-300"
            style={{ backgroundColor: '#e9e9e9ff' }}
        >
            <span className="text-[12px] font-medium leading-4 whitespace-nowrap" style={{ color: '#2D2D2D' }}>
                {remaining}
            </span>
        </div>
    );
}
