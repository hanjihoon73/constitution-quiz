import { ActivityStat } from '@/actions/admin/activities';

// 날짜 포맷 유틸
function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

export function ActivityTableRow({ activity }: { activity: ActivityStat }) {
    return (
        <tr className="hover:bg-slate-800/30 transition-colors group text-sm">
            {/* ID */}
            <td className="px-4 py-3.5">
                <span className="font-mono text-slate-400 text-xs">{activity.id}</span>
            </td>

            {/* 닉네임 */}
            <td className="px-4 py-3.5">
                <span className="font-semibold text-white">{activity.nickname || '익명'}</span>
            </td>

            {/* 타이틀 */}
            <td className="px-4 py-3.5">
                <span className="text-xs text-slate-400">{activity.title || '-'}</span>
            </td>

            {/* 누적 XP */}
            <td className="px-4 py-3.5 text-right font-mono">
                <span className="text-emerald-400 font-bold">{activity.total_xp.toLocaleString()}</span>
            </td>

            {/* 주간 XP */}
            <td className="px-4 py-3.5 text-right font-mono">
                <span className="text-sky-400 font-bold">{activity.weekly_xp.toLocaleString()}</span>
            </td>

            {/* 주간 랭킹 */}
            <td className="px-4 py-3.5 text-right font-mono">
                {activity.weekly_ranking > 0 ? (
                    <span className="text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2 py-0.5 rounded">
                        {activity.weekly_ranking}위
                    </span>
                ) : (
                    <span className="text-slate-600 text-xs">-</span>
                )}
            </td>

            {/* 퀴즈 개수 */}
            <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                {activity.total_quiz_attempts.toLocaleString()}
            </td>

            {/* 정답 개수 */}
            <td className="px-4 py-3.5 text-right font-mono text-emerald-400/80">
                {activity.total_correct_answers.toLocaleString()}
            </td>

            {/* 평균 정답률 */}
            <td className="px-4 py-3.5 text-right font-mono text-white">
                {activity.quizpack_avrg_correct.toFixed(1)}%
            </td>

            {/* 주간 완료 개수/횟수 */}
            <td className="px-4 py-3.5 text-right font-mono">
                <span className="text-slate-300">{activity.weekly_unique_packs_count}개 </span> 
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-slate-400">{activity.weekly_total_packs_count}회</span>
            </td>

            {/* 퀴즈팩 완료율 */}
            <td className="px-4 py-3.5 text-right font-mono">
                <span className={
                    activity.quizpack_completion_rate >= 50
                        ? 'text-emerald-400 font-bold'
                        : activity.quizpack_completion_rate > 0
                            ? 'text-sky-400 font-bold'
                            : 'text-slate-600'
                }>
                    {activity.quizpack_completion_rate}%
                </span>
            </td>

            {/* 마지막 로그인 */}
            <td className="px-4 py-3.5 text-right">
                <span className="text-xs text-slate-400 tabular-nums">{formatDateTime(activity.last_login_at)}</span>
            </td>
        </tr>
    );
}
