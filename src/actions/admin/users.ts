'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface UserFilter {
    search?: string;
    provider?: string[];
    role?: string[];
    is_active?: boolean;
    is_test?: boolean;
    sortBy?: 'id' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

/**
 * 사용자 목록을 필터링 및 검색 조건에 맞춰 가져옵니다.
 */
export async function getAdminUsers(filters: UserFilter = {}) {
    const supabase = createAdminClient();
    
    let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

    // 1. 검색 (id 또는 닉네임)
    if (filters.search) {
        const isNumeric = !isNaN(Number(filters.search));
        if (isNumeric) {
            query = query.or(`id.eq.${filters.search},nickname.ilike.%${filters.search}%`);
        } else {
            query = query.ilike('nickname', `%${filters.search}%`);
        }
    }

    // 2. 필터링
    if (filters.provider && filters.provider.length > 0) {
        query = query.in('provider', filters.provider);
    }
    if (filters.role && filters.role.length > 0) {
        query = query.in('role', filters.role);
    }
    if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
    }
    if (filters.is_test !== undefined) {
        query = query.eq('is_test', filters.is_test);
    }

    // 3. 정렬
    const sortBy = filters.sortBy || 'id';
    const sortOrder = filters.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching admin users:', error);
        return { users: [], total: 0 };
    }

    const users = data || [];

    // 4. 마지막 로그인 조회 (user_login_history에서 각 유저별 최근 login action 시각)
    if (users.length > 0) {
        const userIds = users.map((u) => u.id);
        const { data: loginHistory } = await supabase
            .from('user_login_history')
            .select('user_id, created_at')
            .in('user_id', userIds)
            .eq('action', 'login')
            .order('created_at', { ascending: false });

        // 유저별 최근 로그인 시각 맵 생성
        const lastLoginMap: Record<number, string> = {};
        if (loginHistory) {
            for (const log of loginHistory) {
                if (!lastLoginMap[log.user_id]) {
                    lastLoginMap[log.user_id] = log.created_at;
                }
            }
        }

        // 유저 데이터에 병합
        const usersWithLastLogin = users.map((u) => ({
            ...u,
            last_login_at: lastLoginMap[u.id] || null,
        }));

        return { users: usersWithLastLogin, total: count || 0 };
    }

    return { users, total: count || 0 };
}


/**
 * 사용자 정보를 업데이트합니다.
 */
export async function updateAdminUser(userId: number, updateData: {
    nickname?: string;
    title?: string;
    role?: 'user' | 'admin';
    is_active?: boolean;
    is_test?: boolean;
}) {
    const supabase = createAdminClient();

    // 닉네임 중복 체크 (수정하려는 경우에만)
    if (updateData.nickname) {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('nickname', updateData.nickname)
            .neq('id', userId)
            .single();

        if (existingUser) {
            return { success: false, message: '이미 사용 중인 닉네임입니다.' };
        }
    }

    const { error } = await supabase
        .from('users')
        .update({
            ...updateData,
            modified_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user:', error);
        return { success: false, message: '사용자 정보 수정 중 오류가 발생했습니다.' };
    }

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * 타이틀 목록을 가져옵니다 (수정 팝업용).
 */
export async function getXpTitles() {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('total_xp_titles')
        .select('*')
        .order('min_xp', { ascending: true });
    
    return data || [];
}

/**
 * 닉네임 중복 여부를 확인합니다 (실시간 체크용).
 * @param nickname 확인할 닉네임
 * @param excludeUserId 본인 id (중복 체크에서 제외)
 */
export async function checkNicknameDuplicate(nickname: string, excludeUserId: number): Promise<boolean> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', excludeUserId)
        .maybeSingle();

    return !!data; // true = 중복 있음
}

