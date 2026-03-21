'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFrame, Header } from '@/components/common';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    createDummyLeagueUsers,
    randomizeDummyLeagueScores,
    deleteDummyLeagueUsers,
    forceResetWeeklyLeague
} from '@/lib/api/adminLeague';
import { ArrowLeft, Users, RefreshCw, Trash2, CalendarClock, Trophy } from 'lucide-react';

export default function LeagueTestPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateDummies = async () => {
        setIsLoading(true);
        try {
            await createDummyLeagueUsers();
            toast.success('더미 유저 20명을 성공적으로 생성했습니다.');
        } catch (error: any) {
            toast.error(error.message || '더미 유저 생성 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRandomizeScores = async () => {
        setIsLoading(true);
        try {
            await randomizeDummyLeagueScores();
            toast.success('더미 유저들의 랭킹 데이터가 랜덤 갱신되었습니다.');
        } catch (error: any) {
            toast.error(error.message || '데이터 갱신 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDummies = async () => {
        if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
            const confirmed = window.confirm('정말 삭제하시겠습니까?');
            if (!confirmed) return;
        }

        setIsLoading(true);
        try {
            await deleteDummyLeagueUsers();
            toast.success('더미 유저 목록을 일괄 삭제했습니다.');
        } catch (error: any) {
            toast.error(error.message || '더미 유저 삭제 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceReset = async () => {
        setIsLoading(true);
        try {
            await forceResetWeeklyLeague();
            toast.success('주간 리그 리셋 함수가 실행되었습니다.', {
                description: '이전 주 데이터가 히스토리에 저장되고 주간 데이터가 초기화되었습니다.'
            });
        } catch (error: any) {
            toast.error(error.message || '주간 리그 리셋 실패');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearCookies = () => {
        try {
            // 이번 주 / 지난 주 키 추론 보다는 모든 league_ 팝업 관련 쿠키를 밀어버립니다.
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const cookieName = cookie.split('=')[0].trim();
                window.document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
            toast.success('팝업 노출 쿠키가 모두 삭제되었습니다.', {
                description: '홈으로 돌아가면 종료/시작 팝업이 다시 노출됩니다.'
            });
        } catch (e) {
            toast.error('쿠키 삭제 실패');
        }
    };

    return (
        <MobileFrame className="bg-gray-50 flex flex-col h-full">
            <Header />

            <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">리그 테스트 도구</h1>
                        <p className="text-sm text-gray-500">주간 리그 테스트 전용 관리자 페이지</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 1. 더미 유저 생성 */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Users size={20} />
                            </div>
                            <h2 className="font-semibold text-gray-900">1. 테스트 유저 목록 제어</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 ml-11">
                            is_test=true 인 더미 데이터 20건을 users 테이블에 즉시 생성합니다.
                        </p>
                        <div className="flex flex-col gap-2 ml-11">
                            <Button
                                onClick={handleCreateDummies}
                                disabled={isLoading}
                                className="w-full bg-blue-500 hover:bg-blue-600 font-semibold"
                            >
                                더미 유저 20명 생성
                            </Button>
                            <Button
                                onClick={handleDeleteDummies}
                                disabled={isLoading}
                                variant="outline"
                                className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 font-semibold"
                            >
                                <Trash2 size={16} className="mr-2" />
                                더미 유저 일괄 삭제
                            </Button>
                        </div>
                    </div>

                    {/* 2. 통계 조작 */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <RefreshCw size={20} />
                            </div>
                            <h2 className="font-semibold text-gray-900">2. 테스트 리그 데이터 시뮬레이션</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 ml-11">
                            생성된 더미 유저들의 XP, 완료 수, 정답률 데이터를 무작위로 변경합니다. (동점자 및 정렬 체크용)
                        </p>
                        <div className="ml-11">
                            <Button
                                onClick={handleRandomizeScores}
                                disabled={isLoading}
                                className="w-full bg-purple-500 hover:bg-purple-600 font-semibold"
                            >
                                더미 랭킹 데이터 랜덤 갱신
                            </Button>
                        </div>
                    </div>

                    {/* 3. 리셋/팝업 조작 */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <CalendarClock size={20} />
                            </div>
                            <h2 className="font-semibold text-gray-900">3. 주간 리그 리셋 & 팝업</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 ml-11">
                            pg_cron에 의해 월요일 0시에 실행되는 함수를 수동으로 강제 호출합니다. 쿠키 초기화 후 홈으로 이동하면 팝업을 바로 테스트할 수 있습니다.
                        </p>
                        <div className="flex flex-col gap-2 ml-11">
                            <Button
                                onClick={handleForceReset}
                                disabled={isLoading}
                                className="w-full bg-[#2D2D2D] hover:bg-[#3d3d3d] text-[#FF8400] border border-[#FF8400]/30 font-semibold"
                            >
                                <Trophy size={16} className="mr-2" />
                                주간 리그 강제 리셋 (수동)
                            </Button>
                            <Button
                                onClick={handleClearCookies}
                                disabled={isLoading}
                                variant="outline"
                                className="w-full font-semibold"
                            >
                                리그 노출 쿠키 일괄 삭제
                            </Button>
                        </div>
                    </div>

                </div>
            </main>
        </MobileFrame>
    );
}
