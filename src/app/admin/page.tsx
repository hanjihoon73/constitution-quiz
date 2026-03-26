import { 
    Users, 
    BookOpen, 
    TrendingUp, 
    MousePointerClick,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { getDashboardStats } from '@/actions/admin/stats';

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">대시보드</h2>
                <p className="text-slate-400 mt-1">실시간 서비스 현황 및 주요 지표를 확인합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* DAU Card */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>12%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">DAU (일간 활성 사용자)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.dau.toLocaleString()}</h3>
                    </div>
                </div>

                {/* MAU Card */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>8%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">MAU (월간 활성 사용자)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.mau.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Stickness Card */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                            <MousePointerClick className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-rose-400 text-sm font-medium">
                            <ArrowDownRight className="w-4 h-4" />
                            <span>2%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Stickness (점착도)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.stickness}%</h3>
                    </div>
                </div>

                {/* Quiz Success Card */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>5%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">퀴즈 정답률 (평균)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.avgCorrectRate}%</h3>
                    </div>
                </div>
            </div>

            {/* Placeholder for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-slate-900/50 rounded-3xl border border-slate-800 flex items-center justify-center">
                    <p className="text-slate-500">차트 준비 중 (사용자 유입 경로)</p>
                </div>
                <div className="h-80 bg-slate-900/50 rounded-3xl border border-slate-800 flex items-center justify-center">
                    <p className="text-slate-500">차트 준비 중 (리그 활동량)</p>
                </div>
            </div>
        </div>
    );
}
