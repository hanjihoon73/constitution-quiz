'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleUser, Share } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderProps {
    showProfile?: boolean;
}

/**
 * 공통 헤더 컴포넌트
 * - BI 로고 (클릭 시 홈으로 이동)
 * - 프로필 아이콘 (클릭 시 마이페이지로 이동)
 */
export function Header({ showProfile = true }: HeaderProps) {
    const handleShare = async () => {
        const shareData = {
            title: '모두의 헌법',
            text: '하루 5분, 대한민국 헌법 마스터하기',
            url: 'https://constitution-quiz-0-5.vercel.app/',
        };

        try {
            if (navigator.share) {
                // 모바일 환경 등 Web Share API 지원 브라우저
                await navigator.share(shareData);
            } else {
                // PC 등 미지원 환경: 클립보드 복사
                await navigator.clipboard.writeText(shareData.url);
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900">URL이 복사되었습니다.</span>
                        <span className="text-gray-600">친구들에게 모두의 헌법을 소개해 주세요.</span>
                    </div>
                );
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full safe-area-top bg-[#2d2d2d] border-b border-black/5 shadow-sm">
            <div className="flex h-18 items-center justify-between px-6">
                {/* BI 로고 */}
                <Link href="/" className="flex items-center">
                    <Image
                        src="/bi-constitution-quiz-horizontal-white.svg"
                        alt="모두의 헌법"
                        width={100}
                        height={28}
                        priority
                    />
                </Link>

                {/* 우측 영역 */}
                <div className="flex items-center gap-1">
                    {/* 공유 아이콘 */}
                    <button
                        onClick={handleShare}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                        aria-label="공유하기"
                    >
                        <Share className="h-6 w-6 text-white" strokeWidth={2} />
                    </button>

                    {/* 프로필 아이콘 */}
                    {showProfile && (
                        <Link
                            href="/profile"
                            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                        >
                            <CircleUser className="h-7 w-7 text-white" strokeWidth={2} />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
