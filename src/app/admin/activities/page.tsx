import { getAdminActivityLogs } from '@/actions/admin/activities';
import { 
    Activity, 
    Zap, 
    Trophy, 
    Gamepad2,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AdminActivitiesPage() {
    const logs = await getAdminActivityLogs();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">활동 관리</h2>
                <p className="text-slate-400 mt-1">사용자의 XP 획득 및 서비스 이용 로그를 모니터링합니다.</p>
            </div>

            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        최근 XP 획득 내역
                    </h3>
                </div>

                <div className="divide-y divide-slate-800">
                    {logs.map((log) => (
                        <div key={log.id} className="p-6 hover:bg-slate-800/30 transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                                    log.xp > 0 
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                        : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                )}>
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{(log.users as any)?.nickname || '익명'}</span>
                                        <span className="text-xs text-slate-500">ID: {log.user_id}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-0.5">{log.reason || '활동 보상'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className={cn(
                                        "text-lg font-black tracking-tighter",
                                        log.xp > 0 ? "text-emerald-400" : "text-slate-400"
                                    )}>
                                        {log.xp > 0 ? `+${log.xp}` : log.xp} XP
                                    </p>
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 justify-end">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(log.created_at).toLocaleString('ko-KR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {logs.length === 0 && (
                        <div className="py-20 text-center text-slate-500 italic">표시할 활동 로그가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
