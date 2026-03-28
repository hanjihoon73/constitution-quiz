'use client';

import { useState } from 'react';
import {
    Users,
    Trash2,
    Calendar,
    Cookie,
    AlertCircle,
    Dices
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    createDummyLeagueUsers,
    deleteDummyLeagueUsers,
    randomizeDummyLeagueScores,
    resetWeeklyLeague
} from '@/actions/admin/league';
import { toast } from 'sonner';

export default function LeagueTestPage() {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (actionName: string, actionFn: () => Promise<any>, successMsg: string) => {
        if (!confirm(`${actionName} 작업을 진행하시겠습니까?`)) return;

        setActionLoading(actionName);
        try {
            await actionFn();
            toast.success(successMsg);
        } catch (error: any) {
            toast.error(`${actionName} 오류: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const clearPopupCookies = () => {
        if (!confirm('설정된 모든 팝업(노출안함) 관련 브라우저 쿠키를 삭제하시겠습니까?')) return;

        try {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
            toast.success('팝업 노출 쿠키가 모두 삭제되었습니다.');
        } catch (error: any) {
            toast.error('쿠키 삭제 실패: ' + error.message);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">리그 테스트</h2>
                <p className="text-slate-400 mt-1">주간 리그 테스트 전용 페이지</p>
                <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 mt-6 w-fit">
                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                        개발 및 테스트 전용 페이지입니다. 운영 환경에서 사용하는 경우 실제 사용자 데이터에 영향을 줄 수 있으니 주의해 주세요.
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Dummy Users */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 w-fit rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">1. 테스트 유저 관리</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">테스트용 더미 유저를 즉시 생성(100명)하거나 일괄 삭제합니다.</p>
                    </div>
                    <div className="space-y-2 pt-2">
                        <Button
                            onClick={() => handleAction('더미 유저 생성', createDummyLeagueUsers, '더미 유저를 성공적으로 생성했습니다.')}
                            disabled={!!actionLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                            {actionLoading === '더미 유저 생성' ? '생성 중...' : '더미 유저 일괄 생성'}
                        </Button>
                        <Button
                            onClick={() => handleAction('더미 유저 일괄 삭제', deleteDummyLeagueUsers, '더미 유저 목록을 일괄 삭제했습니다.')}
                            disabled={!!actionLoading}
                            variant="outline"
                            className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {actionLoading === '더미 유저 일괄 삭제' ? '삭제 중...' : '더미 유저 일괄 삭제'}
                        </Button>
                    </div>
                </div>

                {/* 2. 통계 조작 */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 w-fit rounded-xl">
                        <Dices size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">2. 랭킹 데이터 시뮬레이션</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">생성된 더미 유저들의 리그 관련 데이터를 무작위로 생성합니다.</p>
                    </div>
                    <div className="pt-2 mt-auto">
                        <Button
                            onClick={() => handleAction('더미 랭킹 데이터 랜덤 갱신', randomizeDummyLeagueScores, '더미 유저들의 랭킹 데이터가 랜덤 갱신되었습니다.')}
                            disabled={!!actionLoading}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
                        >
                            {actionLoading === '더미 랭킹 데이터 랜덤 갱신' ? '갱신 중...' : '데이터 랜덤 갱신'}
                        </Button>
                    </div>
                </div>

                {/* 3. 주간 리그 리셋 매크로 */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 w-fit rounded-xl">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">3. 주간 리그 리셋</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">월요일 0시에 자동 실행되는 주간 리그 리셋을 수동 실행합니다.</p>
                    </div>
                    <div className="pt-2 mt-auto">
                        <Button
                            onClick={() => handleAction('주간 리그 리셋', resetWeeklyLeague, '주간 리그 리셋이 완료되었습니다.')}
                            disabled={!!actionLoading}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold"
                        >
                            {actionLoading === '주간 리그 강제 리셋' ? '리셋 중...' : '주간 리그 강제 리셋'}
                        </Button>
                    </div>
                </div>

                {/* 4. 쿠키 초기화 */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="p-3 bg-slate-500/10 text-slate-400 w-fit rounded-xl">
                        <Cookie size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">4. 리그 팝업 쿠키 초기화</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">리그 종료/시작 안내 팝업 쿠키를 브라우저에서 모두 삭제합니다.</p>
                    </div>
                    <div className="pt-2 mt-auto">
                        <Button
                            onClick={clearPopupCookies}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold"
                        >
                            팝업 쿠키 삭제
                        </Button>
                    </div>
                </div>

            </div>

        </div>
    );
}
