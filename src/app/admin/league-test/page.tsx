'use client';

import { useState, useEffect } from 'react';
import { 
    Play, 
    Square, 
    RefreshCcw, 
    Trophy, 
    Users,
    Zap,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    createLeague, 
    endLeague, 
    processPromotions, 
    distributeRewards,
    generateFakeLeagueData,
    getLeagueStatus
} from '@/actions/admin/league';
import { toast } from 'sonner';

export default function LeagueTestPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await getLeagueStatus();
            setStatus(data);
        } catch (error) {
            toast.error('리그 상태를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
        if (!confirm(`${actionName} 작업을 진행하시겠습니까?`)) return;
        
        setActionLoading(actionName);
        try {
            await actionFn();
            toast.success(`${actionName} 작업이 완료되었습니다.`);
            loadStatus();
        } catch (error: any) {
            toast.error(`${actionName} 오류: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">리그 테스트 제어판</h2>
                <p className="text-slate-400 mt-1">리그 생명주기(생성/종료/보상)를 강제로 제어하고 테스트합니다.</p>
            </div>

            {/* Current Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-8 flex flex-col md:flex-row gap-8 items-center justify-between bg-indigo-600/5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">
                                {status?.currentLeague ? `제 ${status.currentLeague.id}회 리그` : '진행 중인 리그 없음'}
                            </h3>
                            <p className="text-slate-400 flex items-center gap-2 mt-1">
                                <Users className="w-4 h-4" />
                                <span>현재 참가자: <strong>{status?.participantCount || 0}</strong>명</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline" 
                            onClick={loadStatus}
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                        >
                            <RefreshCcw className={status?.loading ? "animate-spin" : ""} size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create League */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 w-fit rounded-xl">
                        <Play size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">리그 생성</h4>
                        <p className="text-sm text-slate-500 mt-1">새로운 리그를 즉시 시작합니다. (RPC: create_league)</p>
                    </div>
                    <Button 
                        onClick={() => handleAction('리그 생성', createLeague)}
                        disabled={!!actionLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                        {actionLoading === '리그 생성' ? '처리 중...' : '즉시 생성'}
                    </Button>
                </div>

                {/* End League */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-rose-500/10 text-rose-500 w-fit rounded-xl">
                        <Square size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">리그 종료</h4>
                        <p className="text-sm text-slate-500 mt-1">현재 활성화된 리그를 강제 종료합니다. (RPC: end_league)</p>
                    </div>
                    <Button 
                        onClick={() => handleAction('리그 종료', endLeague)}
                        disabled={!!actionLoading}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                        {actionLoading === '리그 종료' ? '처리 중...' : '강제 종료'}
                    </Button>
                </div>

                {/* Rewards */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 w-fit rounded-xl">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">보상 지급</h4>
                        <p className="text-sm text-slate-500 mt-1">종료된 리그의 보상을 유저들에게 지급합니다.</p>
                    </div>
                    <Button 
                        onClick={() => handleAction('보상 지급', distributeRewards)}
                        disabled={!!actionLoading}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                        {actionLoading === '보상 지급' ? '처리 중...' : '지급 실행'}
                    </Button>
                </div>

                {/* Fake Data */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 w-fit rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">테스트 데이터 생성</h4>
                        <p className="text-sm text-slate-500 mt-1">가짜 유저들의 리그 활동 데이터를 생성합니다.</p>
                    </div>
                    <Button 
                        onClick={() => handleAction('데이터 생성', generateFakeLeagueData)}
                        disabled={!!actionLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    >
                        {actionLoading === '데이터 생성' ? '처리 중...' : '데이터 생성'}
                    </Button>
                </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 w-6 h-6" />
                <div className="text-sm">
                    <h5 className="font-bold text-amber-500">주의사항</h5>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                        이 제어판은 개발 및 테스트 전용입니다. 실제 운영 환경에서 리그를 임의로 종료하면 유저들의 정산 데이터가 꼬일 수 있으므로 정기 검사 시에만 활용하시기 바랍니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
