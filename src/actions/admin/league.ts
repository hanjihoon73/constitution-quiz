'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * [Phase 1] test-league.html 복원을 위한 원형 매크로 RPC 액션 포팅
 */

/**
 * 가짜(더미) 주간 리그 참가 유저들을 생성합니다.
 */
export async function createDummyLeagueUsers() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('create_dummy_league_users');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 가짜(더미) 주간 리그 참가 유저들을 일괄 삭제합니다.
 */
export async function deleteDummyLeagueUsers() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('delete_dummy_league_users');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 더미 랭킹 데이터를 임의로 뒤섞고 무작위 갱신합니다.
 */
export async function randomizeDummyLeagueScores() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('randomize_dummy_league_scores');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 주간 리그(정산 및 다음 주차 생성)를 강제 리셋합니다.
 */
export async function resetWeeklyLeague() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('reset_weekly_league');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * (유지) 현재 활성화된 리그의 상태 정보를 조회합니다.
 */
export async function getLeagueStatus() {
    const supabase = createAdminClient();
    
    // 현재 active 상태인 리그를 하나 가져옴
    const { data: currentLeague } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

    // 가져온 리그 ID를 바탕으로 참가자 수를 구함
    const { count: participants } = await supabase
        .from('user_leagues')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', currentLeague?.id || 0);

    return {
        currentLeague,
        participantCount: participants || 0
    };
}
