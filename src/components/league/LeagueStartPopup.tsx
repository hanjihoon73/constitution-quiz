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

interface LeagueStartPopupProps {
    open: boolean;
    onClose: () => void;
    weekStartDate: string; // 'YYYY-MM-DD'
    weekEndDate: string;   // 'YYYY-MM-DD'
}

function formatLeagueDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${y.slice(2)}.${m}.${d} 월`;
}

/**
 * 주간 리그 시작 안내 팝업
 * - 이번 주 퀴즈팩 완료 후 홈 진입 시 표시
 * - 쿠키로 주 1회만 표시 제어
 */
export function LeagueStartPopup({ open, onClose, weekStartDate, weekEndDate }: LeagueStartPopupProps) {
    const router = useRouter();

    useEffect(() => {
        if (open) {
            const weekKey = weekStartDate.replace(/-/g, '');
            document.cookie = `league_start_seen_${weekKey}=1; max-age=${7 * 24 * 60 * 60}; path=/`;
        }
    }, [open, weekStartDate]);

    const handleRankingClick = () => {
        onClose();
        router.push('/league');
    };

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
                    <DialogTitle className="sr-only">새로운 주간 리그가 시작됐습니다!</DialogTitle>

                    {/* 트로피 아이콘 */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#2D2D2D' }}
                        >
                            <Trophy className="w-8 h-8" style={{ color: '#FF8400' }} strokeWidth={2} />
                        </div>
                    </div>

                    {/* 타이틀 */}
                    <p className="text-center text-[17px] font-bold text-gray-900 mb-2">
                        새로운 주간 리그가 시작됐습니다!
                    </p>

                    {/* 기간 */}
                    <p className="text-center text-xs text-gray-400 mb-5">
                        {formatLeagueDate(weekStartDate)} 0시 ~ {formatLeagueDate(weekEndDate)} 0시
                    </p>

                    {/* 안내 문구 */}
                    <p className="text-center text-[14px] text-gray-600 leading-relaxed mb-6">
                        퀴즈팩을 완료하고 XP를 획득해<br />상위 랭킹에 등극하세요.
                    </p>
                </DialogHeader>

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
