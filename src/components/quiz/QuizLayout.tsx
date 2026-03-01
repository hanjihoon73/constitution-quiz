'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/common';
import { ExitConfirmDialog } from './ExitConfirmDialog';

interface QuizLayoutProps {
    children: ReactNode;
    navigation?: ReactNode; // 네비게이션을 헤더와 묶기 위해 prop으로 분리
    onExit?: () => void;
}

/**
 * 퀴즈 화면 전체 레이아웃
 */
export function QuizLayout({ children, navigation, onExit }: QuizLayoutProps) {
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

    const handleExitClick = () => {
        setShowExitDialog(true);
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
                {/* 헤더 */}
                <header
                    style={{
                        padding: '16px 20px 10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
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
