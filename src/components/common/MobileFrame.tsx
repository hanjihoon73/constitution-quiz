'use client';

import { ReactNode } from 'react';

interface MobileFrameProps {
    children?: ReactNode;
    className?: string;
}

/**
 * 모바일 프레임 컨테이너
 * - 최대 480px 너비
 * - PC에서 중앙 정렬 + 그림자
 * - 모바일에서 전체 너비
 * - h-[100dvh] (고정 높이): flex-1 overflow-y-auto 자식이 올바르게 내부 스크롤되도록
 */
export function MobileFrame({ children, className = '' }: MobileFrameProps) {
    return (
        <div className="h-[100dvh] bg-muted/20 flex justify-center">
            <div
                className={`
                    mobile-frame
                    w-full
                    max-w-[480px] 
                    h-[100dvh]
                    bg-background 
                    text-foreground
                    relative
                    flex
                    flex-col
                    shadow-2xl
                    ${className}
                `}
            >
                {children}
            </div>
        </div>
    );
}

