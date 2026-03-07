'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteUserAccount } from '@/lib/api/user';
import { useAuth } from '@/components/auth';
import { toast } from 'sonner';

interface WithdrawDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nickname: string;
    userId: number;
    authId: string;
}

export function WithdrawDialog({
    open,
    onOpenChange,
    nickname,
    userId,
    authId,
}: WithdrawDialogProps) {
    const router = useRouter();
    const { signOut } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleWithdraw = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteUserAccount(userId, authId);

            if (!result.success) {
                toast.error(result.error || '회원탈퇴 처리 중 오류가 발생했습니다.');
                setIsDeleting(false);
                return;
            }

            // 클라이언트 세션 정리
            await signOut();
            toast.success('회원탈퇴가 완료되었습니다.');
            router.push('/login');
        } catch (error) {
            console.error('회원탈퇴 에러:', error);
            toast.error('회원탈퇴 처리 중 오류가 발생했습니다.');
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl px-8 py-12 max-w-[340px]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                showCloseButton={true}
            >
                <DialogHeader className="flex flex-col items-center gap-1 text-center">
                    <div className="flex justify-center mb-3">
                        <Image src="/bi-constitution-quiz-symbol.svg" alt="symbol" width={72} height={72} className="w-[72px] h-[72px]" />
                    </div>
                    <DialogTitle className="text-[20px] font-bold text-[#111111] mb-2">
                        모두의 헌법을 정말 떠나시나요?
                    </DialogTitle>
                    <p className="text-[#888888] text-[15px] font-medium leading-relaxed text-center mt-2">
                        <span className="text-[#888888]">{nickname}님이 지금 탈퇴하시면</span>
                        <br />
                        대한민국의 헌법 수호력이 크게 약해집니다.
                        <br />
                        <br />
                        부디 우리 <span className="font-bold text-[#888888]">모두의 헌법을 지키기 위해</span>
                        <br />
                        계속 힘을 보태주세요!
                        <br />
                        <br />
                        <span className="text-[12px] text-[#888888] font-base mt-4 block">
                            ※ 회원 탈퇴 시 진행했던 모든 퀴즈팩과 퀴즈 기록, XP는 즉시 삭제됩니다.
                        </span>
                    </p>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-0">
                    <Button
                        type="button"
                        className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        힘을 보탤게요
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-[52px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#888888] font-medium text-[16px] rounded-[14px] border border-[#E5E7EB] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                        onClick={handleWithdraw}
                        disabled={isDeleting}
                    >
                        {isDeleting ? '처리 중...' : '그냥 탈퇴할래요'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
