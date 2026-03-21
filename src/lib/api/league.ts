import { createClient } from '@/lib/supabase/client';

export interface WeeklyRankingItem {
    userId: number;
    nickname: string;
    title: string | null;
    titleCode: string | null;
    rank: number;
    weeklyXp: number;
    totalXp: number;
    weeklyUniquePacks: number;
    weeklyTotalPacks: number;
    quizpackAvrgCorrect: number;
    isMe: boolean;
}

/**
 * 주간 랭킹을 실시간으로 조회합니다.
 * - TOP 5 + 내 순위 기준 ±7명을 반환합니다.
 * @param myUserId 현재 로그인한 사용자의 users.id
 */
export async function getWeeklyRanking(myUserId: number): Promise<WeeklyRankingItem[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_weekly_ranking', {
        my_user_id: myUserId,
    });

    if (error) {
        console.error('[getWeeklyRanking] RPC 에러:', error);
        return [];
    }

    return (data || []).map((row: {
        user_id: number;
        nickname: string;
        title: string | null;
        title_code: string | null;
        rank: number;
        weekly_xp: number;
        total_xp: number;
        weekly_unique_packs: number;
        weekly_total_packs: number;
        quizpack_avrg_correct: number;
        is_me: boolean;
    }) => ({
        userId: row.user_id,
        nickname: row.nickname,
        title: row.title,
        titleCode: row.title_code,
        rank: Number(row.rank),
        weeklyXp: row.weekly_xp,
        totalXp: row.total_xp,
        weeklyUniquePacks: row.weekly_unique_packs,
        weeklyTotalPacks: row.weekly_total_packs,
        quizpackAvrgCorrect: Number(row.quizpack_avrg_correct),
        isMe: row.is_me,
    }));
}

/**
 * 사용자가 이번 주 리그에 참여했는지 여부를 확인합니다.
 * - 이번 주 월요일 0시(KST) 이후에 퀴즈팩을 완료한 기록이 있는지 확인합니다.
 * @param userId  users.id
 */
export async function checkLeagueParticipation(userId: number): Promise<boolean> {
    const supabase = createClient();

    // KST 기준 이번 주 월요일 0시 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstNow = new Date(now.getTime() + kstOffset);
    const dayOfWeek = kstNow.getUTCDay(); // 0=일, 1=월 ... 6=토
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(kstNow);
    weekStart.setUTCDate(kstNow.getUTCDate() - daysSinceMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    // KST 0시 → UTC로 변환
    const weekStartUTC = new Date(weekStart.getTime() - kstOffset);

    const { data, error } = await supabase
        .from('user_quizpacks')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('modified_at', weekStartUTC.toISOString())
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[checkLeagueParticipation] 조회 에러:', error);
        return false;
    }

    return !!data;
}

/**
 * 사용자의 지난주 랭킹 히스토리를 조회합니다.
 * (주간 리그 종료 팝업에서 사용)
 */
export async function getLastWeekRanking(userId: number): Promise<{
    rank: number;
    weeklyXp: number;
    weekStartDate: string;
} | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('users_ranking_history')
        .select('rank, weekly_xp, week_start_date')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return {
        rank: data.rank,
        weeklyXp: data.weekly_xp,
        weekStartDate: data.week_start_date,
    };
}
