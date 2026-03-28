'use server';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 퀴즈에 대한 모든 정보(보기 포함)를 가져옵니다.
 */
export async function getQuizDetail(quizId: number) {
    const supabase = createAdminClient();
    
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (quizError) throw quizError;

    const { data: choices, error: choicesError } = await supabase
        .from('quiz_choices')
        .select('*')
        .eq('quiz_id', quizId)
        .order('choice_order', { ascending: true });

    if (choicesError) throw choicesError;

    return { ...quiz, choices };
}
