'use client';

import { LogOutIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExitConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoggingOut?: boolean;
}

export function ExitConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoggingOut = false,
}: ExitConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[340px] sm:max-w-[340px] w-[calc(100%-40px)] p-6 rounded-2xl gap-6">
                <DialogHeader className="flex flex-col items-center gap-4 pt-4">
                    {/* 아이콘 영역 (배경 원 제거, 색상 변경) */}
                    <div className="mb-[24px]">
                        <LogOutIcon className="w-10 h-10 text-[#2D2D2D]" strokeWidth={1.5} />
                    </div>
                    <DialogTitle className="text-center text-lg font-semibold text-foreground">
                        모두의 헌법을 종료할까요?
                    </DialogTitle>
                </DialogHeader>

                <DialogFooter className="sm:justify-center pt-2">
                    <Button
                        type="button"
                        disabled={isLoggingOut}
                        className="w-full h-12 rounded-xl font-semibold bg-[#2D2D2D] text-[#FF8400] border-none shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-95"
                        onClick={onConfirm}
                    >
                        {isLoggingOut ? '종료 중...' : '네'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
