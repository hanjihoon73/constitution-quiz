import {
    Users,
    BookOpen,
    TrendingUp,
    MousePointerClick,
    Star,
    CheckCircle2,
    Trophy,
    Target
} from 'lucide-react';
import { getDashboardStats } from '@/actions/admin/stats';

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">대시보드</h2>
                <p className="text-slate-400 mt-3">실시간 서비스 현황 및 주요 지표를 조회합니다. (Active User = 퀴즈팩 시작 기준, KST)</p>
            </div>

            {/* Row 1: Active User 지표 */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Active User</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* DAU */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{stats.periods.dau}</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">DAU (일간 활성)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.dau.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* WAU */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-violet-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{stats.periods.wauStart} ~ {stats.periods.wauEnd}</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">WAU (주간 활성)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.wau.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* MAU */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{stats.periods.mauStart} ~ {stats.periods.mauEnd}</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">MAU (월간 활성)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.mau.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Stickness */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                                <MousePointerClick className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">DAU ÷ MAU</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Stickness (점착도)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.stickness}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: 퀴즈 품질 지표 */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Quizpack</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 정답률 */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">전체 누적</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">정답률 (전체 평균)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.correctRate}%</h3>
                            <p className="text-xs text-slate-500 mt-1">전체 정답 수 ÷ 전체 퀴즈 수</p>
                        </div>
                    </div>

                    {/* 완료율 */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">대비 MAU</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">완료율 (퀴즈팩)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.completionRate}%</h3>
                            <p className="text-xs text-slate-500 mt-1">완료 사용자 수 ÷ MAU</p>
                        </div>
                    </div>

                    {/* 별점 */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform">
                                <Star className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">퀴즈팩 평균</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">별점 평균</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {stats.avgRating !== null ? `${stats.avgRating} / 5` : '—'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">별점 기록된 퀴즈팩 기준</p>
                        </div>
                    </div>

                    {/* 가장 빠른 사용자 */}
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-rose-500/50 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">최고 진도</span>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">가장 빠른 사용자</p>
                            {stats.fastestUser ? (
                                <>
                                    <h3 className="text-xl font-bold text-white mt-1 truncate">
                                        {stats.fastestUser.nickname}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        ID: {stats.fastestUser.userId} · 퀴즈팩 #{stats.fastestUser.packOrder} 완료
                                    </p>
                                </>
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-500 mt-1">—</h3>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
