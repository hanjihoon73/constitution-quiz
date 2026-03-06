import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type QuizType = Database['public']['Enums']['quiz_type'];

export interface QuizChoice {
    id: number;
    choiceText: string;
    choiceOrder: number;
    isCorrect: boolean;
    blankPosition: number | null;
}

export interface Quiz {
    id: number;
    quizOrder: number;
    quizType: QuizType;
    question: string;
    passage: string;
    hint: string;
    explanation: string;
    blankCount: number | null;
    difficultyId: number | null;
    choices: QuizChoice[];
}

export interface QuizPackData {
    packId: number;
    keywords: string;
    quizzes: Quiz[];
}

/**
 * 퀴즈팩의 퀴즈 목록을 조회합니다.
 */
export async function getQuizzesByPackId(packId: number): Promise<QuizPackData> {
    const supabase = createClient();

    // 퀴즈팩 정보 조회
    const { data: packData, error: packError } = await supabase
        .from('quizpacks')
        .select('id, keywords')
        .eq('id', packId)
        .single();

    if (packError) {
        console.error('퀴즈팩 조회 에러:', packError);
        throw packError;
    }

    // 퀴즈 목록 조회
    const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
            id,
            quiz_order,
            quiz_type,
            question,
            passage,
            hint,
            explanation,
            blank_count,
            difficulty_id,
            quiz_choices (
                id,
                choice_text,
                choice_order,
                is_correct,
                blank_position
            )
        `)
        .eq('quizpack_id', packId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('quiz_order', { ascending: true });

    if (quizzesError) {
        console.error('퀴즈 목록 조회 에러:', quizzesError);
        throw quizzesError;
    }

    // 데이터 변환
    const quizzes: Quiz[] = (quizzesData || []).map((q) => ({
        id: q.id,
        quizOrder: q.quiz_order,
        quizType: q.quiz_type,
        question: q.question,
        passage: q.passage,
        hint: q.hint,
        explanation: q.explanation,
        blankCount: q.blank_count,
        difficultyId: q.difficulty_id,
        choices: (q.quiz_choices || []).map((c) => ({
            id: c.id,
            choiceText: c.choice_text,
            choiceOrder: c.choice_order,
            isCorrect: c.is_correct || false,
            blankPosition: c.blank_position,
        })).sort((a, b) => a.choiceOrder - b.choiceOrder),
    }));

    return {
        packId: packData.id,
        keywords: packData.keywords,
        quizzes,
    };
}

/**
 * 사용자의 퀴즈팩 진행 상태를 저장/업데이트합니다.
 */
export async function saveQuizProgress(
    userId: number,
    packId: number,
    data: {
        currentQuizOrder: number;
        solvedQuizCount: number;
        correctCount: number;
        incorrectCount: number;
        totalQuizCount: number;
        status: 'in_progress' | 'completed';
        totalTimeSeconds?: number;
    }
) {
    const supabase = createClient();

    // 기존 진행 기록 확인
    const { data: existing, error: checkError } = await supabase
        .from('user_quizpacks')
        .select('id, session_number, status')
        .eq('user_id', userId)
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (checkError) {
        console.error('진행 상태 확인 에러:', checkError);
        throw checkError;
    }

    const correctRate = data.solvedQuizCount > 0
        ? (data.correctCount / data.solvedQuizCount) * 100
        : 0;

    if (existing) {
        // 업데이트
        // 이미 completed 상태인데 in_progress로 변경하려는 경우 상태 유지 (결과보기 모드)
        const finalStatus = (existing as { status?: string }).status === 'completed' && data.status === 'in_progress'
            ? 'completed'
            : data.status;

        const updateData: Record<string, unknown> = {
            current_quiz_order: data.currentQuizOrder,
            solved_quiz_count: data.solvedQuizCount,
            correct_count: data.correctCount,
            incorrect_count: data.incorrectCount,
            correct_rate: correctRate,
            status: finalStatus,
            last_played_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString();
            updateData.session_number = (existing.session_number || 0) + 1;
        }

        if (data.totalTimeSeconds) {
            updateData.total_time_seconds = data.totalTimeSeconds;
        }

        const { error: updateError } = await supabase
            .from('user_quizpacks')
            .update(updateData)
            .eq('id', existing.id);

        if (updateError) {
            console.error('진행 상태 업데이트 에러:', updateError);
            throw updateError;
        }
    } else {
        // 신규 생성
        // quizpack_order 조회
        const { data: loadmap } = await supabase
            .from('quizpack_loadmap')
            .select('pack_order')
            .eq('quizpack_id', packId)
            .single();

        const { error: insertError } = await supabase
            .from('user_quizpacks')
            .insert({
                user_id: userId,
                quizpack_id: packId,
                quizpack_order: loadmap?.pack_order || 1,
                current_quiz_order: data.currentQuizOrder,
                solved_quiz_count: data.solvedQuizCount,
                correct_count: data.correctCount,
                incorrect_count: data.incorrectCount,
                correct_rate: correctRate,
                total_quiz_count: data.totalQuizCount,
                status: data.status,
                started_at: new Date().toISOString(),
                last_played_at: new Date().toISOString(),
                session_number: 1,
            });

        if (insertError) {
            console.error('진행 상태 생성 에러:', insertError);
            throw insertError;
        }
    }
}

/**
 * 사용자의 퀴즈팩 진행 상태를 조회합니다.
 */
export async function getUserQuizProgress(userId: number, packId: number) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_quizpacks')
        .select('*')
        .eq('user_id', userId)
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (error) {
        console.error('진행 상태 조회 에러:', error);
        throw error;
    }

    return data;
}

/**
 * 사용자의 개별 퀴즈 답변을 저장합니다.
 */
export async function saveUserQuizAnswer(
    userId: number,
    quizId: number,
    userQuizpackId: number,
    quizOrder: number,
    selectedAnswers: number[] | Record<number, number>,
    isCorrect: boolean,
    hintUsed: boolean = false
) {
    const supabase = createClient();

    // 기존 답변이 있는지 확인 (같은 세션에서 같은 퀴즈)
    const { data: existing } = await supabase
        .from('user_quizzes')
        .select('id')
        .eq('user_quizpack_id', userQuizpackId)
        .eq('quiz_id', quizId)
        .maybeSingle();

    if (existing) {
        // 기존 답변 업데이트
        const { error: updateError } = await supabase
            .from('user_quizzes')
            .update({
                selected_answers: selectedAnswers,
                is_correct: isCorrect,
                hint_used: hintUsed,
                answered_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

        if (updateError) {
            console.error('퀴즈 답변 업데이트 에러:', updateError);
            throw updateError;
        }
    } else {
        // 새 답변 저장
        const { error: insertError } = await supabase
            .from('user_quizzes')
            .insert({
                user_id: userId,
                quiz_id: quizId,
                user_quizpack_id: userQuizpackId,
                quiz_order: quizOrder,
                selected_answers: selectedAnswers,
                is_correct: isCorrect,
                hint_used: hintUsed,
                answered_at: new Date().toISOString(),
            });

        if (insertError) {
            console.error('퀴즈 답변 저장 에러:', insertError);
            throw insertError;
        }
    }
}

/**
 * user_quizpacks의 ID를 조회합니다.
 */
export async function getUserQuizpackId(userId: number, packId: number): Promise<number | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_quizpacks')
        .select('id')
        .eq('user_id', userId)
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (error) {
        console.error('user_quizpack_id 조회 에러:', error);
        return null;
    }

    return data?.id || null;
}

/**
 * 사용자의 이전 퀴즈 답변을 조회합니다.
 */
export interface PreviousAnswer {
    quizId: number;
    selectedAnswers: number[] | Record<string, number>;
    isCorrect: boolean;
}

export async function getUserPreviousAnswers(userQuizpackId: number): Promise<PreviousAnswer[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_quizzes')
        .select('quiz_id, selected_answers, is_correct')
        .eq('user_quizpack_id', userQuizpackId);

    if (error) {
        console.error('이전 답변 조회 에러:', error);
        return [];
    }

    return (data || []).map(item => ({
        quizId: item.quiz_id,
        selectedAnswers: item.selected_answers,
        isCorrect: item.is_correct,
    }));
}

/**
 * 퀴즈팩 통계를 업데이트합니다 (완료 시).
 */
export async function updateQuizpackStatistics(
    packId: number,
    correctCount: number,
    totalQuizCount: number
) {
    const supabase = createClient();
    const correctRate = totalQuizCount > 0 ? (correctCount / totalQuizCount) * 100 : 0;

    // 기존 통계 조회
    const { data: existing } = await supabase
        .from('quizpack_statistics')
        .select('*')
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (existing) {
        // 기존 통계 업데이트 (누적)
        const newTotalCompletions = (existing.total_completions || 0) + 1;
        const newTotalCorrectCount = (existing.total_correct_count || 0) + correctCount;
        const newTotalQuizCount = (existing.total_quiz_count || 0) + totalQuizCount;
        const newAverageCorrectRate = newTotalQuizCount > 0
            ? (newTotalCorrectCount / newTotalQuizCount) * 100
            : 0;

        const { error } = await supabase
            .from('quizpack_statistics')
            .update({
                total_completions: newTotalCompletions,
                total_correct_count: newTotalCorrectCount,
                total_quiz_count: newTotalQuizCount,
                average_correct_rate: newAverageCorrectRate,
            })
            .eq('quizpack_id', packId);

        if (error) {
            console.error('퀴즈팩 통계 업데이트 에러:', error);
            throw error;
        }
    } else {
        // 새 통계 생성
        const { error } = await supabase
            .from('quizpack_statistics')
            .insert({
                quizpack_id: packId,
                total_completions: 1,
                total_correct_count: correctCount,
                total_quiz_count: totalQuizCount,
                average_correct_rate: correctRate,
            });

        if (error) {
            console.error('퀴즈팩 통계 생성 에러:', error);
            throw error;
        }
    }
}

/**
 * 사용자의 퀴즈팩 별점을 저장합니다. (히스토리 방식 - 항상 INSERT)
 */
export async function saveQuizpackRating(
    userId: number,
    packId: number,
    rating: number
) {
    const supabase = createClient();

    // 히스토리 방식: 항상 새 레코드 INSERT (풀이 횟수만큼 레코드 누적)
    const { error } = await supabase
        .from('user_quizpack_ratings')
        .insert({
            user_id: userId,
            quizpack_id: packId,
            rating,
        });

    if (error) {
        console.error('별점 저장 에러:', error);
        throw error;
    }

    // quizpack_statistics의 평점 집계 업데이트 (전체 히스토리 기반 평균)
    await updateQuizpackAverageRating(packId);
}

/**
 * 퀴즈팩의 평균 평점을 업데이트합니다.
 */
async function updateQuizpackAverageRating(packId: number) {
    const supabase = createClient();

    // 해당 퀴즈팩의 모든 평점 조회
    const { data: ratings } = await supabase
        .from('user_quizpack_ratings')
        .select('rating')
        .eq('quizpack_id', packId);

    if (!ratings || ratings.length === 0) return;

    const ratingSum = ratings.reduce((sum, r) => sum + r.rating, 0);
    const ratingCount = ratings.length;
    const averageRating = ratingSum / ratingCount;

    // quizpack_statistics 업데이트
    const { data: existing } = await supabase
        .from('quizpack_statistics')
        .select('id')
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (existing) {
        await supabase
            .from('quizpack_statistics')
            .update({
                rating_count: ratingCount,
                rating_sum: ratingSum,
                average_rating: averageRating,
            })
            .eq('quizpack_id', packId);
    }
}

/**
 * 다음 순서의 퀴즈팩을 해금합니다.
 * @returns 다음 퀴즈팩 ID (없으면 null)
 */
export async function unlockNextQuizpack(userId: number, currentPackId: number): Promise<number | null> {
    const supabase = createClient();

    // 1. 현재 퀴즈팩의 순서 조회
    const { data: currentLoadmap } = await supabase
        .from('quizpack_loadmap')
        .select('pack_order')
        .eq('quizpack_id', currentPackId)
        .single();

    if (!currentLoadmap) {
        console.log('Unlock check: currentLoadmap not found for packId', currentPackId);
        return null;
    }

    // 2. 다음 순서의 퀴즈팩 조회
    const nextOrder = currentLoadmap.pack_order + 1;
    const { data: nextLoadmap } = await supabase
        .from('quizpack_loadmap')
        .select('quizpack_id')
        .eq('pack_order', nextOrder)
        .maybeSingle();

    console.log('Unlock check:', { currentPackId, currentOrder: currentLoadmap.pack_order, nextOrder, nextPackId: nextLoadmap?.quizpack_id });

    if (!nextLoadmap) return null;

    const nextPackId = nextLoadmap.quizpack_id;

    // 3. 다음 퀴즈팩의 user_quizpacks 레코드 확인 및 업데이트
    const { data: userPack } = await supabase
        .from('user_quizpacks')
        .select('id, status')
        .eq('user_id', userId)
        .eq('quizpack_id', nextPackId)
        .maybeSingle();

    if (userPack) {
        // 이미 존재하면 status가 closed일 때만 opened로 변경
        if (userPack.status === 'closed') {
            await supabase
                .from('user_quizpacks')
                .update({ status: 'opened' })
                .eq('id', userPack.id);
        }
    } else {
        // 존재하지 않으면 새로 생성 (opened 상태로)
        // 퀴즈 개수 조회를 위해 quizpacks 테이블 참조 필요
        const { data: packInfo } = await supabase
            .from('quizpacks')
            .select('quiz_count_all')
            .eq('id', nextPackId)
            .single();

        await supabase
            .from('user_quizpacks')
            .insert({
                user_id: userId,
                quizpack_id: nextPackId,
                quizpack_order: nextOrder,
                status: 'opened',
                total_quiz_count: packInfo?.quiz_count_all || 10, // 기본값
                session_number: 0,
            });
    }

    return nextPackId;
}

/**
 * 다음 순서의 퀴즈팩이 존재하는지 확인합니다.
 */
export async function checkNextQuizpackExists(currentPackId: number): Promise<boolean> {
    const supabase = createClient();

    // 1. 현재 퀴즈팩의 순서 조회
    const { data: currentLoadmap } = await supabase
        .from('quizpack_loadmap')
        .select('pack_order')
        .eq('quizpack_id', currentPackId)
        .single();

    if (!currentLoadmap) return false;

    // 2. 다음 순서의 퀴즈팩 존재 여부 확인
    const nextOrder = currentLoadmap.pack_order + 1;
    const { data: nextLoadmap } = await supabase
        .from('quizpack_loadmap')
        .select('id')
        .eq('pack_order', nextOrder)
        .maybeSingle();

    return !!nextLoadmap;
}

/**
 * 사용자 퀴즈팩의 현재 진행 위치를 업데이트합니다.
 */
export async function updateUserQuizpackCurrentOrder(
    userQuizpackId: number,
    currentQuizOrder: number
) {
    const supabase = createClient();

    const { error } = await supabase
        .from('user_quizpacks')
        .update({
            current_quiz_order: currentQuizOrder,
            last_played_at: new Date().toISOString()
        })
        .eq('id', userQuizpackId);

    if (error) {
        console.error('진행 위치 업데이트 에러:', error);
    }
}

/**
 * 퀴즈팩 시작 시(진입 시) 사용자 퀴즈팩 상태를 초기화하거나 가져옵니다.
 * - 없으면 생성 (status='in_progress')
 * - 있으면 상태에 따라 업데이트 후 user_quizpacks ID 반환
 *   - opened → in_progress (시작)
 *   - in_progress → last_played_at 업데이트 (이어하기)
 *   - completed → ID만 반환 (결과보기/다시풀기는 별도 플로우)
 */
export async function initializeUserQuizpack(userId: number, packId: number) {
    const supabase = createClient();

    // 디버깅: auth 세션 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[initializeUserQuizpack] userId:', userId, 'packId:', packId, 'auth.uid:', session?.user?.id ?? 'NULL');

    // 1. 기존 레코드 확인 (에러 핸들링 포함)
    const { data: existing, error: selectError } = await supabase
        .from('user_quizpacks')
        .select('id, status, session_number')
        .eq('user_id', userId)
        .eq('quizpack_id', packId)
        .maybeSingle();

    if (selectError) {
        console.error('[initializeUserQuizpack] 기존 레코드 조회 에러:', {
            message: selectError.message,
            code: selectError.code,
            details: selectError.details,
            hint: selectError.hint,
        });
    }

    if (existing) {
        // 이미 존재하면
        if (existing.status === 'opened') {
            // opened 상태면 in_progress로 변경 (시작)
            const { error: updateError } = await supabase
                .from('user_quizpacks')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                    last_played_at: new Date().toISOString(),
                    session_number: (existing.session_number || 0) + 1,
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[initializeUserQuizpack] opened→in_progress 업데이트 에러:', updateError);
            }
        } else if (existing.status === 'in_progress') {
            // 이미 진행 중이면 last_played_at만 업데이트
            const { error: updateError } = await supabase
                .from('user_quizpacks')
                .update({
                    last_played_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[initializeUserQuizpack] in_progress last_played_at 업데이트 에러:', updateError);
            }
        }
        // completed 상태는 별도 처리 없이 ID만 반환 (결과보기/다시풀기는 별도 플로우)
        return existing.id;
    } else {
        // 없으면 새로 생성 (status='in_progress')
        // quizpack_order 조회
        const { data: loadmap } = await supabase
            .from('quizpack_loadmap')
            .select('pack_order')
            .eq('quizpack_id', packId)
            .maybeSingle();

        // 퀴즈 개수 조회
        const { data: packInfo } = await supabase
            .from('quizpacks')
            .select('quiz_count_all')
            .eq('id', packId)
            .single();

        const { data: newPack, error } = await supabase
            .from('user_quizpacks')
            .insert({
                user_id: userId,
                quizpack_id: packId,
                quizpack_order: loadmap?.pack_order || 1,
                status: 'in_progress',
                total_quiz_count: packInfo?.quiz_count_all || 10,
                session_number: 1,
                started_at: new Date().toISOString(),
                last_played_at: new Date().toISOString(),
                current_quiz_order: 0,
            })
            .select('id')
            .single();

        if (error) {
            // UNIQUE 충돌(23505)인 경우: unlockNextQuizpack이 이미 레코드를 생성했거나
            // React strict mode로 인해 이중 호출된 경우 → 기존 레코드를 찾아서 반환
            if (error.code === '23505') {
                console.log('[initializeUserQuizpack] UNIQUE 충돌 - 기존 레코드 재조회');
                const { data: retryExisting } = await supabase
                    .from('user_quizpacks')
                    .select('id, status, session_number')
                    .eq('user_id', userId)
                    .eq('quizpack_id', packId)
                    .maybeSingle();

                if (retryExisting) {
                    // opened 상태면 in_progress로 전환
                    if (retryExisting.status === 'opened') {
                        await supabase
                            .from('user_quizpacks')
                            .update({
                                status: 'in_progress',
                                started_at: new Date().toISOString(),
                                last_played_at: new Date().toISOString(),
                                session_number: (retryExisting.session_number || 0) + 1,
                            })
                            .eq('id', retryExisting.id);
                    }
                    console.log('[initializeUserQuizpack] 재조회 성공:', retryExisting.id);
                    return retryExisting.id;
                }
            }

            console.error('[initializeUserQuizpack] Insert 에러 (raw):', JSON.stringify(error));
            throw error;
        }
        return newPack.id;
    }
}

/**
 * 퀴즈팩을 처음부터 다시 풀 수 있도록 초기화합니다.
 * - user_quizzes에서 해당 user_quizpack_id의 모든 답변 삭제
 * - user_quizpacks 상태를 in_progress로 변경, current_quiz_order 0으로 리셋
 */
export async function resetUserQuizpack(userQuizpackId: number) {
    const supabase = createClient();

    // 삭제 전 개수 확인 (디버깅용)
    const { count: beforeCount } = await supabase
        .from('user_quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_quizpack_id', userQuizpackId);

    console.log(`[resetUserQuizpack] 삭제 전 답변 수: ${beforeCount}`);

    // 1. 기존 답변 삭제
    const { error: deleteError, count: deletedCount } = await supabase
        .from('user_quizzes')
        .delete({ count: 'exact' })
        .eq('user_quizpack_id', userQuizpackId);

    if (deleteError) {
        console.error('퀴즈 답변 삭제 에러:', deleteError);
        throw deleteError;
    }

    console.log(`[resetUserQuizpack] 삭제된 답변 수: ${deletedCount}`);

    // 삭제 후 개수 확인 (디버깅용)
    const { count: afterCount } = await supabase
        .from('user_quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_quizpack_id', userQuizpackId);

    console.log(`[resetUserQuizpack] 삭제 후 답변 수: ${afterCount}`);

    // 2. user_quizpacks 상태 초기화
    const { error: updateError } = await supabase
        .from('user_quizpacks')
        .update({
            status: 'in_progress',
            current_quiz_order: 0,
            solved_quiz_count: 0,
            correct_count: 0,
            incorrect_count: 0,
            correct_rate: null,
            started_at: new Date().toISOString(),
            last_played_at: new Date().toISOString(),
            // completed_at은 유지 - 이전 완료 기록을 보존하여 후속 퀴즈팩 상태 결정에 사용
        })
        .eq('id', userQuizpackId);

    if (updateError) {
        console.error('퀴즈팩 상태 초기화 에러:', updateError);
        throw updateError;
    }

    return true;
}

/**
 * 현재 진행 중(in_progress)인 퀴즈팩을 조회합니다.
 * 특정 packId를 제외할 수 있습니다 (자기 자신 제외용).
 */
export async function getInProgressQuizpack(userId: number, excludePackId?: number) {
    const supabase = createClient();

    let query = supabase
        .from('user_quizpacks')
        .select('id, quizpack_id, quizpack_order, status, solved_quiz_count')
        .eq('user_id', userId)
        .eq('status', 'in_progress');

    if (excludePackId) {
        query = query.neq('quizpack_id', excludePackId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error('[getInProgressQuizpack] 조회 에러:', error);
        return null;
    }

    return data;
}

/**
 * 진행 중인 퀴즈팩을 중단하고 직전 상태로 복원합니다.
 * - 답변 기록이 있으면 → completed로 복원 + 답변 삭제
 * - 답변 기록이 없으면 → opened로 복원
 */
export async function abortInProgressQuizpack(userQuizpackId: number) {
    const supabase = createClient();

    // 0. pending_xp 리셋 (XP 확정 전 중단이므로 임시 XP 초기화)
    const { error: xpResetError } = await supabase
        .from('user_quizpacks')
        .update({ pending_xp: 0 })
        .eq('id', userQuizpackId);

    if (xpResetError) {
        console.error('[abortInProgressQuizpack] pending_xp 리셋 에러:', xpResetError);
    }

    // 1. 현재 세션에서 풀었던 답변이 있는지 확인
    const { count: answerCount } = await supabase
        .from('user_quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_quizpack_id', userQuizpackId);

    if (answerCount && answerCount > 0) {
        // 답변이 있으면 completed로 복원 (이전에 완료된 퀴즈팩을 다시 푼 경우)
        // 현재 세션의 답변 삭제
        await supabase
            .from('user_quizzes')
            .delete()
            .eq('user_quizpack_id', userQuizpackId);

        // completed 상태로 복원
        const { error } = await supabase
            .from('user_quizpacks')
            .update({
                status: 'completed',
                current_quiz_order: 0,
                solved_quiz_count: 0,
                correct_count: 0,
                incorrect_count: 0,
                correct_rate: null,
                last_played_at: new Date().toISOString(),
            })
            .eq('id', userQuizpackId);

        if (error) {
            console.error('[abortInProgressQuizpack] completed 복원 에러:', error);
            throw error;
        }
    } else {
        // 답변이 없으면 opened로 복원 (아직 아무것도 풀지 않은 경우)
        const { error } = await supabase
            .from('user_quizpacks')
            .update({
                status: 'opened',
                current_quiz_order: 0,
                solved_quiz_count: 0,
                started_at: null,
                last_played_at: new Date().toISOString(),
            })
            .eq('id', userQuizpackId);

        if (error) {
            console.error('[abortInProgressQuizpack] opened 복원 에러:', error);
            throw error;
        }
    }

    return true;
}
