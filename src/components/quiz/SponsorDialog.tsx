'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SponsorDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SponsorDialog({ isOpen, onClose }: SponsorDialogProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText('우리은행 1002-856-209329 한지훈');
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            alert('클립보드 복사에 실패했습니다.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                className="sm:max-w-md bg-white rounded-3xl border-none shadow-xl p-0 max-w-[340px] overflow-hidden [&>button]:hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="relative p-6 pt-10">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-1 rounded-full text-[#888888] hover:bg-gray-100 hover:text-[#111111] transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <DialogHeader className="flex flex-col items-center text-center px-2">
                        <div className="flex justify-center mt-4 mb-4">
                            <Image
                                src="/bi-constitution-quiz-symbol.svg"
                                alt="모두의 헌법 퀴즈 기호"
                                width={72}
                                height={72}
                                className="object-contain"
                            />
                        </div>
                        <DialogTitle className="text-[20px] font-bold text-[#111111] mb-4">
                            모두의 헌법을 후원해 주세요!
                        </DialogTitle>

                        <div className="text-[#888888] text-[14px] font-medium leading-relaxed text-center break-keep space-y-4">
                            <p>
                                모두의 헌법은<br />
                                대한민국 헌법 수호와 대중화를 위해<br />
                                <span className="font-bold text-[#888888]">무료로 운영</span>돼요.
                            </p>
                            <p>
                                서비스의 지속적인 운영과 개선이 가능하도록<br />
                                <span className="font-bold text-[#888888]">작은 관심과 후원</span>을 부탁드려요.
                            </p>
                        </div>

                        <div className="w-full mt-6 bg-[#F3F4F6] rounded-2xl p-4 text-center">
                            <p className="text-[#888888] text-[13px] font-semibold mb-1">
                                후원계좌
                            </p>
                            <p className="text-[#111111] text-[16px] font-bold tracking-tight">
                                우리은행 1002-856-209329 한지훈
                            </p>
                            <p className="text-[#888888] text-[10px] font-normal mt-2">
                                ※ 1회 최대 3만 원 이하의 소액 후원을 권장합니다.
                            </p>
                        </div>
                    </DialogHeader>

                    {/* 버튼 영역 */}
                    <div className="flex flex-col gap-3 mt-6">
                        <Button
                            type="button"
                            className="w-full h-[52px] bg-[#2D2D2D] hover:bg-[#1a1a1a] text-[#FF8400] font-medium text-[16px] rounded-[14px] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                            onClick={handleCopy}
                        >
                            {isCopied ? '복사 완료!' : '후원계좌 복사하기'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full h-[52px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#888888] font-medium text-[16px] rounded-[14px] border border-[#E5E7EB] transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-95"
                            onClick={onClose}
                        >
                            다음에 하기
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
