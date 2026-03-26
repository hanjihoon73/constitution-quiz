'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfDay, subDays, format } from 'date-fns';

/**
 * KST(한국 표준시) 기준으로 날짜 범위를 계산하여 대시보드 통계를 가져옵니다.
 */
export async function getDashboardStats() {
    const supabase = await createClient();

    // 1. 현재 시각 기준 KST 날짜 설정 (서버 타임존이 UTC일 경우 대비)
    // +9시간을 더해 KST로 변환 후 00:00:00 구함
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const todayKstStart = startOfDay(kstNow);
    const todayKstStartISO = new Date(todayKstStart.getTime() - (9 * 60 * 60 * 1000)).toISOString();
    
    const sevenDaysAgo = subDays(todayKstStart, 6);
    const sevenDaysAgoISO = new Date(sevenDaysAgo.getTime() - (9 * 60 * 60 * 1000)).toISOString();
    
    const thirtyDaysAgo = subDays(todayKstStart, 29);
    const thirtyDaysAgoISO = new Date(thirtyDaysAgo.getTime() - (9 * 60 * 60 * 1000)).toISOString();

    try {
        // DAU (Daily Active Users)
        const { count: dau } = await supabase
            .from('user_login_history')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', todayKstStartISO);

        // WAU (Weekly Active Users)
        const { count: wau } = await supabase
            .from('user_login_history')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgoISO);

        // MAU (Monthly Active Users)
        const { count: mau } = await supabase
            .from('user_login_history')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgoISO);

        // 퀴즈 정답률 (공통 필드에서 평균 계산)
        const { data: correctRateData } = await supabase
            .from('users')
            .select('quizpack_avrg_correct')
            .filter('quizpack_avrg_correct', 'gt', 0);
        
        const avgCorrectRate = correctRateData && correctRateData.length > 0
            ? correctRateData.reduce((acc, cur) => acc + (cur.quizpack_avrg_correct || 0), 0) / correctRateData.length
            : 0;

        // Stickness = (DAU ÷ MAU) x 100
        const stickness = mau && mau > 0 ? (Number(dau) / Number(mau)) * 100 : 0;

        return {
            dau: dau || 0,
            wau: wau || 0,
            mau: mau || 0,
            stickness: stickness.toFixed(2),
            avgCorrectRate: avgCorrectRate.toFixed(1)
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            dau: 0, wau: 0, mau: 0, stickness: "0.00", avgCorrectRate: "0.0"
        };
    }
}
