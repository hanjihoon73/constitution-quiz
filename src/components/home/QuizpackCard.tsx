'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Play, Pause, CircleCheckBig, Star } from 'lucide-react';
import { QuizpackWithStatus } from '@/lib/api/quizpacks';

interface QuizpackCardProps {
    quizpack: QuizpackWithStatus;
    onCompletedClick?: (quizpackId: number) => void;
    onOpenedClick?: (quizpackId: number) => void;
    isCurrent?: boolean;
}

export function QuizpackCard({ quizpack, onCompletedClick, onOpenedClick, isCurrent }: QuizpackCardProps) {
    const router = useRouter();

    const handleClick = () => {
        switch (quizpack.status) {
            case 'closed':
                toast.info('순서대로 진행해 주세요.');
                break;
            case 'opened':
                if (onOpenedClick) {
                    onOpenedClick(quizpack.id);
                } else {
                    router.push(`/quiz/${quizpack.id}`);
                }
                break;
            case 'in_progress':
                router.push(`/quiz/${quizpack.id}?resume=true`);
                break;
            case 'completed':
                if (onCompletedClick) {
                    onCompletedClick(quizpack.id);
                } else {
                    router.push(`/quiz/${quizpack.id}`);
                }
                break;
        }
    };

    const progressPercent =
        quizpack.status === 'in_progress' && quizpack.solvedQuizCount && quizpack.totalQuizCount
            ? Math.round((quizpack.solvedQuizCount / quizpack.totalQuizCount) * 100)
            : 0;

    // 컨테이너 스타일 결정
    const getContainerClasses = () => {
        const base = "relative rounded-[16px] p-5 mb-3 transition-all duration-200 active:scale-[0.98]";
        switch (quizpack.status) {
            case 'closed':
                return `${base} bg-gray-100 border border-gray-300 cursor-default`;
            case 'opened':
                return `${base} bg-white border border-gray-300 cursor-pointer hover:shadow-lg hover:-translate-y-1`;
            case 'in_progress':
                return `${base} bg-white border border-[#FF8400] cursor-pointer hover:shadow-lg hover:-translate-y-1`;
            case 'completed':
                return `${base} bg-gray-100 border border-gray-300 cursor-pointer hover:shadow-lg hover:-translate-y-1`;
            default:
                return `${base} bg-white border border-gray-200`;
        }
    };

    // 아이콘 반환 함수
    const renderIcon = () => {
        switch (quizpack.status) {
            case 'closed':
                return <Lock className="w-12 h-12 text-gray-400 stroke-[1.5]" />;
            case 'opened':
                return <Play className="w-12 h-12 text-[#FF8400] stroke-[1.5]" />;
            case 'in_progress':
                return <Pause className="w-12 h-12 text-[#FF8400] stroke-[1.5]" />;
            case 'completed':
                return <CircleCheckBig className="w-12 h-12 text-[#2D2D2D] stroke-[1.5]" />;
            default:
                return null;
        }
    };

    return (
        <div onClick={handleClick} className={getContainerClasses()}>
            {/* 상단: 순서 번호 + 상태 아이콘 */}
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[30px] font-bold leading-none ${quizpack.status === 'closed' ? 'text-gray-400' :
                    quizpack.status === 'opened' || quizpack.status === 'in_progress' ? 'text-[#FF8400]' :
                        'text-[#2D2D2D]'
                    }`}>
                    {String(quizpack.order).padStart(3, '0')}
                </span>
                <div>
                    {renderIcon()}
                </div>
            </div>

            {/* 키워드 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {quizpack.keywords.split(',').map((k, i) => {
                    const isClosed = quizpack.status === 'closed';
                    const tagTheme = isClosed
                        ? 'bg-[#E5E7EB] text-[#9CA3AF]'
                        : quizpack.status === 'completed'
                            ? 'bg-[#2D2D2D] text-gray-300'
                            : 'bg-[#2D2D2D] text-[#FF8400]';

                    return (
                        <span key={i} className={`px-2 py-[2px] rounded-md text-[13px] font-medium ${tagTheme}`}>
                            #{k.trim()}
                        </span>
                    );
                })}
            </div>

            {/* 퀴즈 개수 및 별점 */}
            <div className={`flex items-center text-[13px] mb-3 ${quizpack.status === 'closed' ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>퀴즈 {quizpack.quizCount}개</span>
                {quizpack.status !== 'closed' && quizpack.status !== 'opened' && quizpack.averageRating !== null && Number(quizpack.averageRating) > 0 && (
                    <>
                        <span className="mx-2 text-gray-300">|</span>
                        <div className="flex items-center">
                            <Star className="w-[14px] h-[14px] mr-1 text-[#FF8400] fill-[#FF8400]" />
                            {Number(quizpack.averageRating).toFixed(1)}
                        </div>
                    </>
                )}
            </div>

            {/* 하단 영역 (상태에 따라 유동적) */}
            {quizpack.status === 'in_progress' ? (
                <div>
                    {/* 진행중 - 풀고 있는 중이에요 & 진행률 & XP */}
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[#FF8400] text-[13px] font-medium">풀고 있는 중이에요</span>
                            <span className="text-[13px] text-gray-500 font-medium">{progressPercent}%</span>
                        </div>
                        {quizpack.pendingXp !== null && quizpack.pendingXp !== undefined && (
                            <div className="absolute right-5 bottom-4 flex items-baseline gap-1">
                                <span className="text-[24px] text-[#FF8400] font-bold tracking-tight">
                                    {quizpack.pendingXp > 0 ? `+${quizpack.pendingXp.toLocaleString('ko-KR')}` : quizpack.pendingXp.toLocaleString('ko-KR')}
                                </span>
                                <span className="text-[16px] text-[#2D2D2D] font-bold">
                                    XP
                                </span>
                            </div>
                        )}
                    </div>
                    {/* 진행 상황 바 */}
                    <div className="flex items-center gap-3 pr-[90px]">
                        <div className="flex-1 h-[12px] bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#FF8400] transition-all duration-300 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-between items-center text-[13px] font-medium min-h-[20px]">
                    {/* 일반 상태 (닫힘/열림/완료) - 좌측 메시지 */}
                    <span className={`
                        ${quizpack.status === 'closed' ? 'text-gray-400' : ''}
                        ${quizpack.status === 'opened' ? 'text-[#FF8400]' : ''}
                        ${quizpack.status === 'completed' ? 'text-[#FF8400]' : ''}
                    `}>
                        {quizpack.status === 'closed' && '열리지 않았어요'}
                        {quizpack.status === 'opened' && '이제 풀 수 있어요'}
                        {quizpack.status === 'completed' && quizpack.lastCorrectRate !== null && (
                            <div className="flex items-center gap-2">
                                <span>정답률 {Math.round(quizpack.lastCorrectRate)}%</span>
                                {quizpack.completedCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[16px] h-[18px] px-2.5 rounded-full bg-[#FF8400] text-[#FFFFFF] text-[10px] font-bold">
                                        {quizpack.completedCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </span>

                    {/* 일반 상태 - 우측 XP (완료 상태에서만 노출됨) */}
                    {quizpack.status === 'completed' && quizpack.earnedXp !== null && quizpack.earnedXp > 0 && (
                        <div className="absolute right-5 bottom-4 flex items-baseline gap-1">
                            <span className="text-[24px] text-[#FF8400] font-bold tracking-tight">
                                +{quizpack.earnedXp.toLocaleString('ko-KR')}
                            </span>
                            <span className="text-[16px] text-[#2D2D2D] font-bold">
                                XP
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

