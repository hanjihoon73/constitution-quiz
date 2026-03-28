import { createClient } from '@supabase/supabase-js';

/**
 * 어드민 전용 Supabase 클라이언트.
 * service_role 키를 사용하여 RLS 정책을 우회합니다.
 * 반드시 서버 사이드(Server Actions, API Routes)에서만 사용하세요.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error('Supabase Admin 환경변수가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
}
