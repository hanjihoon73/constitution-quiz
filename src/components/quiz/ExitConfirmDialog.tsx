'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';

interface ExitConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * 퀴즈 중단 확인 다이얼로그
 */
export function ExitConfirmDialog({ isOpen, onClose, onConfirm }: ExitConfirmDialogProps) {
    const handleConfirm = () => {
        console.log('[ExitConfirmDialog] 나가기 버튼 클릭됨');
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl px-8 py-12 max-w-[340px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center gap-1 text-center">
                    <div className="flex justify-center mb-3">
                        <TriangleAlert className="w-[72px] h-[72px] text-[#111111] stroke-[2]" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-[#111111] mb-2">
                        퀴즈팩을 중단할까요?
                    </DialogTitle>
                    <p className="text-[#888888] text-[15px] font-medium leading-relaxed text-center">
                        지금까지 풀었던 퀴즈는 저장됩니다.<br />
                        나중에 이어서 풀 수 있어요.
                    </p>
                </DialogHeader>

                {/* 버튼 영역 */}
                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        type="button"
                        className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={handleConfirm}
                    >
                        나가기
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-[52px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#888888] font-medium text-[16px] rounded-[14px] border border-[#E5E7EB] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={onClose}
                    >
                        계속 풀기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
