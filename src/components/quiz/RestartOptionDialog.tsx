'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CircleCheckBig } from 'lucide-react';

interface RestartOptionDialogProps {
    open: boolean;
    onClose: () => void;
    onViewResults: () => void;
    onRestart: () => void;
}

export function RestartOptionDialog({ open, onClose, onViewResults, onRestart }: RestartOptionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl px-8 py-12 max-w-[340px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex flex-col items-center gap-1 text-center">
                    <div className="flex justify-center mb-3">
                        <CircleCheckBig className="w-[72px] h-[72px] text-[#111111] stroke-[2]" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-[#111111] mb-2">
                        이미 완료한 퀴즈팩이에요.
                    </DialogTitle>
                    <p className="text-[#888888] text-[15px] font-medium leading-relaxed">
                        퀴즈를 푼 결과를 확인하거나<br />
                        처음부터 다시 풀 수 있어요.
                    </p>
                </DialogHeader>

                {/* 버튼 영역 */}
                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        type="button"
                        className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={onViewResults}
                    >
                        결과 보기
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-[52px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#888888] font-medium text-[16px] rounded-[14px] border border-[#E5E7EB] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={onRestart}
                    >
                        다시 풀기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
