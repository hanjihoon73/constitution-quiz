'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Quiz, QuizPackData, getQuizzesByPackId, saveQuizProgress, getUserQuizProgress, saveUserQuizAnswer, getUserQuizpackId, getUserPreviousAnswers, updateUserQuizpackCurrentOrder, initializeUserQuizpack, resetUserQuizpack } from '@/lib/api/quiz';
import { seededShuffle } from '@/lib/utils/seededShuffle';
import { useAuth } from '@/components/auth';

// 사용자의 답안 타입
export interface UserAnswer {
    quizId: number;
    selectedChoiceIds: number[];  // 선택한 보기 ID들
    blankAnswers?: Map<number, number>;  // 빈칸채우기: position -> choiceId
    isCorrect?: boolean;
}

interface UseQuizState {
    packData: QuizPackData | null;
    currentIndex: number;
    answers: Map<number, UserAnswer>;
    isChecked: boolean;
    showHint: boolean;
    showExplanation: boolean;
    isLoading: boolean;
    error: Error | null;
    startTime: Date | null;
    userQuizpackId: number | null;
}

interface UseQuizReturn extends UseQuizState {
    currentQuiz: Quiz | null;
    progress: { current: number; total: number };
    selectChoice: (choiceId: number) => void;
    setBlankAnswer: (position: number, choiceId: number | null) => void;
    checkAnswer: () => boolean;
    goToNext: () => void;
    goToPrev: () => void;
    goToQuiz: (index: number) => void;
    toggleHint: () => void;
    toggleExplanation: () => void;
    saveProgress: () => Promise<void>;
    completeQuizPack: () => Promise<void>;
    isLastQuiz: boolean;
    isFirstQuiz: boolean;
    correctCount: number;
    incorrectCount: number;
}
interface UseQuizOptions {
    isRestart?: boolean;  // 다시풀기 모드 - 이전 답변 복원 생략
}

export function useQuiz(packId: number, options: UseQuizOptions = {}): UseQuizReturn {
    const { isRestart = false } = options;
    const { dbUser, isLoading: authLoading } = useAuth();
    const [state, setState] = useState<UseQuizState>({
        packData: null,
        currentIndex: 0,
        answers: new Map(),
        isChecked: false,
        showHint: false,
        showExplanation: false,
        isLoading: true,
        error: null,
        startTime: null,
        userQuizpackId: null,
    });

    const isLoadingRef = useRef(false);

    // 퀴즈 데이터 로드
    useEffect(() => {
        let cancelled = false;

        async function loadQuizzes() {
            // 인증 로딩 중이면 대기
            if (authLoading) {
                return;
            }

            // 이미 로딩 중이면 중복 호출 방지 (React strict mode 대응)
            if (isLoadingRef.current) {
                return;
            }
            isLoadingRef.current = true;

            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                const data = await getQuizzesByPackId(packId);

                // 기존 진행 상태 확인 (이어하기)
                let startIndex = 0;
                let userQuizpackId: number | null = null;
                const restoredAnswers = new Map<number, UserAnswer>();

                if (dbUser?.id) {
                    // 퀴즈팩 세션 초기화 (없으면 생성, 있으면 ID 반환)
                    try {
                        userQuizpackId = await initializeUserQuizpack(dbUser.id, packId);
                    } catch (err) {
                        console.error('퀴즈팩 초기화 실패:', err);
                    }

                    if (userQuizpackId) {
                        // 진행 상태 조회 (초기화 후 최신 상태)
                        const progress = await getUserQuizProgress(dbUser.id, packId);

                        // 보기 셔플: session_number 기반으로 매 세션마다 다른 순서
                        const sessionNumber = progress?.session_number || 1;
                        data.quizzes = data.quizzes.map(quiz => ({
                            ...quiz,
                            choices: seededShuffle(
                                quiz.choices,
                                `${userQuizpackId}-${sessionNumber}-${quiz.id}`
                            ),
                        }));

                        // 다시풀기 모드가 아닐 때만 이전 답변 복원
                        if (!isRestart) {
                            const previousAnswers = await getUserPreviousAnswers(userQuizpackId);

                            // 디버깅 로그 추가
                            console.log(`[useQuiz] userQuizpackId: ${userQuizpackId}, status: ${progress?.status}, 복원된 답변 수: ${previousAnswers.length}`);

                            // 진행 중(in_progress)일 때만 중간부터 시작, 그 외에는 처음부터
                            if (progress && progress.status === 'in_progress') {
                                // 저장된 답변 수만큼 이동 (풀지 않은 첫 문제부터 시작)
                                startIndex = Math.min(
                                    previousAnswers.length,
                                    data.quizzes.length - 1
                                );
                            }

                            previousAnswers.forEach(answer => {
                                // 해당 퀴즈 찾기
                                const quiz = data.quizzes.find(q => q.id === answer.quizId);
                                if (!quiz) return;

                                if (quiz.quizType === 'choiceblank') {
                                    // 빈칸채우기: Record를 Map으로 변환 (기존 유지)
                                    const blankAnswers = new Map<number, number>();
                                    if (answer.selectedAnswers && typeof answer.selectedAnswers === 'object' && !Array.isArray(answer.selectedAnswers)) {
                                        Object.entries(answer.selectedAnswers).forEach(([pos, choiceId]) => {
                                            blankAnswers.set(Number(pos), Number(choiceId));
                                        });
                                    }
                                    restoredAnswers.set(answer.quizId, {
                                        quizId: answer.quizId,
                                        selectedChoiceIds: [],
                                        blankAnswers,
                                        isCorrect: answer.isCorrect,
                                    });
                                } else {
                                    // 선다형/O·X: 배열 그대로 사용 (기존 유지)
                                    restoredAnswers.set(answer.quizId, {
                                        quizId: answer.quizId,
                                        selectedChoiceIds: Array.isArray(answer.selectedAnswers) ? answer.selectedAnswers : [],
                                        isCorrect: answer.isCorrect,
                                    });
                                }
                            });
                        } else {
                            console.log(`[useQuiz] 다시풀기 모드 - 이전 답변 복원 생략`);
                        }
                    }
                }

                if (cancelled) return;

                // 현재 퀴즈 상태 설정
                const currentQuiz = data.quizzes[startIndex];
                const currentQuizAnswer = currentQuiz ? restoredAnswers.get(currentQuiz.id) : undefined;
                // 이전 답변이 있고 정답 여부가 확인되었으면 체크된 상태로 표시
                const currentQuizAnswered = !!(currentQuizAnswer && currentQuizAnswer.isCorrect !== undefined);

                setState(prev => ({
                    ...prev,
                    packData: data,
                    currentIndex: startIndex,
                    answers: restoredAnswers,
                    isChecked: currentQuizAnswered,
                    showExplanation: currentQuizAnswered,
                    isLoading: false,
                    startTime: new Date(),
                    userQuizpackId,
                }));
            } catch (err) {
                console.error('퀴즈 로드 에러:', err);
                if (!cancelled) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: err instanceof Error ? err : new Error('퀴즈를 불러오는데 실패했습니다.'),
                    }));
                }
            } finally {
                isLoadingRef.current = false;
            }
        }

        loadQuizzes();

        return () => {
            cancelled = true;
            isLoadingRef.current = false;
        };
    }, [packId, dbUser?.id, authLoading]);

    const currentQuiz = state.packData?.quizzes[state.currentIndex] || null;
    const totalQuizzes = state.packData?.quizzes.length || 0;
    const isLastQuiz = state.currentIndex === totalQuizzes - 1;
    const isFirstQuiz = state.currentIndex === 0;

    // 정답/오답 개수 계산
    const { correctCount, incorrectCount } = (() => {
        let correct = 0;
        let incorrect = 0;
        state.answers.forEach(answer => {
            if (answer.isCorrect === true) correct++;
            else if (answer.isCorrect === false) incorrect++;
        });
        return { correctCount: correct, incorrectCount: incorrect };
    })();

    // 보기 선택
    const selectChoice = useCallback((choiceId: number) => {
        if (state.isChecked || !currentQuiz) return;

        setState(prev => {
            const newAnswers = new Map(prev.answers);
            const existing = newAnswers.get(currentQuiz.id);

            // 이미 선택된 경우 토글
            if (existing?.selectedChoiceIds.includes(choiceId)) {
                newAnswers.set(currentQuiz.id, {
                    ...existing,
                    selectedChoiceIds: existing.selectedChoiceIds.filter(id => id !== choiceId),
                });
            } else {
                // 새로 선택 (단일 선택으로 대체)
                newAnswers.set(currentQuiz.id, {
                    quizId: currentQuiz.id,
                    selectedChoiceIds: [choiceId],
                    blankAnswers: existing?.blankAnswers,
                });
            }

            return { ...prev, answers: newAnswers };
        });
    }, [state.isChecked, currentQuiz]);

    // 빈칸 답안 설정 (빈칸채우기용)
    const setBlankAnswer = useCallback((position: number, choiceId: number | null) => {
        if (state.isChecked || !currentQuiz) return;

        setState(prev => {
            const newAnswers = new Map(prev.answers);
            const existing = newAnswers.get(currentQuiz.id);
            const blankAnswers = new Map(existing?.blankAnswers || []);

            if (choiceId === null) {
                blankAnswers.delete(position);
            } else {
                blankAnswers.set(position, choiceId);
            }

            newAnswers.set(currentQuiz.id, {
                quizId: currentQuiz.id,
                selectedChoiceIds: existing?.selectedChoiceIds || [],
                blankAnswers,
            });

            return { ...prev, answers: newAnswers };
        });
    }, [state.isChecked, currentQuiz]);

    // 정답 확인
    const checkAnswer = useCallback((): boolean => {
        if (!currentQuiz) return false;

        const userAnswer = state.answers.get(currentQuiz.id);
        if (!userAnswer) return false;

        let isCorrect = false;

        if (currentQuiz.quizType === 'choiceblank') {
            // 빈칸채우기: 모든 빈칸이 올바른 보기로 채워졌는지 확인
            const blankAnswers = userAnswer.blankAnswers;
            if (blankAnswers && blankAnswers.size > 0) {
                isCorrect = currentQuiz.choices
                    .filter(c => c.isCorrect && c.blankPosition !== null)
                    .every(c => blankAnswers.get(c.blankPosition!) === c.id);
            }
        } else {
            // multiple, truefalse: 선택한 보기가 정답인지 확인
            const correctChoiceIds = currentQuiz.choices
                .filter(c => c.isCorrect)
                .map(c => c.id);

            isCorrect =
                userAnswer.selectedChoiceIds.length === correctChoiceIds.length &&
                userAnswer.selectedChoiceIds.every(id => correctChoiceIds.includes(id));
        }

        // 정답 여부 저장
        setState(prev => {
            const newAnswers = new Map(prev.answers);
            const existing = newAnswers.get(currentQuiz.id);
            if (existing) {
                newAnswers.set(currentQuiz.id, { ...existing, isCorrect });
            }
            return { ...prev, answers: newAnswers, isChecked: true, showExplanation: true };
        });

        // user_quizzes 테이블에 저장 (비동기, 에러 무시)
        if (dbUser?.id && state.userQuizpackId) {
            const selectedAnswers = currentQuiz.quizType === 'choiceblank'
                ? Object.fromEntries(userAnswer.blankAnswers || [])
                : userAnswer.selectedChoiceIds;

            saveUserQuizAnswer(
                dbUser.id,
                currentQuiz.id,
                state.userQuizpackId,
                state.currentIndex + 1,
                selectedAnswers,
                isCorrect
            ).catch(err => console.error('퀴즈 답변 저장 에러:', err));
        }

        return isCorrect;
    }, [currentQuiz, state.answers, dbUser?.id, state.userQuizpackId, state.currentIndex]);

    // 다음 퀴즈로 이동
    const goToNext = useCallback(() => {
        if (isLastQuiz) return;

        setState(prev => {
            const nextIndex = prev.currentIndex + 1;
            const nextQuiz = prev.packData?.quizzes[nextIndex];

            // 다음 퀴즈의 답변 상태 확인
            const nextQuizAnswer = nextQuiz ? prev.answers.get(nextQuiz.id) : undefined;
            const hasAnswered = !!(nextQuizAnswer && nextQuizAnswer.isCorrect !== undefined);

            // 진행 상태 업데이트 (현재 보고 있는 퀴즈가 가장 최신이면)
            if (dbUser?.id && prev.userQuizpackId) {
                // 다음 문제로 진입했으므로 nextIndex(현재까지 완료한 문제 수와 동일)를 현재 진행 위치로 저장
                updateUserQuizpackCurrentOrder(prev.userQuizpackId, nextIndex)
                    .catch((err: unknown) => console.error('진행 위치 저장 실패:', err));
            }

            return {
                ...prev,
                currentIndex: nextIndex,
                isChecked: hasAnswered,
                showHint: false,
                showExplanation: hasAnswered,
            };
        });
    }, [isLastQuiz, dbUser?.id]);

    // 이전 퀴즈로 이동
    const goToPrev = useCallback(() => {
        if (isFirstQuiz) return;

        setState(prev => {
            const prevIndex = prev.currentIndex - 1;
            const prevQuiz = prev.packData?.quizzes[prevIndex];

            // 이전 퀴즈의 답변 상태 확인
            const prevQuizAnswer = prevQuiz ? prev.answers.get(prevQuiz.id) : undefined;
            const hasAnswered = !!(prevQuizAnswer && prevQuizAnswer.isCorrect !== undefined);

            return {
                ...prev,
                currentIndex: prevIndex,
                isChecked: hasAnswered,
                showHint: false,
                showExplanation: hasAnswered,
            };
        });
    }, [isFirstQuiz]);

    // 특정 퀴즈로 이동
    const goToQuiz = useCallback((index: number) => {
        if (index < 0 || index >= totalQuizzes) return;
        setState(prev => {
            const targetQuiz = prev.packData?.quizzes[index];
            const hasAnswered = targetQuiz ? prev.answers.has(targetQuiz.id) && prev.answers.get(targetQuiz.id)?.isCorrect !== undefined : false;

            return {
                ...prev,
                currentIndex: index,
                isChecked: hasAnswered,
                showHint: false,
                showExplanation: hasAnswered,
            };
        });
    }, [totalQuizzes]);

    // 힌트 토글
    const toggleHint = useCallback(() => {
        setState(prev => ({ ...prev, showHint: !prev.showHint }));
    }, []);

    // 해설 토글
    const toggleExplanation = useCallback(() => {
        setState(prev => ({ ...prev, showExplanation: !prev.showExplanation }));
    }, []);

    // 진행 상태 저장
    const saveProgress = useCallback(async () => {
        if (!dbUser?.id || !state.packData) return;

        await saveQuizProgress(dbUser.id, packId, {
            currentQuizOrder: state.currentIndex + 1,
            solvedQuizCount: state.answers.size,
            correctCount,
            incorrectCount,
            totalQuizCount: totalQuizzes,
            status: 'in_progress',
        });
    }, [dbUser?.id, packId, state.packData, state.currentIndex, state.answers.size, correctCount, incorrectCount, totalQuizzes]);

    // 퀴즈팩 완료
    const completeQuizPack = useCallback(async () => {
        if (!dbUser?.id || !state.packData) {
            console.error('[completeQuizPack] dbUser.id 또는 packData가 없습니다.', { dbUserId: dbUser?.id, hasPackData: !!state.packData });
            return;
        }

        const totalTimeSeconds = state.startTime
            ? Math.floor((new Date().getTime() - state.startTime.getTime()) / 1000)
            : 0;

        try {
            await saveQuizProgress(dbUser.id, packId, {
                currentQuizOrder: totalQuizzes,
                solvedQuizCount: totalQuizzes,
                correctCount,
                incorrectCount,
                totalQuizCount: totalQuizzes,
                status: 'completed',
                totalTimeSeconds,
            });
        } catch (error) {
            console.error('[completeQuizPack] saveQuizProgress 에러:', error);
            throw error;
        }
    }, [dbUser?.id, packId, state.packData, state.startTime, totalQuizzes, correctCount, incorrectCount]);

    return {
        ...state,
        currentQuiz,
        progress: { current: state.currentIndex + 1, total: totalQuizzes },
        selectChoice,
        setBlankAnswer,
        checkAnswer,
        goToNext,
        goToPrev,
        goToQuiz,
        toggleHint,
        toggleExplanation,
        saveProgress,
        completeQuizPack,
        isLastQuiz,
        isFirstQuiz,
        correctCount,
        incorrectCount,
    };
}
