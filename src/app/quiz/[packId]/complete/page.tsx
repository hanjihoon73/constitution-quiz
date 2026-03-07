'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/common';
import { useAuth } from '@/components/auth';
import { getUserQuizProgress, updateQuizpackStatistics, saveQuizpackRating, unlockNextQuizpack, getUserQuizpackId, resetUserQuizpack } from '@/lib/api/quiz';
import { Star, Clock, ArrowLeft, PartyPopper, SearchCheck } from 'lucide-react';
import { useConfetti } from '@/hooks/useConfetti';

interface QuizResult {
    totalQuizCount: number;
    correctCount: number;
    incorrectCount: number;
    correctRate: number;
    totalTimeSeconds: number;
    earnedXp: number;
}

export default function QuizCompletePage() {
    const params = useParams();
    const router = useRouter();
    const packId = Number(params.packId);
    const { dbUser } = useAuth();

    const [result, setResult] = useState<QuizResult | null>(null);
    const [circleRate, setCircleRate] = useState<number>(0);
    const [textRate, setTextRate] = useState<number>(0);
    const [xpRate, setXpRate] = useState<number>(0);
    const [rating, setRating] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 퀴즈 결과 로드
    useEffect(() => {
        async function loadResult() {
            if (!dbUser?.id) return;

            try {
                const progress = await getUserQuizProgress(dbUser.id, packId);
                if (progress) {
                    setResult({
                        totalQuizCount: progress.total_quiz_count || 0,
                        correctCount: progress.correct_count || 0,
                        incorrectCount: progress.incorrect_count || 0,
                        correctRate: progress.correct_rate || 0,
                        totalTimeSeconds: progress.total_time_seconds || 0,
                        earnedXp: progress.earned_xp || 0,
                    });
                }
            } catch (error) {
                console.error('결과 로드 에러:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadResult();
    }, [dbUser?.id, packId]);

    const { fireConfetti } = useConfetti();

    // 완료 화면 로드 시 콘페티 터뜨림
    useEffect(() => {
        if (!isLoading && result) {
            setTimeout(() => {
                fireConfetti();
            }, 100);
        }
    }, [isLoading, result, fireConfetti]);

    // 정답률 카운트업 및 원형 차트 애니메이션 분리 (순차 실행)
    useEffect(() => {
        if (!result || result.correctRate === undefined) return;

        let circleFrameId: number;
        let textFrameId: number;
        let xpFrameId: number;
        let circleStart: number | null = null;
        let textStart: number | null = null;
        let xpStart: number | null = null;

        const targetRate = result.correctRate;
        const targetXp = result.earnedXp;
        const circleDuration = 1000;
        const textDuration = 1000;

        // 써클 드로잉 애니메이션
        const animateCircle = (timestamp: number) => {
            if (!circleStart) circleStart = timestamp;
            const progress = Math.min((timestamp - circleStart) / circleDuration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 4);
            setCircleRate(targetRate * easeOutProgress);

            if (progress < 1) {
                circleFrameId = requestAnimationFrame(animateCircle);
            }
        };

        // 텍스트 카운트업 애니메이션
        const animateText = (timestamp: number) => {
            if (!textStart) textStart = timestamp;
            const progress = Math.min((timestamp - textStart) / textDuration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 4);
            setTextRate(targetRate * easeOutProgress);

            if (progress < 1) {
                textFrameId = requestAnimationFrame(animateText);
            } else {
                setTextRate(targetRate);
            }
        };

        // XP 카운트업 애니메이션
        const animateXp = (timestamp: number) => {
            if (!xpStart) xpStart = timestamp;
            const progress = Math.min((timestamp - xpStart) / textDuration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 4);
            setXpRate(targetXp * easeOutProgress);

            if (progress < 1) {
                xpFrameId = requestAnimationFrame(animateXp);
            } else {
                setXpRate(targetXp);
            }
        };

        // 1. 콘페티 폭죽은 위쪽 useEffect에서 100ms 뒤에 터집니다.
        // 2. 폭죽이 터진 후 200ms(전체 기준 300ms) 뒤에 써클 애니메이션 시작
        const circleTimeout = setTimeout(() => {
            circleFrameId = requestAnimationFrame(animateCircle);
        }, 300);

        // 3. 써클이 어느 정도 그려진 후 (전체 기준 600ms) 텍스트 카운트업 시작
        const textTimeout = setTimeout(() => {
            textFrameId = requestAnimationFrame(animateText);
            xpFrameId = requestAnimationFrame(animateXp);
        }, 600);

        return () => {
            clearTimeout(circleTimeout);
            clearTimeout(textTimeout);
            if (circleFrameId) cancelAnimationFrame(circleFrameId);
            if (textFrameId) cancelAnimationFrame(textFrameId);
            if (xpFrameId) cancelAnimationFrame(xpFrameId);
        };
    }, [result]);

    // 통계/평점 저장 후 이동
    const handleSaveAndNavigate = useCallback(async (destination: 'next' | 'home') => {
        if (!dbUser?.id || !result) return;

        setIsSaving(true);
        try {
            // 1. 퀴즈팩 통계 업데이트
            await updateQuizpackStatistics(
                packId,
                result.correctCount,
                result.totalQuizCount
            );

            // 2. 평점 저장 (선택한 경우에만)
            if (rating > 0) {
                await saveQuizpackRating(dbUser.id, packId, rating);
            }

            // 3. 다음 퀴즈팩 해금 및 이동 처리
            if (destination === 'next') {
                // 다음 퀴즈팩 해금 시도
                const nextPackId = await unlockNextQuizpack(dbUser.id, packId);

                if (nextPackId) {
                    // 이미 완료나 진행 중인 상태가 있을 수 있으므로 DB 기록도 완전히 초기화
                    const nextUserPackId = await getUserQuizpackId(dbUser.id, nextPackId);
                    if (nextUserPackId) {
                        await resetUserQuizpack(nextUserPackId);
                    }
                    // 다음 퀴즈팩이 있으면 이동 (기존 완료 여부 상관없이 퀴즈 다시 풀기로 강제)
                    router.push(`/quiz/${nextPackId}?restart=true`);
                } else {
                    // 다음 퀴즈팩이 없으면 (마지막 퀴즈팩 완료)
                    // 전면 광고나 축하 파티클 등을 보여줄 수도 있겠지만, 여기서는 홈으로 이동하며 파라미터 전달
                    router.push('/?allClear=true');
                }
            } else {
                // 홈으로 이동 시에도 마지막 퀴즈팩 여부 확인
                const nextPackId = await unlockNextQuizpack(dbUser.id, packId);
                if (!nextPackId) {
                    // 마지막 퀴즈팩이었으면 allClear 팝업 표시
                    router.push('/?allClear=true');
                } else {
                    router.push('/');
                }
            }
        } catch (error) {
            console.error('저장 에러:', error);
            // 에러가 있어도 일단 홈으로 이동 (데이터 불일치 방지 위해 안전한 선택)
            router.push('/');
        }
    }, [dbUser?.id, packId, result, rating, router]);

    // 다음 퀴즈팩으로 이동
    const handleNextQuizpack = () => {
        handleSaveAndNavigate('next');
    };

    // 홈으로 이동
    const handleGoHome = () => {
        handleSaveAndNavigate('home');
    };

    // 결과보기 핸들러
    const handleViewResults = useCallback(() => {
        router.push(`/quiz/${packId}?mode=view`);
    }, [packId, router]);

    // 시간 포맷팅 (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const width = secs < 10 ? '0' : '';
        return `${mins}분 ${width}${secs}초`;
    };

    if (isLoading) {
        return (
            <MobileFrame className="flex flex-col items-center justify-center">
                <div style={{ fontSize: '16px', color: '#6b7280' }}>결과 불러오는 중...</div>
            </MobileFrame>
        );
    }

    return (
        <MobileFrame className="flex flex-col h-full bg-white relative pb-8 overflow-y-auto">
            {/* 상단 헤더 (뒤로가기) */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: 'white',
            }}>
                <button
                    onClick={handleGoHome}
                    className="hover:-translate-y-1 active:scale-95 transition-transform duration-200"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#6B7280'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 상단 축하 메시지 */}
            <div className="animate-fade-in-up delay-100" style={{
                padding: '10px 20px 10px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ marginBottom: '16px', color: '#FF8400' }}>
                    <PartyPopper size={90} strokeWidth={1.5} />
                </div>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#2D2D2D',
                    marginBottom: '8px',
                }}>
                    퀴즈팩 {String(packId).padStart(3, '0')} 완료!
                </h1>
            </div>

            {/* 정답률 원형 & 결과보기 버튼 */}
            <div className="animate-fade-in-up delay-200" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '10px',
                marginBottom: '6px',
                position: 'relative'
            }}>
                <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    // 1. 바탕색을 #2D2D2D로 변경
                    // 2. 바 끝부분(캡)을 둥글게 하기 위해 시작 부분과 끝 부분에 둥근 조각(radial-gradient)을 추가합니다.
                    //    바 두께는 15px (140 - 110 = 30 / 2 = 15)이므로 조각의 반지름은 7.5px입니다.
                    //    중심 반경은 62.5px(70 - 7.5)입니다.
                    background: `
                        radial-gradient(circle at 50% 7.5px, #FF8400 7px, transparent 7.5px),
                        radial-gradient(circle at calc(50% + ${62.5 * Math.sin((circleRate * 3.6 * Math.PI) / 180)}px) calc(50% - ${62.5 * Math.cos((circleRate * 3.6 * Math.PI) / 180)}px), #FF8400 7px, transparent 7.5px),
                        conic-gradient(#FF8400 ${circleRate * 3.6}deg, #2D2D2D 0deg)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            fontWeight: 'bold',
                            color: '#FF8400',
                            display: 'flex',
                            alignItems: 'baseline'
                        }}>
                            <span style={{ fontSize: '48px' }}>{Math.round(textRate)}</span>
                            <span style={{ fontSize: '30px', marginLeft: '1px' }}>%</span>
                        </div>
                    </div>
                </div>

                {/* 좌측 하단 걸린 시간 & 우측 하단 결과보기 */}
                <div style={{ width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                    {/* 걸린 시간 */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        color: '#9CA3AF',
                        padding: '4px 8px'
                    }}>
                        {result && result.totalTimeSeconds > 0 ? (
                            <>
                                <Clock size={18} />
                                걸린 시간: {formatTime(result.totalTimeSeconds)}
                            </>
                        ) : null}
                    </div>

                    <button
                        onClick={handleViewResults}
                        className="hover:-translate-y-1 active:scale-95 transition-all duration-200"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '14px',
                            color: '#9CA3AF',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px'
                        }}
                    >
                        <SearchCheck size={18} />
                        결과 보기
                    </button>
                </div>
            </div>

            {/* 결과 요약 카드 */}
            <div className="animate-fade-in-up delay-300" style={{
                margin: '0 20px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '18px 0',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center'
            }}>
                {/* 총 문제 */}
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2D2D2D', marginBottom: '4px' }}>
                        {result?.totalQuizCount || 0}
                    </div>
                    <div style={{ fontSize: '16px', color: '#9CA3AF' }}>퀴즈</div>
                </div>
                {/* 정답 */}
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#38D2E3', marginBottom: '4px' }}>
                        {result?.correctCount || 0}
                    </div>
                    <div style={{ fontSize: '16px', color: '#9CA3AF' }}>정답</div>
                </div>
                {/* 획득 XP */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF8400', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '36px', marginRight: '2px' }}>
                            {Math.round(xpRate) > 0 ? '+' : Math.round(xpRate) < 0 ? '-' : ''}
                        </span>
                        <span>{Math.abs(Math.round(xpRate))}</span>
                    </div>
                    <div style={{ fontSize: '16px', color: '#9CA3AF' }}>XP</div>
                </div>
            </div>

            {/* 선호도 입력 (별점) */}
            <div className="animate-fade-in-up delay-500" style={{
                margin: '16px 20px 24px',
                padding: '24px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                textAlign: 'center',
            }}>
                <h3 style={{
                    fontSize: '15px',
                    color: '#6B7280',
                    marginBottom: '16px',
                }}>
                    이번 퀴즈팩은 어땠나요?
                </h3>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                            }}
                        >
                            <Star
                                size={32}
                                fill={star <= rating ? '#FF8400' : 'none'}
                                color={star <= rating ? '#FF8400' : '#D2D2D2'}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* 버튼 영역 */}
            <div className="animate-fade-in-up" style={{
                animationDelay: '600ms',
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: 'auto',
            }}>
                <button
                    onClick={handleNextQuizpack}
                    disabled={isSaving}
                    className="hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: isSaving ? '#d1d5db' : '#2D2D2D',
                        color: isSaving ? '#9CA3AF' : '#FF8400',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isSaving ? '저장 중...' : '다음 퀴즈팩 시작'}
                </button>

                {/* 홈으로 가기 버튼 */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleGoHome}
                        disabled={isSaving}
                        className="hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] transition-all duration-200"
                        style={{
                            flex: 1,
                            padding: '16px',
                            backgroundColor: '#E5E7EB',
                            color: '#a5abb2ff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isSaving ? '저장 중...' : '홈으로 가기'}
                    </button>
                </div>
            </div>
        </MobileFrame>
    );
}
