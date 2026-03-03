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
type ColorTheme = { bg: string; border: string; text: string; badgeBg?: string; badgeText?: string; };

const COLOR: Record<string, ColorTheme> = {
    correct: { bg: '#DAF5FF', border: '#38D2E3', text: '#2D2D2D', badgeBg: '#38D2E3', badgeText: '#ffffff' }, // 정답 시안색
    wrong: { bg: '#FEE6F3', border: '#FB84C5', text: '#2D2D2D', badgeBg: '#FB84C5', badgeText: '#ffffff' },   // 오답 핑크색
    selected: { bg: '#FFEEDB', border: '#FF8400', text: '#2D2D2D', badgeBg: '#ff8400', badgeText: '#ffffff' }, // 빈칸 채워짐 (빈칸 뱃지 주황)
    active: { bg: '#ffffff', border: '#FF8400', text: '#FF8400' },   // 클릭 활성화
    default: { bg: '#ffffff', border: '#D2D2D2', text: '#2D2D2D' }, // 기본 비활성/빈칸
    choiceUsed: { bg: '#F3F4F6', border: '#D2D2D2', text: '#9CA3AF', badgeBg: '#BEBEBE', badgeText: '#ffffff' }, // 채워진 보기 회색 뱃지
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
                <div key={`blank-container-${i}`} style={{ display: 'inline-block', position: 'relative', margin: '0 6px' }}>
                    <button
                        onClick={() => filledChoice && !isChecked
                            ? handleClearBlank(position)
                            : handleBlankClick(position)}
                        disabled={isChecked}
                        className={isChecked ? '' : 'active:scale-95 transition-transform'}
                        style={{
                            display: 'inline-block',
                            height: '38px',
                            lineHeight: '36px', // 테두리 1px*2 패딩 보정
                            minWidth: '72px',
                            padding: '0 16px',
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
                    {/* 빈칸 뱃지 렌더링 */}
                    {filledChoice && colors.badgeBg && (
                        <div style={{
                            position: 'absolute',
                            top: '-4px', // 기존 -8px에서 약간 아래(-4px)로 변경
                            right: '-6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: colors.badgeBg,
                            color: colors.badgeText,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                        }}>
                            {position}
                        </div>
                    )}
                </div>
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

                        // 현재 보기가 채워진 빈칸 번호 찾기 (뱃지 표시용)
                        let matchedPosition: number | null = null;
                        for (const [pos, cId] of blankAnswers.entries()) {
                            if (cId === choice.id) {
                                matchedPosition = pos;
                                break;
                            }
                        }

                        // 보기 버튼 전용 배경/텍스트/보더 오버라이드
                        let btnBg = '#ffffff';
                        let btnBorder = '#D2D2D2';
                        let btnText = '#2D2D2D'; // 미선택 보기의 폰트 색상을 #2D2D2D로 수정
                        let btnOpacity = 1;
                        let badgeBg: string | null = null;
                        let badgeText: string | null = null;

                        if (isChecked) {
                            if (choice.isCorrect) {
                                // 정답인 보기의 경우 시안색 뱃지 표시
                                btnBg = COLOR.correct.bg;
                                btnBorder = COLOR.correct.border;
                                btnText = COLOR.correct.text;
                                badgeBg = COLOR.correct.badgeBg as string;
                                badgeText = COLOR.correct.badgeText as string;
                            } else {
                                btnBg = COLOR.default.bg;
                                btnBorder = COLOR.default.border;
                                btnText = COLOR.default.text;
                            }
                        } else if (isUsed) {
                            // 지문에 넣은(사용된) 보기 상태
                            btnBg = COLOR.choiceUsed.bg;
                            btnBorder = COLOR.choiceUsed.border;
                            btnText = COLOR.choiceUsed.text;
                            badgeBg = COLOR.choiceUsed.badgeBg || null;
                            badgeText = COLOR.choiceUsed.badgeText || null;
                            btnOpacity = 1;        // 색상으로 구분되므로 투명도는 주지 않음
                        } else if (isSelectedNow) {
                            btnBg = COLOR.active.bg;
                            btnBorder = COLOR.active.border;
                            btnText = COLOR.active.text;
                        }

                        return (
                            <div key={choice.id} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => handleChoiceClick(choice.id)}
                                    disabled={isChecked} // isUsed 여도 다시 클릭해서 취소하거나 다른 빈칸에 넣을 수 있게 허용 (기획에 따라 다를 수 있음)
                                    className={isChecked ? '' : 'active:scale-[0.98] transition-transform'}
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
                                {/* 보기 뱃지 렌더링 (정오답 체크 전 사용된 보기 or 체크 후 정답 보기) */}
                                {badgeBg && (matchedPosition !== null || choice.isCorrect) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        backgroundColor: badgeBg,
                                        color: badgeText || '#ffffff',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                    }}>
                                        {isChecked && choice.isCorrect ? choice.blankPosition : matchedPosition}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
