'use client';

import { Lightbulb, BookOpenCheck, Circle, X } from 'lucide-react';
import { Quiz } from '@/lib/api/quiz';
import { MultipleChoice } from './MultipleChoice';
import { TrueFalse } from './TrueFalse';
import { ChoiceBlank } from './ChoiceBlank';

interface QuizContentProps {
    quiz: Quiz;
    selectedIds: number[];
    blankAnswers: Map<number, number>;
    onSelectChoice: (choiceId: number) => void;
    onSetBlank: (position: number, choiceId: number) => void;
    isChecked: boolean;
    isCorrect?: boolean;
    showHint: boolean;
    showExplanation: boolean;
    onToggleHint: () => void;
}

/**
 * 퀴즈 콘텐츠 영역 (질문, 지문, 보기, 힌트, 해설)
 */
export function QuizContent({
    quiz,
    selectedIds,
    blankAnswers,
    onSelectChoice,
    onSetBlank,
    isChecked,
    isCorrect,
    showHint,
    showExplanation,
    onToggleHint,
}: QuizContentProps) {
    // 퀴즈 유형별 컴포넌트 렌더링
    const renderQuizType = () => {
        switch (quiz.quizType) {
            case 'multiple':
                return (
                    <MultipleChoice
                        choices={quiz.choices}
                        selectedIds={selectedIds}
                        onSelect={onSelectChoice}
                        isChecked={isChecked}
                    />
                );
            case 'truefalse':
                return (
                    <TrueFalse
                        choices={quiz.choices}
                        selectedIds={selectedIds}
                        onSelect={onSelectChoice}
                        isChecked={isChecked}
                    />
                );
            case 'choiceblank':
                return (
                    <ChoiceBlank
                        passage={quiz.passage}
                        choices={quiz.choices}
                        blankCount={quiz.blankCount || 1}
                        blankAnswers={blankAnswers}
                        onSetBlank={onSetBlank}
                        isChecked={isChecked}
                    />
                );
            default:
                return <p>지원하지 않는 퀴즈 유형입니다.</p>;
        }
    };

    // 퀴즈 유형 라벨
    const getQuizTypeLabel = () => {
        switch (quiz.quizType) {
            case 'multiple':
                return '선다';
            case 'truefalse':
                return 'O/X';
            case 'choiceblank':
                return '빈칸채우기';
            default:
                return '';
        }
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 퀴즈 유형 라벨 */}
            <div>
                <span
                    style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#E5E7EB',
                        color: '#6B7280',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    {getQuizTypeLabel()}
                </span>
            </div>

            {/* 질문 */}
            <div style={{ padding: '0 12px' }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1F2937',
                    lineHeight: '1.5',
                }}>
                    {quiz.question}
                </h2>
            </div>

            {/* 지문 (빈칸채우기가 아닌 경우에만) */}
            {quiz.quizType !== 'choiceblank' && quiz.passage && (
                <div
                    style={{
                        backgroundColor: '#F3F4F6',
                        padding: '16px',
                        borderRadius: '8px',
                    }}
                >
                    <p style={{
                        fontSize: '15px',
                        color: '#374151',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                    }}>
                        {quiz.passage}
                    </p>
                </div>
            )}

            {/* 보기 영역 */}
            <div style={{ marginTop: '8px' }}>
                {renderQuizType()}
            </div>

            {/* 힌트 및 정오답 (Flex) / 해설 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 힌트 버튼 & 정답 여부 (Flex 컨테이너) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* 좌측: 힌트 버튼 */}
                    {quiz.hint ? (
                        <button
                            onClick={onToggleHint}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#9CA3AF',
                                transition: 'transform 0.2s ease', // 효과를 위한 transition 추가
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            <Lightbulb size={16} color="#FF8400" />
                            <span>힌트</span>
                        </button>
                    ) : <div />} {/* 힌트 없는 경우 자리 차지용 */}

                    {/* 우측: 정오답 텍스트 (결과 확인 시) */}
                    {isChecked && isCorrect !== undefined && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isCorrect ? '#38D2E3' : '#FB84C5'
                        }}>
                            {isCorrect ? (
                                <>
                                    <Circle size={16} color="#38D2E3" strokeWidth={2.5} />
                                    <span>정답입니다.</span>
                                </>
                            ) : (
                                <>
                                    <X size={16} color="#FB84C5" strokeWidth={2.5} />
                                    <span>오답입니다.</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* 힌트 / 해설 내용 박스 */}
                {(showHint || isChecked) && (
                    <div
                        style={{
                            padding: '16px',
                            backgroundColor: isChecked ? '#DAF5FF' : '#FFEEDB', // 해설은 항상 정답과 동일한 바탕색, 힌트는 #FFEEDB
                            borderRadius: '8px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#374151',
                        }}
                    >
                        {/* 해설이 먼저 있으면 해설 노출 (정답 확인 후) */}
                        {isChecked && quiz.explanation && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 'bold',
                                    marginBottom: '8px'
                                }}>
                                    <BookOpenCheck size={18} color="#38D2E3" />
                                    <span style={{ color: '#9CA3AF' }}>해설</span>
                                </div>
                                <div style={{ color: '#374151' }}>{quiz.explanation}</div>
                            </div>
                        )}

                        {/* 정답 확인 전이거나 해설이 없지만 힌트를 눌렀을 경우 힌트 노출 */}
                        {(!isChecked || (!quiz.explanation && quiz.hint)) && showHint && quiz.hint && (
                            <div style={{ marginTop: isChecked && quiz.explanation ? '12px' : '0' }}>
                                {/* 전구 아이콘과 "힌트" 제목 제거 */}
                                <div style={{ color: '#374151' }}>{quiz.hint}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
