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
 */
export function MobileFrame({ children, className = '' }: MobileFrameProps) {
    return (
        <div className="min-h-[100dvh] bg-muted/20 flex justify-center">
            <div
                className={`
                    mobile-frame
                    w-full
                    max-w-[480px] 
                    min-h-[100dvh] 
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
