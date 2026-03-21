import { createClient } from '@/lib/supabase/client';

/**
 * 온보딩 완료 시 XP를 지급합니다. (+500 XP)
 * - users.total_xp에 500 추가
 * - users_xp_history에 onboarding 레코드 추가 (is_league_target=false)
 */
export async function grantOnboardingXP(userId: number) {
    const supabase = createClient();
    const XP_AMOUNT = 500;

    // 1. users.total_xp 업데이트 (weekly_xp는 업데이트하지 않음 - 온보딩은 리그 대상 아님)
    const { error: updateError } = await supabase
        .from('users')
        .update({
            total_xp: XP_AMOUNT,
        })
        .eq('id', userId);

    if (updateError) {
        console.error('[grantOnboardingXP] total_xp 업데이트 에러:', updateError);
        throw updateError;
    }

    // 2. XP 히스토리 기록
    const { error: historyError } = await supabase
        .from('users_xp_history')
        .insert({
            user_id: userId,
            xp_type: 'onboarding',
            xp_amount: XP_AMOUNT,
            is_league_target: false,
            description: '온보딩 완료 보너스',
        });

    if (historyError) {
        console.error('[grantOnboardingXP] XP 히스토리 기록 에러:', historyError);
        // 히스토리 기록 실패는 치명적이지 않으므로 throw하지 않음
    }
}

/**
 * 퀴즈 1문제에 대한 XP를 계산합니다.
 * @param difficultyId 난이도 ID (1~5)
 * @param isCorrect 정답 여부
 * @param hintUsed 힌트 사용 여부
 * @param comboCount 현재 연속 정답 카운트 (정답 처리 후의 값)
 * @param completedCount 퀴즈팩 완료 횟수 (0=1회차, 1=2회차, 2+=3회차+)
 * @returns 이번 퀴즈로 인한 XP 변동량 (양수/음수/0)
 */
export async function calculateQuizXP(
    difficultyId: number,
    isCorrect: boolean,
    hintUsed: boolean,
    comboCount: number,
    completedCount: number = 0
): Promise<number> {
    // 3회차 이후 (2회 이상 완료): XP 획득 불가
    if (completedCount >= 2) return 0;

    const supabase = createClient();

    // 난이도별 XP 조회
    const { data: difficulty, error } = await supabase
        .from('quiz_difficulty')
        .select('xp_correct, xp_hint')
        .eq('id', difficultyId)
        .single();

    if (error || !difficulty) {
        console.error('[calculateQuizXP] 난이도 조회 에러:', error);
        return 0;
    }

    let xpDelta = 0;

    // 1. 정답 XP
    if (isCorrect) {
        xpDelta += difficulty.xp_correct;
    }

    // 2. 힌트 차감 XP
    if (hintUsed) {
        xpDelta -= difficulty.xp_hint;
    }

    // 3. 콤보 XP (2회 이상 연속 정답부터)
    if (isCorrect && comboCount >= 2) {
        xpDelta += 20;
    }

    // 4. 2회차 (1회 완료): 50% 적용 (반올림)
    if (completedCount === 1) {
        xpDelta = Math.round(xpDelta * 0.5);
    }

    return xpDelta;
}

/**
 * user_quizpacks의 pending_xp를 atomic하게 업데이트합니다.
 * DB의 increment_pending_xp RPC 함수를 사용하여 race condition 방지.
 */
export async function updatePendingXP(userQuizpackId: number, xpDelta: number) {
    if (xpDelta === 0) return;

    const supabase = createClient();

    const { error } = await supabase.rpc('increment_pending_xp', {
        p_user_quizpack_id: userQuizpackId,
        p_xp_delta: xpDelta,
    });

    if (error) {
        console.error('[updatePendingXP] RPC 에러:', error);
    }
}

/**
 * 퀴즈팩 완료 시 XP를 확정하고 주간 리그 통계를 업데이트합니다.
 * - users.total_xp += pending_xp
 * - users.weekly_xp += pending_xp
 * - users.weekly_unique_packs_count: 최초 완료 시 +1
 * - users.weekly_total_packs_count: 항상 +1
 * - users.total_correct_answers, total_quiz_attempts, quizpack_avrg_correct 업데이트
 * - users_xp_history에 quizpack_complete 레코드 추가
 */
export async function confirmQuizpackXP(
    userId: number,
    userQuizpackId: number,
    quizResult?: { correctCount: number; totalQuizCount: number } // 정답률 갱신용
) {
    const supabase = createClient();

    // 1. pending_xp + 완료 횟수 조회
    const { data: quizpack, error: selectError } = await supabase
        .from('user_quizpacks')
        .select('pending_xp, completed_count')
        .eq('id', userQuizpackId)
        .single();

    if (selectError || !quizpack) {
        console.error('[confirmQuizpackXP] pending_xp 조회 에러:', selectError);
        return;
    }

    const pendingXP = quizpack.pending_xp || 0;
    const completedCount = quizpack.completed_count || 0; // 확정 전 기존 완료 횟수
    const isFirstCompletion = completedCount === 0; // 이번이 첫 완료인지 여부

    // 2. 현재 사용자 통계 조회
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_xp, weekly_xp, weekly_unique_packs_count, weekly_total_packs_count, total_correct_answers, total_quiz_attempts')
        .eq('id', userId)
        .single();

    if (userError || !user) {
        console.error('[confirmQuizpackXP] 사용자 통계 조회 에러:', userError);
        return;
    }

    // 3. 정답률 관련 누적 계산
    const prevCorrect = user.total_correct_answers || 0;
    const prevAttempts = user.total_quiz_attempts || 0;
    const newCorrect = prevCorrect + (quizResult?.correctCount ?? 0);
    const newAttempts = prevAttempts + (quizResult?.totalQuizCount ?? 0);
    const newAvgCorrect = newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 1000) / 10 : 0; // 소수점 1자리

    // 4. users 통계 업데이트
    const updatePayload: Record<string, unknown> = {
        total_xp: (user.total_xp || 0) + pendingXP,
        weekly_xp: (user.weekly_xp || 0) + pendingXP,
        weekly_total_packs_count: (user.weekly_total_packs_count || 0) + 1,
        total_correct_answers: newCorrect,
        total_quiz_attempts: newAttempts,
        quizpack_avrg_correct: newAvgCorrect,
    };

    // 첫 완료인 경우에만 고유 팩 수 증가
    if (isFirstCompletion) {
        updatePayload.weekly_unique_packs_count = (user.weekly_unique_packs_count || 0) + 1;
    }

    const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

    if (updateError) {
        console.error('[confirmQuizpackXP] XP/통계 업데이트 에러:', updateError);
        return;
    }

    if (pendingXP === 0) return; // XP가 0이면 히스토리 기록 불필요

    // 5. XP 히스토리 기록
    const { error: historyError } = await supabase
        .from('users_xp_history')
        .insert({
            user_id: userId,
            xp_type: 'quizpack_complete',
            xp_amount: pendingXP,
            source_id: userQuizpackId,
            is_league_target: true,
            description: `퀴즈팩 완료 XP 확정 (${pendingXP > 0 ? '+' : ''}${pendingXP})`,
        });

    if (historyError) {
        console.error('[confirmQuizpackXP] XP 히스토리 기록 에러:', historyError);
    }

    // 6. earned_xp에 확정 XP 복사 + pending_xp 리셋
    const { error: quizpackUpdateError } = await supabase
        .from('user_quizpacks')
        .update({
            earned_xp: pendingXP,
            pending_xp: 0,
        })
        .eq('id', userQuizpackId);

    if (quizpackUpdateError) {
        console.error('[confirmQuizpackXP] earned_xp 업데이트 에러:', quizpackUpdateError);
    }
}

/**
 * 퀴즈팩 중단/초기화 시 pending_xp를 0으로 리셋합니다.
 */
export async function resetPendingXP(userQuizpackId: number) {
    const supabase = createClient();

    const { error } = await supabase
        .from('user_quizpacks')
        .update({ pending_xp: 0 })
        .eq('id', userQuizpackId);

    if (error) {
        console.error('[resetPendingXP] pending_xp 리셋 에러:', error);
    }
}

/**
 * 사용자의 XP 이력을 조회합니다.
 */
export async function getUserXPHistory(userId: number) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('users_xp_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getUserXPHistory] XP 이력 조회 에러:', error);
        return [];
    }

    return data || [];
}

/**
 * 주간 리그 리셋 함수 (pg_cron 또는 Edge Function에서 호출)
 * - 이전 주 랭킹을 users_ranking_history에 스냅샷 저장
 * - weekly_xp, weekly_unique_packs_count, weekly_total_packs_count 초기화
 */
export async function resetWeeklyLeague() {
    const supabase = createClient();

    const { error } = await supabase.rpc('reset_weekly_league');

    if (error) {
        console.error('[resetWeeklyLeague] 주간 리그 리셋 에러:', error);
        throw error;
    }
}
