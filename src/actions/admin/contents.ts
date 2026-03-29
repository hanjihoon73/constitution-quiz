'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * 퀴즈팩 목록을 가져옵니다 (순서 정보 포함).
 */
export async function getAdminQuizpacks() {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
        .from('quizpacks')
        .select(`
            *,
            quizpack_loadmap (pack_order),
            quizpack_statistics (average_rating)
        `)
        .eq('is_deleted', false)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching quizpacks:', error);
        return [];
    }

    // 순서 정보로 정렬
    return data.sort((a, b) => 
        (a.quizpack_loadmap?.pack_order || 999) - (b.quizpack_loadmap?.pack_order || 999)
    );
}

/**
 * 특정 퀴즈팩에 속한 퀴즈 목록을 가져옵니다.
 */
export async function getAdminQuizzes(quizpackId: number) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quizpack_id', quizpackId)
        .eq('is_deleted', false)
        .order('quiz_order', { ascending: true });

    if (error) {
        console.error('Error fetching quizzes:', error);
        return [];
    }
    return data;
}

/**
 * 퀴즈팩 정보를 업데이트합니다.
 */
export async function updateQuizpack(id: number, data: {
    quiz_count_all?: number;
    quiz_max?: number;
    keywords?: string;
    is_active?: boolean;
}) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('quizpacks')
        .update({
            ...data,
            modified_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/contents');
}

/**
 * 퀴즈팩 노출 순서를 변경합니다.
 */
export async function updateQuizpackOrder(orders: { id: number; order: number }[]) {
    const supabase = createAdminClient();
    
    const updates = orders.map(item => ({
        quizpack_id: item.id,
        pack_order: item.order
    }));

    const { error } = await supabase
        .from('quizpack_loadmap')
        .upsert(updates, { onConflict: 'quizpack_id' });

    if (error) throw error;
    revalidatePath('/admin/contents');
}

/**
 * 퀴즈 상세 정보를 업데이트합니다.
 */
export async function updateQuiz(id: number, data: any) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('quizzes')
        .update({
            ...data,
            modified_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/contents');
}

/**
 * 퀴즈 보기(Choices)를 업데이트합니다.
 */
export async function updateQuizChoices(quizId: number, choices: any[]) {
    const supabase = createAdminClient();
    
    // 기존 보기 삭제 후 재삽입 (단순화된 방식)
    const { error: deleteError } = await supabase
        .from('quiz_choices')
        .delete()
        .eq('quiz_id', quizId);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
        .from('quiz_choices')
        .insert(choices.map(c => ({ ...c, quiz_id: quizId })));

    if (insertError) throw insertError;
    revalidatePath('/admin/contents');
}
