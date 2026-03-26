'use server';

import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    
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

    return { users: data || [], total: count || 0 };
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
    const supabase = await createClient();

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
    const supabase = await createClient();
    const { data } = await supabase
        .from('total_xp_titles')
        .select('*')
        .order('min_xp', { ascending: true });
    
    return data || [];
}
