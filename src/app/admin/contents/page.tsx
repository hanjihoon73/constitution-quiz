import { getAdminQuizpacks } from '@/actions/admin/contents';
import { ContentsClient } from './contents-client';

export default async function AdminContentsPage() {
    const quizpacks = await getAdminQuizpacks();

    return (
        <div className="h-full flex flex-col gap-6 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 고정 영역: 타이틀 */}
            <div className="shrink-0">
                <h2 className="text-3xl font-bold text-white tracking-tight">콘텐츠 관리</h2>
                <p className="text-slate-400 mt-1">퀴즈팩 정보와 하위 퀴즈 구성을 관리합니다.</p>
            </div>

            <ContentsClient quizpacks={quizpacks} />
        </div>
    );
}
