'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface ActivityStat {
    id: number;
    nickname: string;
    title: string | null;
    total_xp: number;
    weekly_xp: number;
    weekly_ranking: number;
    total_quiz_attempts: number;
    total_correct_answers: number;
    quizpack_avrg_correct: number;
    weekly_unique_packs_count: number;
    weekly_total_packs_count: number;
    quizpack_completion_rate: number; // 사용자가 완료한 퀴즈팩 개수 ÷ 전체 퀴즈팩 개수 × 100
    last_login_at: string | null;
}

/**
 * 어드민 활동 관리 대시보드用の 유저 통계 목록을 가져옵니다.
 * - users 테이블에서 통계 컬럼 조회
 * - weekly_xp 기준으로 실시간 주간 랭킹 부여
 * - user_login_history 에서 마지막 로그인 일시 결합
 */
export async function getAdminActivities(): Promise<ActivityStat[]> {
    const supabase = createAdminClient();

    // 1. 유저 통계 정보 조회
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id,
            nickname,
            title,
            total_xp,
            weekly_xp,
            total_quiz_attempts,
            total_correct_answers,
            quizpack_avrg_correct,
            weekly_unique_packs_count,
            weekly_total_packs_count
        `)
        .order('weekly_xp', { ascending: false });

    if (error) {
        console.error('Error fetching admin activities:', error);
        return [];
    }

    if (!users || users.length === 0) {
        return [];
    }

    // 2. 랜킹 부여 (동점 처리 단순화: index 기반)
    let currentRank = 1;
    let prevXp = -1;
    let rankOffset = 0;

    const rankedUsers = users.map((u, index) => {
        if (u.weekly_xp !== prevXp) {
            currentRank = index + 1;
            prevXp = u.weekly_xp;
        }
        return {
            ...u,
            weekly_ranking: u.weekly_xp > 0 ? currentRank : 0 // XP 없으면 랜크 0 (또는 표기 안함)
        };
    });

    // 3. 전체 퀵스팩 개수 (is_active=true 기준)
    const { count: totalQuizpackCount } = await supabase
        .from('quizpacks')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_deleted', false);
    const totalPacks = totalQuizpackCount ?? 0;

    // 4. 사용자별 완료 퀴즈팩 개수 조회 (DISTINCT quizpack_id 기준)
    const userIds = rankedUsers.map((u) => u.id);
    const { data: completedPacksData } = await supabase
        .from('user_quizpacks')
        .select('user_id, quizpack_id')
        .in('user_id', userIds)
        .eq('status', 'completed');

    // user_id별 완료한 DISTINCT quizpack 개수 집계
    const completedPackCountMap: Record<number, number> = {};
    if (completedPacksData) {
        const userPackSet: Record<number, Set<number>> = {};
        for (const row of completedPacksData) {
            if (!userPackSet[row.user_id]) userPackSet[row.user_id] = new Set();
            userPackSet[row.user_id].add(row.quizpack_id);
        }
        for (const [userId, packSet] of Object.entries(userPackSet)) {
            completedPackCountMap[Number(userId)] = packSet.size;
        }
    }
    const { data: loginHistory } = await supabase
        .from('user_login_history')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .eq('action', 'login')
        .order('created_at', { ascending: false });

    const lastLoginMap: Record<number, string> = {};
    if (loginHistory) {
        for (const log of loginHistory) {
            if (!lastLoginMap[log.user_id]) {
                lastLoginMap[log.user_id] = log.created_at || '';
            }
        }
    }

    // 6. 데이터 병합 후 반환
    return rankedUsers.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        title: u.title,
        total_xp: u.total_xp || 0,
        weekly_xp: u.weekly_xp || 0,
        weekly_ranking: u.weekly_ranking,
        total_quiz_attempts: u.total_quiz_attempts || 0,
        total_correct_answers: u.total_correct_answers || 0,
        quizpack_avrg_correct: u.quizpack_avrg_correct || 0,
        weekly_unique_packs_count: u.weekly_unique_packs_count || 0,
        weekly_total_packs_count: u.weekly_total_packs_count || 0,
        quizpack_completion_rate: totalPacks > 0
            ? Math.round((completedPackCountMap[u.id] ?? 0) / totalPacks * 100)
            : 0,
        last_login_at: lastLoginMap[u.id] || null
    }));
}
