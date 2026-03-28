'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuizContent } from '@/components/quiz/QuizContent';
import { getQuizDetail } from '@/actions/admin/contents_detail';
import { Quiz, QuizChoice } from '@/lib/api/quiz';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuizPreviewModalProps {
    quizId: number | null;
    open: boolean;
    onClose: () => void;
}

export function QuizPreviewModal({ quizId, open, onClose }: QuizPreviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState<Quiz | null>(null);

    // Quiz interactive states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [blankAnswers, setBlankAnswers] = useState<Map<number, number>>(new Map());
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | undefined>(undefined);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        if (quizId && open) {
            loadQuizDetail(quizId);
        } else {
            resetStates();
        }
    }, [quizId, open]);

    const resetStates = () => {
        setSelectedIds([]);
        setBlankAnswers(new Map());
        setIsChecked(false);
        setIsCorrect(undefined);
        setShowHint(false);
    };

    const loadQuizDetail = async (id: number) => {
        setLoading(true);
        try {
            const rawData = await getQuizDetail(id);

            // Transform to Quiz interface (CamelCase)
            const transformedQuiz: Quiz = {
                id: rawData.id,
                quizOrder: rawData.quiz_order,
                quizType: rawData.quiz_type,
                question: rawData.question,
                passage: rawData.passage,
                hint: rawData.hint,
                explanation: rawData.explanation,
                blankCount: rawData.blank_count,
                difficultyId: rawData.difficulty_id,
                choices: (rawData.choices || []).map((c: any) => ({
                    id: c.id,
                    choiceText: c.choice_text,
                    choiceOrder: c.choice_order,
                    isCorrect: c.is_correct,
                    blankPosition: c.blank_position
                }))
            };

            setQuizData(transformedQuiz);
        } catch (error) {
            toast.error('퀴즈 상세 정보를 불러오지 못했습니다.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChoice = (choiceId: number) => {
        if (isChecked) return;

        if (quizData?.quizType === 'multiple' || quizData?.quizType === 'truefalse') {
            setSelectedIds([choiceId]);
        }
    };

    const handleSetBlank = (position: number, choiceId: number | null) => {
        if (isChecked) return;
        const newMap = new Map(blankAnswers);
        if (choiceId === null) {
            newMap.delete(position);
        } else {
            newMap.set(position, choiceId);
        }
        setBlankAnswers(newMap);
    };

    const handleCheck = () => {
        if (!quizData || isChecked) return;

        let correct = false;
        if (quizData.quizType === 'choiceblank') {
            // 빈칸 채우기 정답 체크
            const correctChoices = quizData.choices.filter(c => c.isCorrect);
            correct = correctChoices.every(c => blankAnswers.get(c.blankPosition || 0) === c.id);
            if (correct && blankAnswers.size !== quizData.blankCount) correct = false;
        } else {
            // 선다형/OX 정답 체크
            const correctChoiceIds = quizData.choices.filter(c => c.isCorrect).map(c => c.id);
            correct = selectedIds.length > 0 && selectedIds.every(id => correctChoiceIds.includes(id));
        }

        setIsCorrect(correct);
        setIsChecked(true);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none rounded-3xl">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <DialogTitle className="text-xl font-bold">퀴즈 미리보기</DialogTitle>
                </DialogHeader>

                <div className="max-h-[80vh] overflow-y-auto bg-slate-50">
                    {loading ? (
                        <div className="py-40 text-center text-slate-400 animate-pulse font-medium">퀴즈 로딩 중...</div>
                    ) : quizData ? (
                        <div className="pb-24">
                            <QuizContent
                                quiz={quizData}
                                selectedIds={selectedIds}
                                blankAnswers={blankAnswers}
                                onSelectChoice={handleSelectChoice}
                                onSetBlank={handleSetBlank}
                                isChecked={isChecked}
                                isCorrect={isCorrect}
                                showHint={showHint}
                                showExplanation={isChecked}
                                onToggleHint={() => setShowHint(!showHint)}
                            />
                        </div>
                    ) : null}
                </div>

                {/* Footer Action */}
                {!loading && quizData && (() => {
                    // 답안 선택 여부 확인 로직 (한 개라도 선택/빈칸 채우면 완료로 간주)
                    const isAnswerIncomplete = quizData.quizType === 'choiceblank' 
                        ? blankAnswers.size === 0 
                        : selectedIds.length === 0;
                    
                    return (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center">
                            <Button
                                onClick={isChecked ? resetStates : handleCheck}
                                disabled={!isChecked && isAnswerIncomplete}
                                className={cn(
                                    "w-full max-w-sm h-12 rounded-2xl font-bold text-lg transition-all duration-300",
                                    isChecked
                                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none"
                                )}
                            >
                                {isChecked ? '다시 풀기' : '정답 확인'}
                            </Button>
                        </div>
                    );
                })()}
            </DialogContent>
        </Dialog>
    );
}
