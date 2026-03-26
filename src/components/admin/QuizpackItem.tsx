'use client';

import { useState } from 'react';
import { 
    ChevronDown, 
    ChevronUp, 
    Edit3, 
    Eye, 
    Layers,
    Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAdminQuizzes } from '@/actions/admin/contents';
import { QuizPreviewModal } from './QuizPreviewModal';
import { toast } from 'sonner';

interface QuizpackItemProps {
    quizpack: any;
    onOrderChange: (id: number, newOrder: number) => void;
}

export function QuizpackItem({ quizpack, onOrderChange }: QuizpackItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [previewQuizId, setPreviewQuizId] = useState<number | null>(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const toggleExpand = async () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        
        if (nextState && quizzes.length === 0) {
            setLoadingQuizzes(true);
            try {
                const data = await getAdminQuizzes(quizpack.id);
                setQuizzes(data);
            } catch (error) {
                toast.error('퀴즈 목록을 불러오지 못했습니다.');
            } finally {
                setLoadingQuizzes(false);
            }
        }
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-slate-700">
            {/* Header / Summary */}
            <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Layers className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-500">ID: {quizpack.id}</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                quizpack.is_active 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            )}>
                                {quizpack.is_active ? 'ON' : 'OFF'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Tag className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium truncate max-w-[300px]">{quizpack.keywords || '키워드 없음'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Order Control */}
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 font-bold uppercase">Order</span>
                        <input 
                            type="number" 
                            className="w-10 bg-transparent text-sm font-bold text-white text-center focus:outline-none"
                            defaultValue={quizpack.quizpack_loadmap?.pack_order || 0}
                            onBlur={(e) => onOrderChange(quizpack.id, parseInt(e.target.value))}
                        />
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="text-center px-4 border-l border-slate-800">
                            <p className="text-slate-500 text-xs">퀴즈 개수</p>
                            <p className="text-white font-bold">{quizpack.quiz_count_all}/{quizpack.quiz_max}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800">
                            <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleExpand}
                            className={cn(
                                "text-slate-500 hover:text-white transition-transform duration-300",
                                isExpanded && "rotate-180"
                            )}
                        >
                            <ChevronDown className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quizzes List (Expanded) */}
            {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/30 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 overflow-x-auto">
                        {loadingQuizzes ? (
                            <div className="py-20 text-center text-slate-500 animate-pulse">퀴즈 데이터를 불러오는 중...</div>
                        ) : quizzes.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 italic">등록된 퀴즈가 없습니다.</div>
                        ) : (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800/50">
                                        <th className="px-4 py-3 font-bold text-slate-500 w-16">순서</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 w-24">유형</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 w-24">난이도</th>
                                        <th className="px-4 py-3 font-bold text-slate-500">문제 내용</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 w-20">상태</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 text-right w-32">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {quizzes.map((quiz) => (
                                        <tr key={quiz.id} className="hover:bg-indigo-500/5 transition-colors group">
                                            <td className="px-4 py-4 font-mono text-slate-400">#{quiz.quiz_order}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                                                    {quiz.quiz_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-slate-300 font-medium">중</span> {/* TODO: 난이도 라벨 매핑 */}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="line-clamp-1 text-slate-400 group-hover:text-white transition-colors">
                                                    {quiz.question}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    quiz.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-700"
                                                )} />
                                            </td>
                                            <td className="px-4 py-4 text-right flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-400">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
