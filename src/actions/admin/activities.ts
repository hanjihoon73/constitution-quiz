'use server';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 사용자 활동 로그(XP 획득 등)를 가져옵니다.
 */
export async function getAdminActivityLogs(filters: {
    userId?: number;
    search?: string;
    limit?: number;
} = {}) {
    const supabase = createAdminClient();

    let query = supabase
        .from('user_xp_history')
        .select(`
            *,
            users ( nickname )
        `)
        .order('created_at', { ascending: false });

    if (filters.userId) {
        query = query.eq('user_id', filters.userId);
    }
    
    if (filters.search) {
        // 닉네임 검색은 join된 테이블 필터링이 복잡하므로 
        // id 검색 위주로 처리하거나 별도 로직 구현
        const isNumeric = !isNaN(Number(filters.search));
        if (isNumeric) {
            query = query.eq('user_id', filters.search);
        }
    }

    const { data, error } = await query.limit(filters.limit || 100);

    if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }

    return data || [];
}

/**
 * 서비스 지표 통계를 가져옵니다 (대시보드 차트용 등).
 */
export async function getServiceMetrics() {
    const supabase = createAdminClient();
    
    // 최근 7일간의 날짜별 가입자 수 등 (샘플)
    const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return data || [];
}
