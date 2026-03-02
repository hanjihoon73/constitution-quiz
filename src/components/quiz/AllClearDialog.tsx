'use client';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth';

interface AllClearDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AllClearDialog({ open, onOpenChange }: AllClearDialogProps) {
    const { dbUser } = useAuth();

    // 닉네임 기본값 처리
    const nickname = dbUser?.nickname || '사용자';

    const handleConfirm = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl px-8 py-12 max-w-[340px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                showCloseButton={true}
            >
                <DialogHeader className="flex flex-col items-center gap-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/bi-constitution-quiz-horizontal.svg" alt="모두의 헌법" className="w-[160px] h-auto" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-[#111111] mb-4">
                        진심으로 축하합니다!
                    </DialogTitle>
                    <div className="text-[#888888] text-[15px] font-medium leading-relaxed text-center space-y-5">
                        <p>
                            모두의 헌법을 완료하신 {nickname}님을<br />
                            <span className="font-bold text-[#888888]">대법관으로 임명합니다.</span>
                        </p>
                        <p>
                            앞으로도 우리나라의 헌법 수호를 위해<br />
                            최선을 다해주세요.
                        </p>
                    </div>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-8">
                    <p className="text-[#888888] text-[12px] text-center mb-1">
                        ※ 새로운 퀴즈팩이 업데이트 되면 공지사항으로 알려드립니다.
                    </p>
                    <Button
                        type="button"
                        className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={handleConfirm}
                    >
                        확인
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
