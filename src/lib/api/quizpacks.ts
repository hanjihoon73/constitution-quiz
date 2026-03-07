import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type QuizpackStatus = Database['public']['Enums']['quizpack_status'];

export interface QuizpackWithStatus {
    id: number;
    order: number;
    keywords: string;
    quizCount: number;
    status: QuizpackStatus;
    userCorrectRate: number | null;
    averageRating: number | null;
    currentQuizOrder: number | null;
    totalQuizCount: number;
    solvedQuizCount: number | null;
    pendingXp: number | null;
    earnedXp: number | null;
}

/**
 * 사용자의 퀴즈팩 목록을 조회합니다.
 * - quizpack_loadmap 순서대로 정렬
 * - 사용자의 진행 상태 포함
 * - 평균 별점 포함
 */
export async function getQuizpacksWithStatus(userId: number): Promise<QuizpackWithStatus[]> {
    const supabase = createClient();

    // 1. quizpack_loadmap + quizpacks 조인하여 순서대로 조회
    const { data: loadmapData, error: loadmapError } = await supabase
        .from('quizpack_loadmap')
        .select(`
            pack_order,
            quizpack_id,
            quizpacks!inner (
                id,
                keywords,
                quiz_count_all,
                is_active
            )
        `)
        .order('pack_order', { ascending: true });

    if (loadmapError) {
        console.error('퀴즈팩 목록 조회 에러:', loadmapError);
        throw loadmapError;
    }

    // 2. user_quizpacks에서 사용자 진행 상태 조회
    const { data: userProgress, error: progressError } = await supabase
        .from('user_quizpacks')
        .select('*')
        .eq('user_id', userId);

    if (progressError) {
        console.error('사용자 진행 상태 조회 에러:', progressError);
        throw progressError;
    }

    // 3. quizpack_statistics에서 평균 별점 조회
    const { data: statistics, error: statsError } = await supabase
        .from('quizpack_statistics')
        .select('quizpack_id, average_rating');

    if (statsError) {
        console.error('퀴즈팩 통계 조회 에러:', statsError);
        throw statsError;
    }

    // 4. 데이터 병합
    const quizpacks: QuizpackWithStatus[] = (loadmapData || []).map((item, index) => {
        const quizpack = item.quizpacks as unknown as {
            id: number;
            keywords: string;
            quiz_count_all: number;
            is_active: boolean;
        };

        const userQuizpack = userProgress?.find(
            (p) => p.quizpack_id === quizpack.id
        );

        const stats = statistics?.find(
            (s) => s.quizpack_id === quizpack.id
        );

        // 상태 결정 로직
        let status: QuizpackStatus = 'closed';

        if (userQuizpack) {
            // 사용자 진행 기록이 있는 경우
            status = userQuizpack.status || 'opened';
        } else if (index === 0) {
            // 첫 번째 퀴즈팩은 항상 열림
            status = 'opened';
        } else {
            // 이전 퀴즈팩 완료 여부 확인
            // 현재 completed이거나, 한 번이라도 완료한 적 있으면(completed_at 존재) opened로 표시
            // → 다시풀기로 in_progress가 되어도 후속 퀴즈팩은 opened 유지
            const prevQuizpackId = (loadmapData[index - 1]?.quizpacks as unknown as { id: number })?.id;
            const prevUserQuizpack = userProgress?.find(
                (p) => p.quizpack_id === prevQuizpackId
            );

            if (prevUserQuizpack?.status === 'completed' || prevUserQuizpack?.completed_at) {
                status = 'opened';
            }
        }

        return {
            id: quizpack.id,
            order: item.pack_order,
            keywords: quizpack.keywords || '',
            quizCount: quizpack.quiz_count_all || 0,
            status,
            userCorrectRate: userQuizpack?.correct_rate || null,
            averageRating: stats?.average_rating || null,
            currentQuizOrder: userQuizpack?.current_quiz_order || null,
            totalQuizCount: userQuizpack?.total_quiz_count || quizpack.quiz_count_all || 0,
            solvedQuizCount: userQuizpack?.solved_quiz_count || null,
            pendingXp: userQuizpack?.pending_xp || 0,
            earnedXp: userQuizpack?.earned_xp || 0,
        };
    });

    return quizpacks;
}
