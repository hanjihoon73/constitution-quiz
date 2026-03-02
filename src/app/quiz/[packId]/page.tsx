'use client';

import { useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuiz } from '@/hooks/useQuiz';
import {
    QuizLayout,
    QuizNavigation,
    QuizContent,
    QuizActions,
} from '@/components/quiz';
import { Loading } from '@/components/common';

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const packId = Number(params.packId);
    const isRestart = searchParams.get('restart') === 'true';
    const isViewMode = searchParams.get('mode') === 'view';

    const {
        packData,
        currentQuiz,
        progress,
        answers,
        isChecked,
        showHint,
        showExplanation,
        isLoading,
        error,
        isFirstQuiz,
        isLastQuiz,
        selectChoice,
        setBlankAnswer,
        checkAnswer,
        goToNext,
        goToPrev,
        goToQuiz,
        toggleHint,
        saveProgress,
        completeQuizPack,
    } = useQuiz(packId, { isRestart });

    // 정답 확인 핸들러
    const handleCheckAnswer = useCallback(() => {
        const isCorrect = checkAnswer();

        // 정오답 사운드 재생
        const audio = new Audio(isCorrect ? '/sounds/correct.wav' : '/sounds/wrong.wav');
        audio.play().catch(() => { }); // 재생 실패 시 무시
    }, [checkAnswer]);

    // 퀴즈 완료 핸들러
    const handleComplete = useCallback(async () => {
        console.log('[handleComplete] 퀴즈 완료 버튼 클릭됨');
        try {
            await completeQuizPack();
            console.log('[handleComplete] completeQuizPack 성공');
            router.push(`/quiz/${packId}/complete`);
        } catch (err) {
            console.error('[handleComplete] 에러:', err);
        }
    }, [completeQuizPack, packId, router]);

    // 나가기 핸들러 (진행 상태 저장)
    const handleExit = useCallback(async () => {
        await saveProgress();
    }, [saveProgress]);

    // 결과 보기 모드: 데이터 저장 없이 홈으로 이동
    const handleGoHome = useCallback(() => {
        router.push('/');
    }, [router]);

    // 로딩 중
    if (isLoading) {
        return (
            <QuizLayout>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Loading />
                </div>
            </QuizLayout>
        );
    }

    // 에러
    if (error || !packData || !currentQuiz) {
        return (
            <QuizLayout>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    <p style={{ color: '#ef4444', marginBottom: '16px' }}>
                        퀴즈를 불러오는데 실패했습니다.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="transition-transform active:scale-95"
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </QuizLayout>
        );
    }

    // 현재 퀴즈의 사용자 답안
    const currentAnswer = answers.get(currentQuiz.id);
    const selectedIds = currentAnswer?.selectedChoiceIds || [];
    const blankAnswers = currentAnswer?.blankAnswers || new Map();

    // 답을 선택했는지 확인
    const hasAnswer = currentQuiz.quizType === 'choiceblank'
        ? blankAnswers.size > 0
        : selectedIds.length > 0;

    return (
        <QuizLayout
            onExit={handleExit}
            isViewMode={isViewMode}
            navigation={
                <div key={`nav-${currentQuiz.id}`}>
                    <QuizNavigation
                        total={progress.total}
                        current={progress.current}
                        answers={answers}
                        quizIds={packData.quizzes.map(q => q.id)}
                        onNavigate={goToQuiz}
                    />
                </div>
            }
        >
            {/* 퀴즈 콘텐츠 */}
            <div key={`content-${currentQuiz.id}`} style={{ flex: 1, overflow: 'auto' }}>
                <QuizContent
                    quiz={currentQuiz}
                    selectedIds={selectedIds}
                    blankAnswers={blankAnswers}
                    onSelectChoice={selectChoice}
                    onSetBlank={setBlankAnswer}
                    isChecked={isChecked}
                    isCorrect={currentAnswer?.isCorrect}
                    showHint={showHint}
                    showExplanation={showExplanation}
                    onToggleHint={toggleHint}
                />
            </div>

            {/* 하단 버튼 */}
            <div key={`actions-${currentQuiz.id}`} className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <QuizActions
                    isChecked={isChecked}
                    isLastQuiz={isLastQuiz}
                    hasAnswer={hasAnswer}
                    isViewMode={isViewMode}
                    onCheckAnswer={handleCheckAnswer}
                    onNext={goToNext}
                    onComplete={handleComplete}
                    onGoHome={handleGoHome}
                />
            </div>
        </QuizLayout>
    );
}
