'use client';

import { Circle, X } from 'lucide-react';
import { QuizChoice } from '@/lib/api/quiz';

interface TrueFalseProps {
    choices: QuizChoice[]
    selectedIds: number[];
    onSelect: (choiceId: number) => void;
    isChecked: boolean;
}

// 색상 상수 (디자인 스펙 반영)
const COLOR = {
    correct: { bg: '#DAF5FF', border: '#38D2E3', icon: '#38D2E3' }, // 정답
    wrong: { bg: '#FEE6F3', border: '#FB84C5', icon: '#FB84C5' },   // 선택한 오답
    selected: { bg: '#FFEEDB', border: '#FF8400', icon: '#FF8400' }, // 선택 (결과 전)
    default: { bg: '#FFFFFF', border: '#D2D2D2', icon: '#9CA3AF' }, // 기본
};

/**
 * OX (참/거짓) 퀴즈 컴포넌트
 */
export function TrueFalse({ choices, selectedIds, onSelect, isChecked }: TrueFalseProps) {
    const sortedChoices = [...choices].sort((a, b) => a.choiceOrder - b.choiceOrder);

    return (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '0 90px' }}>
            {sortedChoices.map((choice) => {
                const isSelected = selectedIds.includes(choice.id);
                const isTrue = choice.choiceText.includes('맞') || choice.choiceText === 'O' || choice.choiceText.toLowerCase() === 'true';

                // 상태에 따른 색상 결정 로직
                let colors = COLOR.default;

                if (isChecked) {
                    // 결과 화면
                    if (choice.isCorrect) {
                        // 원래 정답인 경우 시안색 고정
                        colors = COLOR.correct;
                    } else if (isSelected && !choice.isCorrect) {
                        // 내가 선택한 답이 오답인 경우 핑크색 고정
                        colors = COLOR.wrong;
                    } else {
                        // 선택하지 않은 오답
                        colors = COLOR.default;
                    }
                } else if (isSelected) {
                    // 선택했지만 아직 채점 전
                    colors = COLOR.selected;
                }

                return (
                    <button
                        key={choice.id}
                        onClick={() => !isChecked && onSelect(choice.id)}
                        disabled={isChecked}
                        className={isChecked ? '' : 'quiz-hover'}
                        style={{
                            flex: 1, // 가로 2분할
                            height: '120px', // 정사각형 비율 대신 적당한 높이 고정
                            backgroundColor: colors.bg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '16px',
                            cursor: isChecked ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        aria-label={choice.choiceText} // 접근성을 위해 텍스트 유지
                    >
                        {/* O / X 아이콘만 거대하게 표시 */}
                        {isTrue ? (
                            <Circle
                                size={60} // 사이즈 조절
                                color={colors.icon}
                                strokeWidth={2.5}
                            />
                        ) : (
                            <X
                                size={70} // X는 살짝 더 커 보여야 시각적 균형이 맞음
                                color={colors.icon}
                                strokeWidth={2.5}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
