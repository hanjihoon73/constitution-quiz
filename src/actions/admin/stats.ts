'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { startOfDay, subDays, format } from 'date-fns';

/** Date → YY.MM.DD 포맷 */
function fmt(d: Date): string {
    return format(d, 'yy.MM.dd');
}

/**
 * KST(한국 표준시) 기준으로 날짜 범위를 계산하여 대시보드 통계를 가져옵니다.
 * Active User 정의: 해당 기간 중 퀴즈팩을 시작(opened/in_progress/completed)한 DISTINCT 사용자
 */
export async function getDashboardStats() {
    const supabase = createAdminClient();

    // KST 기준 날짜 계산 (서버가 UTC인 경우 대비 +9h 적용)
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    const todayKstStart = startOfDay(kstNow);
    const todayKstStartISO = new Date(todayKstStart.getTime() - 9 * 60 * 60 * 1000).toISOString();

    const sevenDaysAgo = subDays(todayKstStart, 6);
    const sevenDaysAgoISO = new Date(sevenDaysAgo.getTime() - 9 * 60 * 60 * 1000).toISOString();

    const thirtyDaysAgo = subDays(todayKstStart, 29);
    const thirtyDaysAgoISO = new Date(thirtyDaysAgo.getTime() - 9 * 60 * 60 * 1000).toISOString();

    try {
        // ── Active User: 퀴즈팩을 시작한 DISTINCT 사용자 (user_quizpacks.started_at 기준) ──

        // DAU (Daily Active Users) - 오늘 퀴즈팩을 시작한 사용자
        const { data: dauData } = await supabase
            .from('user_quizpacks')
            .select('user_id')
            .gte('started_at', todayKstStartISO);
        const dau = new Set(dauData?.map(r => r.user_id) ?? []).size;

        // WAU (Weekly Active Users) - 최근 7일 퀴즈팩을 시작한 사용자
        const { data: wauData } = await supabase
            .from('user_quizpacks')
            .select('user_id')
            .gte('started_at', sevenDaysAgoISO);
        const wau = new Set(wauData?.map(r => r.user_id) ?? []).size;

        // MAU (Monthly Active Users) - 최근 30일 퀴즈팩을 시작한 사용자
        const { data: mauData } = await supabase
            .from('user_quizpacks')
            .select('user_id')
            .gte('started_at', thirtyDaysAgoISO);
        const mau = new Set(mauData?.map(r => r.user_id) ?? []).size;

        // Stickness = (DAU ÷ MAU) x 100
        const stickness = mau > 0 ? (dau / mau) * 100 : 0;

        // ── 정답률 = (전체 정답 수 ÷ 전체 퀴즈 수) x 100 (quizpack_statistics 합산) ──
        const { data: statData } = await supabase
            .from('quizpack_statistics')
            .select('total_correct_count, total_quiz_count');

        const totalCorrect = statData?.reduce((acc, r) => acc + (r.total_correct_count ?? 0), 0) ?? 0;
        const totalQuiz = statData?.reduce((acc, r) => acc + (r.total_quiz_count ?? 0), 0) ?? 0;
        const correctRate = totalQuiz > 0 ? (totalCorrect / totalQuiz) * 100 : 0;

        // ── 완료율 = (퀴즈팩 완료 사용자 수 ÷ MAU Active User) x 100 ──
        const { data: completedData } = await supabase
            .from('user_quizpacks')
            .select('user_id')
            .eq('status', 'completed');
        const completedUserCount = new Set(completedData?.map(r => r.user_id) ?? []).size;
        const completionRate = mau > 0 ? (completedUserCount / mau) * 100 : 0;

        // ── 가장 빠른 사용자: completed 퀴즈팩의 pack_order(quizpack_loadmap)가 가장 큰 사용자 ──
        // Step 1: completed 상태인 user_quizpacks와 loadmap을 조인하여 최고 pack_order 가진 레코드 추출
        const { data: completedPacks } = await supabase
            .from('user_quizpacks')
            .select('user_id, quizpack_id')
            .eq('status', 'completed');

        let fastestUser: { userId: number; nickname: string; packOrder: number } | null = null;

        if (completedPacks && completedPacks.length > 0) {
            // Step 2: quizpack_loadmap에서 pack_order 조회
            const quizpackIds = [...new Set(completedPacks.map(r => r.quizpack_id))];
            const { data: loadmapData } = await supabase
                .from('quizpack_loadmap')
                .select('quizpack_id, pack_order')
                .in('quizpack_id', quizpackIds);

            if (loadmapData && loadmapData.length > 0) {
                // pack_order 매핑
                const packOrderMap = new Map(loadmapData.map(r => [r.quizpack_id, r.pack_order]));

                // 사용자별 최대 pack_order 계산
                const userMaxPackOrder = new Map<number, number>();
                for (const pack of completedPacks) {
                    const order = packOrderMap.get(pack.quizpack_id) ?? 0;
                    const current = userMaxPackOrder.get(pack.user_id) ?? 0;
                    if (order > current) userMaxPackOrder.set(pack.user_id, order);
                }

                // 가장 높은 pack_order를 가진 user_id 추출
                let topUserId = 0;
                let topPackOrder = 0;
                for (const [userId, order] of userMaxPackOrder.entries()) {
                    if (order > topPackOrder) {
                        topPackOrder = order;
                        topUserId = userId;
                    }
                }

                // Step 3: 해당 user의 nickname 조회
                if (topUserId > 0) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('nickname')
                        .eq('id', topUserId)
                        .single();

                    if (userData) {
                        fastestUser = {
                            userId: topUserId,
                            nickname: userData.nickname,
                            packOrder: topPackOrder,
                        };
                    }
                }
            }
        }

        // ── 별점 평균 = quizpack_statistics.average_rating이 있는 퀴즈팩의 평균 ──
        const { data: ratingData } = await supabase
            .from('quizpack_statistics')
            .select('average_rating')
            .not('average_rating', 'is', null);

        const avgRating = ratingData && ratingData.length > 0
            ? ratingData.reduce((acc, r) => acc + (r.average_rating ?? 0), 0) / ratingData.length
            : null;

        return {
            dau,
            wau,
            mau,
            stickness: stickness.toFixed(1),
            correctRate: correctRate.toFixed(1),
            completionRate: completionRate.toFixed(1),
            fastestUser,
            avgRating: avgRating !== null ? avgRating.toFixed(1) : null,
            periods: {
                dau: fmt(todayKstStart),
                wauStart: fmt(sevenDaysAgo),
                wauEnd: fmt(todayKstStart),
                mauStart: fmt(thirtyDaysAgo),
                mauEnd: fmt(todayKstStart),
            },
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            dau: 0,
            wau: 0,
            mau: 0,
            stickness: '0.0',
            correctRate: '0.0',
            completionRate: '0.0',
            fastestUser: null,
            avgRating: null,
            periods: { dau: '', wauStart: '', wauEnd: '', mauStart: '', mauEnd: '' },
        };
    }
}
