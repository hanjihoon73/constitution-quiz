'use client';

import { Check, X } from 'lucide-react';
import { QuizChoice } from '@/lib/api/quiz';

interface MultipleChoiceProps {
    choices: QuizChoice[];
    selectedIds: number[];
    onSelect: (choiceId: number) => void;
    isChecked: boolean;
}

// 색상 상수
const COLOR = {
    correct: { bg: '#DAF5FF', border: '#38D2E3', text: '#374151' }, // 정답 결과 (선택한 정답)
    wrong: { bg: '#FEE6F3', border: '#FB84C5', text: '#374151' }, // 오답 결과 (선택한 오답)
    selected: { bg: '#FFEEDB', border: '#FF8400', text: '#374151' }, // 선택 상태
    default: { bg: '#ffffff', border: '#E5E7EB', text: '#374151' }, // 기본 상태
    correct_unselected: { bg: '#DAF5FF', border: '#38D2E3', text: '#374151' } // 정답 결과 (선택 안한 정답)
};

/**
 * 4지선다 퀴즈 컴포넌트
 */
export function MultipleChoice({ choices, selectedIds, onSelect, isChecked }: MultipleChoiceProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {choices.map((choice, index) => {
                const isSelected = selectedIds.includes(choice.id);

                // 상태에 따른 색상 결정
                let colors = COLOR.default;

                if (isChecked) {
                    if (choice.isCorrect && isSelected) {
                        colors = COLOR.correct; // 선택한 정답
                    } else if (choice.isCorrect && !isSelected) {
                        colors = COLOR.correct_unselected; // 선택 안한 정답
                    } else if (isSelected && !choice.isCorrect) {
                        colors = COLOR.wrong; // 선택한 오답
                    }
                } else if (isSelected) {
                    colors = COLOR.selected; // 단순히 선택된 상태
                }

                // 번호 뱃지 가변 색상 제어
                const badgeBg = isChecked
                    ? choice.isCorrect
                        ? '#38D2E3'
                        : isSelected ? '#FB84C5' : '#E5E7EB' // 선택안한오답은 기본
                    : isSelected
                        ? '#2D2D2D'
                        : '#E5E7EB';

                const badgeText = isChecked
                    ? choice.isCorrect
                        ? '#2D2D2D' // 정답 보기 번호 텍스트
                        : isSelected ? '#2D2D2D' : '#374151' // 오답 보기 번호 텍스트
                    : isSelected
                        ? '#FF8400'
                        : '#374151';

                return (
                    <button
                        key={choice.id}
                        onClick={() => !isChecked && onSelect(choice.id)}
                        disabled={isChecked}
                        className={isChecked ? '' : 'quiz-hover active:scale-[0.98]'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            backgroundColor: colors.bg,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '12px',
                            cursor: isChecked ? 'default' : 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {/* 번호 뱃지 */}
                        <span
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: badgeBg,
                                color: badgeText,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {index + 1}
                        </span>

                        {/* 보기 텍스트 */}
                        <span style={{ color: colors.text, flex: 1, fontSize: '16px', lineHeight: '1.5' }}>
                            {choice.choiceText}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
