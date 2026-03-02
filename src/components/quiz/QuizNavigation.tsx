'use client';

import { UserAnswer } from '@/hooks/useQuiz';

interface QuizNavigationProps {
    total: number;
    current: number;
    answers: Map<number, UserAnswer>;
    quizIds: number[];
    onNavigate: (index: number) => void;
}

/**
 * 퀴즈 번호 네비게이션 컴포넌트
 */
export function QuizNavigation({ total, current, answers, quizIds, onNavigate }: QuizNavigationProps) {
    const progressPercentage = (current / total) * 100;

    return (
        <div
            style={{
                padding: '10px 20px 16px 20px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '8px 24px',
                    overflowX: 'auto',
                    border: '1px solid #E5E7EB',
                    borderRadius: '9999px',
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE and Edge
                    width: 'fit-content',
                    margin: '0 auto',
                    maxWidth: '100%',
                    WebkitOverflowScrolling: 'touch', // iOS에서 부드러운 스크롤/바운스 효과 적용
                    overscrollBehaviorX: 'contain', // 최신 브라우저의 기본 스크롤 체인/바운스 동작 제어
                }}
                className="hide-scrollbar" // For custom CSS if needed
            >
                {quizIds.map((id, index) => {
                    const quizNum = index + 1;
                    const answer = answers.get(id);
                    const isCurrent = current === quizNum;

                    // 기본 상태: 투명 배경, 연한 회색 테두리, 회색 번호 텍스트
                    let bgColor = 'transparent';
                    let borderColor = '#E5E7EB';
                    let textColor = '#D2D2D2';

                    const isAnswered = answer && answer.isCorrect !== undefined;

                    if (isCurrent) {
                        if (!isAnswered) {
                            // 상태 A: 현재 퀴즈 - 정오답 결과 전
                            bgColor = '#2D2D2D';
                            borderColor = '#2D2D2D';
                            textColor = '#FF8400';
                        } else if (answer.isCorrect) {
                            // 상태 B: 현재 퀴즈 - 정답 결과
                            bgColor = '#2D2D2D';
                            borderColor = '#2D2D2D';
                            textColor = '#38D2E3';
                        } else {
                            // 상태 C: 현재 퀴즈 - 오답 결과
                            bgColor = '#2D2D2D';
                            borderColor = '#2D2D2D';
                            textColor = '#FB84C5';
                        }
                    } else if (isAnswered) {
                        if (answer.isCorrect) {
                            // 상태 D: 현재 퀴즈 아님 - 정답 결과
                            bgColor = '#38D2E3';
                            borderColor = '#38D2E3';
                            textColor = '#2D2D2D';
                        } else {
                            // 상태 E: 현재 퀴즈 아님 - 오답 결과
                            bgColor = '#FB84C5';
                            borderColor = '#FB84C5';
                            textColor = '#2D2D2D';
                        }
                    }

                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(index)}
                            className="active:scale-95 transition-transform"
                            style={{
                                minWidth: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: bgColor,
                                border: `1px solid ${borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: isCurrent || answer ? 'bold' : 'bold',
                                color: textColor,
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: 0,
                                transition: 'all 0.2s',
                            }}
                        >
                            {quizNum}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
