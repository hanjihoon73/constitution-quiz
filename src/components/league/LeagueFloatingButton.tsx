'use client';

import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';

/**
 * 리그 플로팅 버튼
 * - MobileFrame(relative 컨테이너) 내부 우하단에 고정
 * - fixed 대신 absolute 사용 → PC에서도 콘텐츠 영역 안에 위치
 */
export function LeagueFloatingButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push('/league')}
            className="absolute bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95 cursor-pointer"
            style={{
                backgroundColor: '#2D2D2D',
                border: '2.5px solid #FF8400',
            }}
            aria-label="주간 리그 랭킹 보기"
        >
            <Trophy className="w-6 h-6" style={{ color: '#FF8400' }} strokeWidth={2} />
        </button>
    );
}

