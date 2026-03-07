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
    const [showAnimation, setShowAnimation] = useState(false);

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

    // isReady가 true가 되면 약간의 지연 후 슬라이드인 하도록 처리
    useEffect(() => {
        if (isReady && mounted) {
            const timer = setTimeout(() => {
                setShowAnimation(true);
            }, 100); // 렌더링 직후 애니메이션이 발동되도록 짧은 지연
            return () => clearTimeout(timer);
        } else {
            setShowAnimation(false);
        }
    }, [isReady, mounted]);

    const count = useCountUp({
        start: startXP,
        end: totalXp,
        duration: 1500, // 1.5초
        delay: delay,
    });

    if (!mounted) return null; // Hydration mismatch 방지

    // 천단위 콤마 포맷
    const formattedCount = count.toLocaleString('ko-KR');

    return (
        <div style={{
            position: 'fixed', // 스크롤 시에도 헤더 아래에 고정되도록 수정
            top: '86px', // 헤더(72px) 아래로 약 10pt(약 14px) 간격 띄움
            left: '50%',
            transform: `translateX(-50%) translateY(${showAnimation ? '0' : '-150%'})`,
            opacity: showAnimation ? 1 : 0,
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out',
            zIndex: 40,
            display: 'flex',
            alignItems: 'baseline', // 숫자와 기본선 정렬
            justifyContent: 'center',
            backgroundColor: '#FF8400',
            border: '6px solid #2D2D2D',
            borderRadius: '9999px',
            padding: '0px 16px 0px 20px',
            width: 'max-content',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)', // 좀 더 진하고 또렷한 드롭 섀도우
        }}>
            <span style={{
                color: '#FFFFFF',
                fontWeight: '900',
                fontSize: '20px', // 숫자는 18px (기존 16px에서 조금 더 크게)
                fontFamily: 'monospace, sans-serif',
                letterSpacing: '1px', // 숫자 사이의 간격(자간) 조절
                WebkitTextStroke: '0.1px #FFFFFF', // 1px 두께의 하얀색 테두리 추가
            }}>
                {formattedCount}
            </span>
            <span style={{
                color: '#FFFFFF',
                fontWeight: '900',
                fontSize: '13px', // XP 글자는 더 작게 (13px)
                fontFamily: 'sans-serif',
                marginLeft: '3px', // 숫자와의 간격
            }}>
                XP
            </span>
        </div>
    );
}
