'use client';

interface QuizActionsProps {
    isChecked: boolean;
    isLastQuiz: boolean;
    hasAnswer: boolean;
    isViewMode?: boolean;
    onCheckAnswer: () => void;
    onNext: () => void;
    onComplete: () => void;
    onGoHome?: () => void;
}

/**
 * 퀴즈 하단 버튼 영역
 */
export function QuizActions({
    isChecked,
    isLastQuiz,
    hasAnswer,
    isViewMode,
    onCheckAnswer,
    onNext,
    onComplete,
    onGoHome,
}: QuizActionsProps) {
    return (
        <div
            style={{
                display: 'flex',
                padding: '16px 20px',
                borderTop: '1px solid #F3F4F6',
                backgroundColor: '#FFFFFF',
            }}
        >
            {/* 정답 확인 / 다음(완료) 꽉 찬 버튼 1개 */}
            {!isChecked ? (
                // 정답 확인 전 (선택 여부에 따라 스타일 변경)
                <button
                    onClick={onCheckAnswer}
                    disabled={!hasAnswer}
                    className={hasAnswer ? "active:scale-[0.98] transition-transform" : ""}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: hasAnswer ? '#2D2D2D' : '#F3F4F6',
                        color: hasAnswer ? '#FF8400' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: hasAnswer ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                    }}
                >
                    정답 확인
                </button>
            ) : (
                // 결과 확인 후
                <button
                    onClick={
                        isLastQuiz
                            ? (isViewMode && onGoHome ? onGoHome : onComplete)
                            : onNext
                    }
                    className={`quiz-hover active:scale-[0.98] transition-transform`}
                    style={{
                        flex: 1,
                        padding: '16px',
                        backgroundColor: isLastQuiz ? '#2D2D2D' : '#FF8400',
                        color: isLastQuiz ? '#FF8400' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isLastQuiz ? (isViewMode ? '홈으로 가기' : '퀴즈 완료') : '다음 퀴즈'}
                </button>
            )}
        </div>
    );
}
