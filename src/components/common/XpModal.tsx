'use client';

import React, { useEffect, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface XpModalProps {
    totalXp: number;
    delay?: number;
    isReady?: boolean; // 상위 컴포넌트에서 데이터/UI 준비가 끝나면 true로 변경
}

/**
 * 홈/마이페이지 상단에 고정되는 XP 포인트 현황 모달 
 * "주황색(#ff8400) 배경, 두꺼운 검은색 테두리(#2d2d2d)의 캡슐 모양 모달"
 */
export function XpModal({ totalXp, delay = 0, isReady = true }: XpModalProps) {
    const [mounted, setMounted] = useState(false);
    const [startXP, setStartXP] = useState(totalXp);

    // 처음에 바로 보여주기 위해 클라이언트에서만 렌더링하도록 
    useEffect(() => {
        setMounted(true);

        try {
            const storedXp = sessionStorage.getItem('prevTotalXp');
            if (storedXp !== null) {
                const prev = parseInt(storedXp, 10);
                // 이전 기록된 값보다 현재 값이 크면 이전 값에서부터 카운트업 시작
                if (prev < totalXp) {
                    setStartXP(prev);
                } else if (prev > totalXp) {
                    // 서버 데이터(totalXp)가 더 낮아졌다면 (오류 또는 강제 조정 등) - 카운트다운
                    setStartXP(prev);
                } else {
                    setStartXP(totalXp);
                }
            } else {
                setStartXP(totalXp);
            }
            // 현재 값을 세션 스토리지에 저장하여 다음 마운트 시 비교 기준으로 사용
            sessionStorage.setItem('prevTotalXp', totalXp.toString());
        } catch (e) {
            console.error('sessionStorage 접근 에러:', e);
        }
    }, [totalXp]);

    const count = useCountUp({
        start: startXP,
        end: totalXp,
        duration: 1500, // 1.5초
        delay: delay,
    });

    if (!mounted) return null; // Hydration mismatch 방지

    // K, M, B 축약 포맷 (예: 1.5K, 3.6M)
    const formattedCount = Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(count);

    // 헤더 통합형 XP 뱃지 스타일 (애니메이션 제거)
    return (
        <div style={{
            display: 'flex',
            alignItems: 'baseline', // XP와 숫자의 텍스트 아래쪽 라인을 동일하게 맞춤
            justifyContent: 'center',
            backgroundColor: '#FF8400',
            borderRadius: '9999px',
            // 패딩: 상단 여백 설정(위로 밀어 아래로 내리기), 좌우 여백, 하단 여백 설정
            paddingTop: '4px',
            paddingBottom: '2px',
            paddingLeft: '12px',
            paddingRight: '12px',
            height: '32px', // 헤더 아이콘 크기들과 균형 맞춤
            minWidth: '80px',
        }}>
            <span style={{
                color: '#2D2D2D',
                fontWeight: '600',
                fontSize: '12px',
                marginRight: '6px',
            }}>
                XP
            </span>
            <span className="text-[16px] text-white font-[600] tracking-tight">
                {formattedCount}
            </span>
        </div>
    );
}
