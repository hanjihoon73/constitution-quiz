'use client';

import { useRouter } from 'next/navigation';
import { Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LeagueEndPopupProps {
    open: boolean;
    onClose: () => void;
    rank: number;
    nickname: string;
    weekStartDate: string; // 'YYYY-MM-DD'
    weekEndDate: string;   // 'YYYY-MM-DD'
}

/** KST 기준 주 시작/종료 날짜를 'yy.mm.dd 월' 형식으로 포맷 */
function formatLeagueDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${y.slice(2)}.${m}.${d} 월`;
}

/** 순위별 안내 문구 반환 */
function getRankMessage(rank: number, nickname: string): string {
    switch (rank) {
        case 1: return `역사적인 순간! #${nickname}님. 주간 리그 랭킹 1위에 등극했습니다.`;
        case 2: return `가문의 영광! #${nickname}님. 주간 리그 랭킹 2위에 등극했습니다.`;
        case 3: return `대단합니다! #${nickname}님. 주간 리그 랭킹 3위에 등극했습니다.`;
        case 4: return `엄청나네요! #${nickname}님. 주간 리그 랭킹 4위를 달성했습니다.`;
        case 5: return `놀라워요! #${nickname}님. 주간 리그 랭킹 5위를 달성했습니다.`;
        default: return `수고하셨습니다! #${nickname}님. 주간 리그 랭킹 ${rank}위를 달성했습니다.`;
    }
}

/**
 * 주간 리그 종료 안내 팝업
 * - 월요일 0시 이후 로그인 or 홈 진입 시 지난주 결과 표시
 * - 쿠키로 주 1회만 표시 제어
 */
export function LeagueEndPopup({ open, onClose, rank, nickname, weekStartDate, weekEndDate }: LeagueEndPopupProps) {
    const router = useRouter();

    // 팝업이 열릴 때 쿠키에 '이번 주에 봤음' 기록
    useEffect(() => {
        if (open) {
            const weekKey = weekStartDate.replace(/-/g, '');
            document.cookie = `league_end_seen_${weekKey}=1; max-age=${7 * 24 * 60 * 60}; path=/`;
        }
    }, [open, weekStartDate]);

    const handleRankingClick = () => {
        onClose();
        router.push('/league');
    };

    const isTop3 = rank <= 3;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="max-w-[380px] sm:max-w-[380px] w-[calc(100%-40px)] px-6 py-8 rounded-2xl gap-0"
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95 cursor-pointer"
                    aria-label="닫기"
                >
                    <X size={20} />
                </button>

                <DialogHeader className="pt-2">
                    <DialogTitle className="sr-only">지난 주 리그가 종료됐습니다!</DialogTitle>

                    {/* 트로피 아이콘 */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#2D2D2D' }}
                        >
                            <Trophy className="w-8 h-8" style={{ color: isTop3 ? '#FF8400' : '#aaaaaa' }} strokeWidth={2} />
                        </div>
                    </div>

                    {/* 타이틀 */}
                    <p className="text-center text-[17px] font-bold text-gray-900 mb-2">
                        지난 주 리그가 종료됐습니다!
                    </p>

                    {/* 기간 */}
                    <p className="text-center text-xs text-gray-400 mb-5">
                        {formatLeagueDate(weekStartDate)} 0시 ~ {formatLeagueDate(weekEndDate)} 0시
                    </p>

                    {/* 순위 */}
                    <div
                        className="flex items-center justify-center rounded-xl py-3 mb-4"
                        style={{ backgroundColor: '#f9f9f9', border: '1px solid #ebebeb' }}
                    >
                        <span className="text-4xl font-black" style={{ color: isTop3 ? '#FF8400' : '#2D2D2D' }}>
                            {rank}위
                        </span>
                    </div>

                    {/* 안내 문구 */}
                    <p className="text-center text-[14px] text-gray-600 leading-relaxed mb-6">
                        {getRankMessage(rank, nickname)}
                    </p>
                </DialogHeader>

                {/* 버튼 */}
                <Button
                    onClick={handleRankingClick}
                    className="w-full h-12 rounded-xl font-semibold text-[#FF8400] bg-[#2D2D2D] hover:bg-[#3d3d3d] border-none shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                    주간 랭킹 확인
                </Button>
            </DialogContent>
        </Dialog>
    );
}
