import { createClient } from '@/lib/supabase/client';

/**
 * 더미 리그 유저 20명 일괄 생성 (is_test = true)
 */
export async function createDummyLeagueUsers() {
    const supabase = createClient();
    const { error } = await supabase.rpc('create_dummy_league_users');
    if (error) {
        console.error('[createDummyLeagueUsers] 에러:', error);
        throw error;
    }
}

/**
 * 더미 리그 유저 스코어 랜덤 갱신
 */
export async function randomizeDummyLeagueScores() {
    const supabase = createClient();
    const { error } = await supabase.rpc('randomize_dummy_league_scores');
    if (error) {
        console.error('[randomizeDummyLeagueScores] 에러:', error);
        throw error;
    }
}

/**
 * 더미 리그 유저 일괄 삭제
 */
export async function deleteDummyLeagueUsers() {
    const supabase = createClient();
    const { error } = await supabase.rpc('delete_dummy_league_users');
    if (error) {
        console.error('[deleteDummyLeagueUsers] 에러:', error);
        throw error;
    }
}

/**
 * 주간 리그 강제 리셋 (pg_cron 로직 동일)
 */
export async function forceResetWeeklyLeague() {
    const supabase = createClient();
    const { error } = await supabase.rpc('reset_weekly_league');
    if (error) {
        console.error('[forceResetWeeklyLeague] 에러:', error);
        throw error;
    }
}
