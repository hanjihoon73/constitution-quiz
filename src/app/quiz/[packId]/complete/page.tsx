'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileFrame } from '@/components/common';
import { useAuth } from '@/components/auth';
import { getUserQuizProgress, updateQuizpackStatistics, saveQuizpackRating, unlockNextQuizpack, resetUserQuizpack, getUserQuizpackId } from '@/lib/api/quiz';
import { Star, Clock, ArrowLeft, PartyPopper, SearchCheck } from 'lucide-react';

interface QuizResult {
    totalQuizCount: number;
    correctCount: number;
    incorrectCount: number;
    correctRate: number;
    totalTimeSeconds: number;
}

export default function QuizCompletePage() {
    const params = useParams();
    const router = useRouter();
    const packId = Number(params.packId);
    const { dbUser } = useAuth();

    const [result, setResult] = useState<QuizResult | null>(null);
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
                    // 다음 퀴즈팩이 있으면 이동
                    router.push(`/quiz/${nextPackId}`);
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

    // 다시풀기 핸들러
    const handleRestart = useCallback(async () => {
        if (!dbUser?.id) return;

        try {
            const userQuizpackId = await getUserQuizpackId(dbUser.id, packId);
            if (userQuizpackId) {
                await resetUserQuizpack(userQuizpackId);
            }
            router.push(`/quiz/${packId}?restart=true`);
        } catch (err) {
            console.error('퀴즈팩 초기화 실패:', err);
        }
    }, [dbUser?.id, packId, router]);

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
                    className="hover:-translate-y-1 transition-transform duration-200"
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
            <div style={{
                padding: '20px 20px 10px',
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
                <p style={{
                    fontSize: '15px',
                    color: '#6B7280',
                }}>
                    수고하셨습니다.
                </p>
            </div>

            {/* 정답률 원형 & 결과보기 버튼 */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '20px',
                marginBottom: '6px',
                position: 'relative'
            }}>
                <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: `conic-gradient(#FF8400 ${(result?.correctRate || 0) * 3.6}deg, #E5E7EB 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: '116px',
                        height: '116px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: '#FF8400',
                        }}>
                            {result?.correctRate?.toFixed(0) || 0}%
                        </span>
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
                        className="hover:-translate-y-1 transition-transform duration-200"
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
            <div style={{
                margin: '0 20px',
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '24px 0',
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
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>퀴즈</div>
                </div>
                {/* 정답 */}
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#38D2E3', marginBottom: '4px' }}>
                        {result?.correctCount || 0}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>정답</div>
                </div>
                {/* 오답 */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FB84C5', marginBottom: '4px' }}>
                        {result?.incorrectCount || 0}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>오답</div>
                </div>
            </div>

            {/* 선호도 입력 (별점) */}
            <div style={{
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
            <div style={{
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: 'auto',
            }}>
                <button
                    onClick={handleNextQuizpack}
                    disabled={isSaving}
                    className="hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                    style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: isSaving ? '#d1d5db' : '#FF8400',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isSaving ? '저장 중...' : '다음 퀴즈팩 시작'}
                </button>

                {/* 다시풀기 + 홈으로 가기 버튼 */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleRestart}
                        disabled={isSaving}
                        className="hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                        style={{
                            flex: 1,
                            padding: '16px',
                            backgroundColor: '#E5E7EB',
                            color: '#4B5563',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        다시 풀기
                    </button>
                    <button
                        onClick={handleGoHome}
                        disabled={isSaving}
                        className="hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                        style={{
                            flex: 1,
                            padding: '16px',
                            backgroundColor: '#2D2D2D',
                            color: '#FF8400',
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
