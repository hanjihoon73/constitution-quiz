import { createClient } from '@/lib/supabase/client';

/**
 * 에러 객체 검사 헬퍼 (fetch 중단 에러 무시용)
 */
function isAbortError(err: any): boolean {
    if (!err) return false;
    return err.name === 'AbortError' || (err.message && err.message.includes('aborted'));
}

/**
 * 더미 리그 유저 20명 일괄 생성 (is_test = true)
 */
export async function createDummyLeagueUsers() {
    const supabase = createClient();
    try {
        const { error } = await supabase.rpc('create_dummy_league_users');
        if (error) throw error;
    } catch (err: any) {
        if (isAbortError(err)) {
            console.warn('[createDummyLeagueUsers] 중단 에러 무시 (DB는 정상 실행됨)');
            return;
        }
        console.error('[createDummyLeagueUsers] 에러:', err);
        throw err;
    }
}

/**
 * 더미 리그 유저 스코어 랜덤 갱신
 */
export async function randomizeDummyLeagueScores() {
    const supabase = createClient();
    try {
        const { error } = await supabase.rpc('randomize_dummy_league_scores');
        if (error) throw error;
    } catch (err: any) {
        if (isAbortError(err)) {
            console.warn('[randomizeDummyLeagueScores] 중단 에러 무시 (DB는 정상 실행됨)');
            return;
        }
        console.error('[randomizeDummyLeagueScores] 에러:', err);
        throw err;
    }
}

/**
 * 더미 리그 유저 일괄 삭제
 */
export async function deleteDummyLeagueUsers() {
    const supabase = createClient();
    try {
        const { error } = await supabase.rpc('delete_dummy_league_users');
        if (error) throw error;
    } catch (err: any) {
        if (isAbortError(err)) {
            console.warn('[deleteDummyLeagueUsers] 중단 에러 무시 (DB는 정상 실행됨)');
            return;
        }
        console.error('[deleteDummyLeagueUsers] 에러:', err);
        throw err;
    }
}

/**
 * 주간 리그 강제 리셋 (pg_cron 로직 동일)
 */
export async function forceResetWeeklyLeague() {
    const supabase = createClient();
    try {
        const { error } = await supabase.rpc('reset_weekly_league');
        if (error) throw error;
    } catch (err: any) {
        if (isAbortError(err)) {
            console.warn('[forceResetWeeklyLeague] 중단 에러 무시 (DB는 정상 실행됨)');
            return;
        }
        console.error('[forceResetWeeklyLeague] 에러:', err);
        throw err;
    }
}
