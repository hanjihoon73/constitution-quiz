'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Edit3,
    Eye,
    Layers,
    Tag,
    X,
    Save,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAdminQuizzes, updateQuizpack } from '@/actions/admin/contents';
import { QuizPreviewModal } from './QuizPreviewModal';
import { toast } from 'sonner';

interface QuizpackItemProps {
    quizpack: any;
    orderInfo?: {
        current: number;
        canMoveUp: boolean;
        canMoveDown: boolean;
        onMoveUp: () => void;
        onMoveDown: () => void;
    };
}

export function QuizpackItem({ quizpack, orderInfo }: QuizpackItemProps) {
    // 펼치기/접기
    const [isExpanded, setIsExpanded] = useState(false);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [previewQuizId, setPreviewQuizId] = useState<number | null>(null);

    // 수정 모드
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({
        quiz_count_all: quizpack.quiz_count_all ?? 0,
        quiz_max: quizpack.quiz_max ?? 0,
        keywords: quizpack.keywords ?? '',
        is_active: quizpack.is_active ?? true,
    });

    // 로컬 표시용 (저장 후 새로고침 없이 반영)
    const [localData, setLocalData] = useState({
        quiz_count_all: quizpack.quiz_count_all ?? 0,
        quiz_max: quizpack.quiz_max ?? 0,
        keywords: quizpack.keywords ?? '',
        is_active: quizpack.is_active ?? true,
    });

    const handleEditStart = () => {
        setEditData({ ...localData });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        // not null 체크
        if (!String(editData.quiz_count_all).trim() || !String(editData.quiz_max).trim()) {
            toast.error('퀴즈수와 최대 퀴즈수는 필수 입력 항목입니다.');
            return;
        }
        // 정합성 체크: 현재 퀴즈수 ≤ 최대 퀴즈수
        if (Number(editData.quiz_count_all) > Number(editData.quiz_max)) {
            toast.error('현재 퀴즈수는 최대 퀴즈수를 초과할 수 없습니다.');
            return;
        }

        setIsSaving(true);
        try {
            await updateQuizpack(quizpack.id, {
                quiz_count_all: Number(editData.quiz_count_all),
                quiz_max: Number(editData.quiz_max),
                keywords: editData.keywords,
                is_active: editData.is_active,
            });
            setLocalData({ ...editData });
            setIsEditing(false);
            toast.success('퀴즈팩 정보가 수정되었습니다.');
        } catch (error) {
            toast.error('수정 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleExpand = async () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);

        if (nextState && quizzes.length === 0) {
            setLoadingQuizzes(true);
            try {
                const data = await getAdminQuizzes(quizpack.id);
                setQuizzes(data);
            } catch {
                toast.error('퀴즈 목록을 불러오지 못했습니다.');
            } finally {
                setLoadingQuizzes(false);
            }
        }
    };

    return (
        <div className={cn(
            "bg-slate-900/50 border rounded-3xl overflow-hidden transition-all duration-300",
            isEditing ? "border-indigo-500/50" : "border-slate-800 hover:border-slate-700"
        )}>
            {/* Header */}
            <div className="p-6 flex items-center gap-4">
                {/* 아이콘 */}
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Layers className="w-6 h-6" />
                </div>

                {/* Order Controls (아이콘과 정보 사이로 이동) */}
                {orderInfo && (
                    <div className="flex flex-col items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shrink-0 mx-2">
                        <button
                            onClick={orderInfo.onMoveUp}
                            disabled={!orderInfo.canMoveUp}
                            className="w-12 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-full flex items-center justify-center border-y border-slate-800/50 bg-slate-900/50 py-0.5">
                            <span className="text-xs font-bold text-white tracking-widest leading-none">
                                {String(orderInfo.current).padStart(2, '0')}
                            </span>
                        </div>
                        <button
                            onClick={orderInfo.onMoveDown}
                            disabled={!orderInfo.canMoveDown}
                            className="w-12 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* 메인 정보 영역 (1행으로 통합) */}
                <div className="flex-1 min-w-0 flex items-center gap-6">
                    {/* ID + 상태 뱃지 */}
                    <div className="flex items-center gap-6 shrink-0">
                        <span className="text-s font-mono text-slate-500">ID: {quizpack.id}</span>

                        {isEditing ? (
                            /* 상태 토글 (수정 모드) */
                            <button
                                type="button"
                                onClick={() => setEditData(p => ({ ...p, is_active: !p.is_active }))}
                                className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                                    editData.is_active
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                        : "bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20"
                                )}
                            >
                                {editData.is_active ? 'ON' : 'OFF'}
                            </button>
                        ) : (
                            /* 상태 뱃지 (조회 모드) */
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                localData.is_active
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            )}>
                                {localData.is_active ? 'ON' : 'OFF'}
                            </span>
                        )}
                    </div>

                    {/* 키워드 */}
                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1">
                            <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <Input
                                value={editData.keywords}
                                onChange={e => setEditData(p => ({ ...p, keywords: e.target.value }))}
                                placeholder="키워드 입력"
                                className="h-7 text-sm bg-slate-800 border-slate-700 text-white max-w-sm focus-visible:ring-indigo-600"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-sm font-medium truncate">
                                {localData.keywords || '키워드 없음'}
                            </span>
                        </div>
                    )}
                </div>

                {/* 우측 컨트롤 영역 */}
                <div className="flex items-center gap-5 shrink-0">
                    {/* 퀴즈수 / 최대 퀴즈수 */}
                    <div className="text-center px-4 border-l border-slate-800">
                        <p className="text-slate-500 text-xs mb-1">퀴즈 개수</p>
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={editData.quiz_count_all}
                                    onChange={e => setEditData(p => ({ ...p, quiz_count_all: Number(e.target.value) }))}
                                    className="w-16 bg-slate-800 border border-slate-700 rounded text-white text-sm text-center focus:outline-none focus:border-indigo-500 px-1 py-0.5"
                                    min={0}
                                />
                                <span className="text-slate-500">/</span>
                                <input
                                    type="number"
                                    value={editData.quiz_max}
                                    onChange={e => setEditData(p => ({ ...p, quiz_max: Number(e.target.value) }))}
                                    className="w-16 bg-slate-800 border border-slate-700 rounded text-white text-sm text-center focus:outline-none focus:border-indigo-500 px-1 py-0.5"
                                    min={0}
                                />
                            </div>
                        ) : (
                            <p className="text-white font-bold">{localData.quiz_count_all}/{localData.quiz_max}</p>
                        )}
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    취소
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? '저장 중...' : '저장'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleEditStart}
                                className="text-slate-500 hover:text-white hover:bg-slate-800"
                                title="수정"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                        )}

                        {/* 토글 (펼치기/접기) */}
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-indigo-400"
                                                    onClick={() => setPreviewQuizId(quiz.id)}
                                                >
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

            {/* 미리보기 모달 */}
            {previewQuizId !== null && (
                <QuizPreviewModal
                    open={previewQuizId !== null}
                    quizId={previewQuizId}
                    onClose={() => setPreviewQuizId(null)}
                />
            )}
        </div>
    );
}
