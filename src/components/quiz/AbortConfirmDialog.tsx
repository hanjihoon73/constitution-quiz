'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';

interface AbortConfirmDialogProps {
    open: boolean;
    currentPackOrder: number;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * 진행 중인 퀴즈팩이 있을 때 다른 퀴즈팩을 시작하려는 경우 경고 다이얼로그
 */
export function AbortConfirmDialog({
    open,
    currentPackOrder,
    onConfirm,
    onCancel,
}: AbortConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl px-8 py-12 max-w-[340px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center gap-1 text-center">
                    <div className="flex justify-center mb-3">
                        <TriangleAlert className="w-[72px] h-[72px] text-[#111111] stroke-[2]" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-[#111111] mb-2">
                        진행 중인 퀴즈팩이 있어요.
                    </DialogTitle>
                    <p className="text-[#888888] text-[15px] font-medium leading-relaxed text-center">
                        새로운 퀴즈팩을 시작하면<br />
                        진행하던 {String(currentPackOrder).padStart(3, '0')}번 퀴즈팩의 기록과 XP는 초기화됩니다.
                    </p>
                </DialogHeader>

                {/* 버튼 영역 */}
                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        type="button"
                        className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={onConfirm}
                    >
                        새로운 퀴즈팩 시작
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-[52px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#888888] font-medium text-[16px] rounded-[14px] border border-[#E5E7EB] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={onCancel}
                    >
                        취소
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
