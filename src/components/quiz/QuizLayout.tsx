'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/common';
import { ExitConfirmDialog } from './ExitConfirmDialog';

interface QuizLayoutProps {
    children: ReactNode;
    navigation?: ReactNode; // 네비게이션을 헤더와 묶기 위해 prop으로 분리
    onExit?: () => void;
    isViewMode?: boolean;   // 결과 보기 모드 여부
    pendingXp?: number;     // 퀴즈 진행 중 누적되는 XP
    completedCount?: number; // 완료 횟수
    isXpDisabled?: boolean; // XP 비활성화 여부 (3회차 이후)
    isLastQuizCompleted?: boolean; // 마지막 퀴즈 정오답 확인 완료 여부
    onComplete?: () => Promise<void>; // 마지막 퀴즈 완료 시 호출될 콜백
}

// ... 중간 생략 (QuizPendingXpBadge 컴포넌트) ...
import { useCountUp } from '@/hooks/useCountUp';

/**
 * 퀴즈 진행 화면 XP 표시용 내부 컴포넌트
 */
function QuizPendingXpBadge({ xp, disabled = false }: { xp: number; disabled?: boolean }) {
    // 최초 마운트 시 초기 pendingXp 값을 기억합니다.
    const initialXpRef = useRef(xp);
    // xp가 처음 들어왔을 때 애니메이션을 방지하고 시작값을 설정합니다.
    const count = useCountUp({
        start: initialXpRef.current,
        end: xp,
        duration: 800,
        delay: 300,
    });

    // 0보다 크면 +, 0보다 작으면 - (toLocaleString 시 자동으로 -가 붙음), 0이면 0
    let countText = '0';
    if (count > 0) {
        countText = `+${count.toLocaleString('ko-KR')}`;
    } else if (count < 0) {
        countText = count.toLocaleString('ko-KR'); // -10 등 마이너스는 기본 포함됨
    }

    // 비활성화 시 회색으로 표시
    const xpColor = disabled ? '#9CA3AF' : '#FF8400';
    const labelColor = disabled ? '#9CA3AF' : '#2D2D2D';

    return (
        <div className="flex items-baseline gap-1">
            <span className="text-[20px] font-bold tracking-tight" style={{ color: xpColor }}>
                {countText}
            </span>
            <span className="text-[14px] font-bold" style={{ color: labelColor }}>
                XP
            </span>
        </div>
    );
}

/**
 * 퀴즈 화면 전체 레이아웃
 */
export function QuizLayout({ children, navigation, onExit, isViewMode, pendingXp, completedCount, isXpDisabled, isLastQuizCompleted, onComplete }: QuizLayoutProps) {
    const router = useRouter();
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    // 스크롤 이벤트 핸들러
    useEffect(() => {
        const handleScroll = () => {
            if (mainRef.current) {
                // 스크롤이 조금이라도 내려가면 그림자 표시
                setIsScrolled(mainRef.current.scrollTop > 5);
            }
        };

        const mainElement = mainRef.current;
        if (mainElement) {
            mainElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (mainElement) {
                mainElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const handleExitClick = async () => {
        if (isViewMode) {
            router.push('/');
        } else if (isLastQuizCompleted && onComplete) {
            // 마지막 퀴즈까지 풀었다면 중단 팝업 없이 완료 처리 후 이동
            await onComplete();
        } else {
            setShowExitDialog(true);
        }
    };

    const handleConfirmExit = async () => {
        if (onExit) {
            await onExit();
        }
        router.push('/');
    };

    return (
        <MobileFrame className="flex flex-col bg-white">
            {/* 상단 고정 영역 (헤더 + 네비게이션) */}
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50, // 다른 요소들 위로 올라오도록 z-index 증가
                    backgroundColor: '#ffffff',
                    // 스크롤 시 진한 그림자, 아닐 때는 아래쪽 연한 테두리만
                    boxShadow: isScrolled ? '0 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
                    borderBottom: isScrolled ? 'none' : '1px solid #ffffffff',
                    transition: 'box-shadow 0.2s ease-in-out, border-bottom 0.2s ease-in-out',
                }}
            >
                <header
                    style={{
                        padding: '16px 20px 10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* 좌측: 나가기 버튼 및 회차 표시 */}
                    <div className="flex items-center gap-2">
                        <button
                        onClick={handleExitClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6B7280',
                            fontSize: '20px',
                            transition: 'transform 0.2s ease', // 효과를 위한 transition 추가
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        aria-label="나가기"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>

                    {/* 우측: 진행 회차 표시 (나가기 버튼 옆) */}
                    {!isViewMode && completedCount !== undefined && (
                        <span className="text-[12px] font-bold text-[#FF8400] bg-[#FFF3E6] px-2 py-[2px] rounded-full border border-[#FFD6A5]">
                            {completedCount + 1}회차
                        </span>
                    )}
                    </div>

                    {/* 우측: XP 표시 */}
                    {!isViewMode && pendingXp !== undefined && (
                        <QuizPendingXpBadge xp={pendingXp} disabled={isXpDisabled} />
                    )}
                </header>

                {/* 네비게이션 영역 */}
                {navigation && (
                    <div style={{ backgroundColor: '#ffffff' }}>
                        {navigation}
                    </div>
                )}
            </div>

            {/* 메인 콘텐츠 */}
            <main
                ref={mainRef}
                style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
            >
                {children}
            </main>

            {/* 종료 확인 다이얼로그 */}
            <ExitConfirmDialog
                isOpen={showExitDialog}
                onClose={() => setShowExitDialog(false)}
                onConfirm={handleConfirmExit}
            />
        </MobileFrame>
    );
}
