'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuizpackWithStatus, getQuizpacksWithStatus } from '@/lib/api/quizpacks';
import { useAuth } from '@/components/auth';

interface UseQuizpacksReturn {
    quizpacks: QuizpackWithStatus[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * 퀴즈팩 목록을 가져오는 커스텀 훅
 */
export function useQuizpacks(): UseQuizpacksReturn {
    const { user, dbUser, isLoading: authLoading, isDbUserLoaded } = useAuth();
    const [quizpacks, setQuizpacks] = useState<QuizpackWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // user는 있으나 아직 dbUser를 가져오는 중인 상태 (최초 조회 대기)
    const isDbUserLoading = !!user && !isDbUserLoaded;

    const fetchQuizpacks = useCallback(async () => {
        // 인증 로딩 중이거나 DB 사용자 로딩 중이면 대기
        if (authLoading || isDbUserLoading) {
            return;
        }

        // dbUser가 없으면 빈 목록 반환 (비로그인 상태)
        if (!dbUser?.id) {
            setQuizpacks([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getQuizpacksWithStatus(dbUser.id);
            setQuizpacks(data);
        } catch (err: any) {
            // 페이지 전환/새로고침 시 Next.js가 정상적으로 중단시키는 fetch → 조용히 무시
            if (err?.name === 'AbortError') return;
            console.error('퀴즈팩 조회 에러:', err);
            setError(err instanceof Error ? err : new Error('퀴즈팩을 불러오는데 실패했습니다.'));
        } finally {
            setIsLoading(false);
        }
    }, [dbUser?.id, authLoading, isDbUserLoading]);

    useEffect(() => {
        fetchQuizpacks();
    }, [fetchQuizpacks]);

    return {
        quizpacks,
        isLoading: authLoading || isDbUserLoading || isLoading,
        error,
        refetch: fetchQuizpacks,
    };
}
