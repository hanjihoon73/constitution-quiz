'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { QuizChoice } from '@/lib/api/quiz';

interface ChoiceBlankProps {
    passage: string;
    choices: QuizChoice[];
    blankCount: number;
    blankAnswers: Map<number, number>;
    onSetBlank: (position: number, choiceId: number | null) => void;
    isChecked: boolean;
}

// 색상 상수 (빈칸 & 보기 버튼 공통)
const COLOR = {
    correct: { bg: '#DAF5FF', border: '#38D2E3', text: '#2D2D2D' }, // 정답 시안색
    wrong: { bg: '#FEE6F3', border: '#FB84C5', text: '#2D2D2D' },   // 오답 핑크색
    selected: { bg: '#FFEEDB', border: '#FF8400', text: '#2D2D2D' }, // 빈칸에 보기가 채워졌을 때
    active: { bg: '#ffffff', border: '#FF8400', text: '#FF8400' },   // 클릭 활성화
    default: { bg: '#ffffff', border: '#D2D2D2', text: '#2D2D2D' }, // 기본 비활성/빈칸
};

/**
 * 빈칸 채우기 퀴즈 컴포넌트
 */
export function ChoiceBlank({
    passage,
    choices,
    blankCount,
    blankAnswers,
    onSetBlank,
    isChecked
}: ChoiceBlankProps) {
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [activeBlank, setActiveBlank] = useState<number | null>(null);

    // 빈칸 클릭 시
    const handleBlankClick = (position: number) => {
        if (isChecked) return;
        if (selectedChoice !== null) {
            onSetBlank(position, selectedChoice);
            setSelectedChoice(null);
            setActiveBlank(null);
        } else {
            setActiveBlank(activeBlank === position ? null : position);
        }
    };

    // 보기 클릭 시
    const handleChoiceClick = (choiceId: number) => {
        if (isChecked) return;
        if (activeBlank !== null) {
            onSetBlank(activeBlank, choiceId);
            setActiveBlank(null);
            setSelectedChoice(null);
        } else {
            setSelectedChoice(choiceId === selectedChoice ? null : choiceId);
        }
    };

    // 빈칸 초기화
    const handleClearBlank = (position: number) => {
        if (isChecked) return;
        onSetBlank(position, null); // 1. 빈칸에서 보기 제거
        setActiveBlank(null);       // 2. 다른 빈칸이나 보기가 선택되지 않은 기본 상태로 초기화
    };

    // 지문에서 빈칸 패턴을 찾아서 렌더링
    const renderPassageWithBlanks = () => {
        const blankPattern = /\(\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*\)|_____/g;
        const parts: (string | { type: 'blank'; position: number })[] = [];
        let lastIndex = 0;
        let blankIndex = 0;
        let match;

        while ((match = blankPattern.exec(passage)) !== null) {
            if (match.index > lastIndex) {
                parts.push(passage.substring(lastIndex, match.index));
            }
            blankIndex++;
            parts.push({ type: 'blank', position: blankIndex });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < passage.length) {
            parts.push(passage.substring(lastIndex));
        }

        return parts.map((part, i) => {
            if (typeof part === 'string') {
                return <span key={`text-${i}`}>{part}</span>;
            }

            const position = part.position;
            const filledChoiceId = blankAnswers.get(position);
            const filledChoice = choices.find(c => c.id === filledChoiceId);
            const correctChoice = choices.find(c => c.blankPosition === position && c.isCorrect);
            const isActive = activeBlank === position;

            // 스타일 결정
            let colors = COLOR.default;

            if (isChecked && filledChoice) {
                const isCorrectAnswer = filledChoiceId === correctChoice?.id;
                colors = isCorrectAnswer ? COLOR.correct : COLOR.wrong;
            } else if (filledChoice) {
                colors = COLOR.selected; // 배경: #FFEEDB, 텍스트: #2D2D2D, 테두리: #FF8400
            } else if (isActive) {
                colors = COLOR.active;
            }

            return (
                <button
                    key={`blank-${i}`}
                    onClick={() => filledChoice && !isChecked
                        ? handleClearBlank(position)
                        : handleBlankClick(position)}
                    disabled={isChecked}
                    style={{
                        display: 'inline-block',
                        height: '38px',
                        lineHeight: '36px', // 테두리 1px*2 패딩 보정
                        minWidth: '72px',
                        padding: '0 16px',
                        margin: '0 6px',
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        cursor: isChecked ? 'default' : 'pointer',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: colors.text,
                        transition: 'all 0.2s ease',
                        verticalAlign: 'bottom', // 텍스트 줄 기준
                        position: 'relative',
                        top: '-2px', // 시각적 중앙 정렬 미세 조정
                        textAlign: 'center',
                    }}
                >
                    {filledChoice ? filledChoice.choiceText : `빈칸${position}`}
                </button>
            );
        });
    };

    // 사용된 보기 ID들
    const usedChoiceIds = Array.from(blankAnswers.values());

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 상단 안내 메시지 영역(기존 activeBlank 체크 영역)은 시안과 다르므로 완전히 걷어냈습니다. */}

            {/* 지문 (빈칸 포함) */}
            <div
                style={{
                    backgroundColor: '#F3F4F6',
                    padding: '24px',
                    borderRadius: '16px',
                    lineHeight: '2.8', // 다시 넓은 행간으로 유지하되 버튼은 늘어나지 않음
                    fontSize: '16px',
                    color: '#374151',
                }}
            >
                {renderPassageWithBlanks()}
            </div>

            {/* 보기 목록 컨테이너 */}
            <div>
                <p style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '12px',
                    fontWeight: 'bold',
                }}>
                    보기
                </p>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    {choices.map((choice) => {
                        const isUsed = usedChoiceIds.includes(choice.id);
                        const isSelectedNow = selectedChoice === choice.id;

                        // 보기 버튼 전용 배경/텍스트/보더 오버라이드
                        let btnBg = '#ffffff';
                        let btnBorder = '#D2D2D2';
                        let btnText = '#2D2D2D'; // 미선택 보기의 폰트 색상을 #2D2D2D로 수정
                        let btnOpacity = 1;

                        if (isChecked) {
                            if (choice.isCorrect) {
                                btnBg = COLOR.correct.bg;
                                btnBorder = COLOR.correct.border;
                                btnText = COLOR.correct.text;
                            } else {
                                btnBg = COLOR.default.bg;
                                btnBorder = COLOR.default.border;
                                btnText = COLOR.default.text;
                            }
                        } else if (isUsed) {
                            // 지문에 넣은(사용된) 보기 상태
                            btnBg = '#F3F4F6';     // 연한 회색 배경
                            btnBorder = '#D2D2D2'; // 연한 회색 테두리
                            btnText = '#9CA3AF';   // 폰트 연한 회색 (본문은 짙은회색, 아래 보기는 연한회색)
                            btnOpacity = 1;        // 색상으로 구분되므로 투명도는 주지 않음
                        } else if (isSelectedNow) {
                            btnBg = COLOR.active.bg;
                            btnBorder = COLOR.active.border;
                            btnText = COLOR.active.text;
                        }

                        return (
                            <button
                                key={choice.id}
                                onClick={() => handleChoiceClick(choice.id)}
                                disabled={isChecked} // isUsed 여도 다시 클릭해서 취소하거나 다른 빈칸에 넣을 수 있게 허용 (기획에 따라 다를 수 있음)
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: btnBg,
                                    color: btnText,
                                    border: `1px solid ${btnBorder}`,
                                    borderRadius: '8px', // 살짝 둥근 사각형
                                    cursor: isChecked ? 'default' : 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    opacity: btnOpacity,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {choice.choiceText}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
