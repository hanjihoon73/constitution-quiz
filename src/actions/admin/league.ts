'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 새로운 리그를 즉시 생성합니다 (RPC 호출).
 */
export async function createLeague() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_league');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 현재 활성화된 리그를 강제로 종료하고 정산합니다 (RPC 호출).
 */
export async function endLeague() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('end_league');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 승격/강등 정산을 처리합니다 (RPC 호출).
 */
export async function processPromotions() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('process_promotions');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 리그 보상을 지급합니다 (RPC 호출).
 */
export async function distributeRewards() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('distribute_rewards');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 가짜 리그 데이터를 생성합니다 (테스트용).
 */
export async function generateFakeLeagueData() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('generate_fake_league_data');

    if (error) throw error;
    revalidatePath('/admin/league-test');
    return data;
}

/**
 * 현재 리그 상태 정보를 가져옵니다.
 */
export async function getLeagueStatus() {
    const supabase = await createClient();
    
    const { data: currentLeague } = await supabase
        .from('leagues')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();

    const { count: participants } = await supabase
        .from('user_leagues')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', currentLeague?.id || 0);

    return {
        currentLeague,
        participantCount: participants || 0
    };
}
