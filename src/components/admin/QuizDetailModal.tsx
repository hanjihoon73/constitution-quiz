'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getQuizDetail } from '@/actions/admin/contents_detail';
import { updateQuiz, updateQuizChoices } from '@/actions/admin/contents';

interface QuizDetailModalProps {
    quizId: number;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

const DIFFICULTY_MAP = [
    { value: 1, label: '하' },
    { value: 2, label: '중하' },
    { value: 3, label: '중' },
    { value: 4, label: '중상' },
    { value: 5, label: '상' }
];

export function QuizDetailModal({ quizId, open, onClose, onSaved }: QuizDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form states
    const [quizData, setQuizData] = useState<any>(null);
    const [choices, setChoices] = useState<any[]>([]);

    useEffect(() => {
        if (open && quizId) {
            loadQuiz();
        } else {
            // Reset
            setQuizData(null);
            setChoices([]);
        }
    }, [open, quizId]);

    const loadQuiz = async () => {
        setLoading(true);
        try {
            const data = await getQuizDetail(quizId);
            setQuizData({
                question: data.question || '',
                passage: data.passage || '',
                hint: data.hint || '',
                explanation: data.explanation || '',
                difficulty_id: data.difficulty_id || 3,
                is_active: data.is_active ?? true,
                quiz_type: data.quiz_type || 'multiple'
            });
            
            // 보기 데이터 정렬 및 기본값 설정
            let loadedChoices = data.choices || [];
            if (loadedChoices.length === 0 && data.quiz_type === 'multiple') {
                loadedChoices = Array(4).fill(null).map((_, i) => ({
                    choice_order: i + 1,
                    choice_text: '',
                    is_answer: i === 0
                }));
            }
            setChoices(loadedChoices.map((c: any) => ({
                id: c.id,
                choice_order: c.choice_order,
                choice_text: c.choice_text || '',
                is_answer: c.is_answer || false
            })));
        } catch (error) {
            toast.error('퀴즈 상세 정보를 불러오지 못했습니다.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleChoiceChange = (index: number, field: string, value: any) => {
        setChoices(prev => {
            const updated = [...prev];
            if (field === 'is_answer') {
                // 단일 정답 처리
                const newArr = updated.map(c => ({...c, is_answer: false}));
                newArr[index].is_answer = true;
                return newArr;
            } else {
                updated[index] = { ...updated[index], [field]: value };
                return updated;
            }
        });
    };

    const handleSave = async () => {
        if (!quizData?.question?.trim()) {
            toast.error('문제 내용을 입력해주세요.');
            return;
        }

        if (quizData.quiz_type === 'multiple') {
            const hasEmptyChoice = choices.some(c => !c.choice_text?.trim());
            if (hasEmptyChoice) {
                toast.error('모든 보기의 내용을 입력해주세요.');
                return;
            }
            const hasAnswer = choices.some(c => c.is_answer);
            if (!hasAnswer) {
                toast.error('정답을 1개 이상 선택해주세요.');
                return;
            }
        }

        setSaving(true);
        try {
            // 퀴즈 본체 저장
            await updateQuiz(quizId, {
                question: quizData.question,
                passage: quizData.passage,
                hint: quizData.hint,
                explanation: quizData.explanation,
                difficulty_id: Number(quizData.difficulty_id),
                is_active: quizData.is_active
            });

            // 객관식일 경우 보기(Choices) 저장
            if (quizData.quiz_type === 'multiple' && choices.length > 0) {
                await updateQuizChoices(quizId, choices.map(c => ({
                    choice_order: c.choice_order,
                    choice_text: c.choice_text,
                    is_answer: c.is_answer
                })));
            }

            toast.success('퀴즈 정보가 저장되었습니다.');
            onSaved();
            onClose();
        } catch (error) {
            toast.error('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto w-11/12 mx-auto rounded-3xl p-6 md:p-8">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        퀴즈 상세 수정
                    </DialogTitle>
                </DialogHeader>

                {loading || !quizData ? (
                    <div className="py-20 flex justify-center text-slate-500 animate-pulse">
                        데이터를 불러오는 중입니다...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 최상단 정보: 난이도 및 상태 */}
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label className="text-slate-400">난이도</Label>
                                <select 
                                    className="w-full flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                    value={quizData.difficulty_id}
                                    onChange={(e) => setQuizData({...quizData, difficulty_id: Number(e.target.value)})}
                                >
                                    {DIFFICULTY_MAP.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label className="text-slate-400">상태</Label>
                                <div className="h-10 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuizData({...quizData, is_active: true})}
                                        className={`flex-1 h-full rounded-md border text-sm font-bold transition-colors ${quizData.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                                    >
                                        ON
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuizData({...quizData, is_active: false})}
                                        className={`flex-1 h-full rounded-md border text-sm font-bold transition-colors ${!quizData.is_active ? 'bg-slate-600/30 text-slate-300 border-slate-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                                    >
                                        OFF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 문제 */}
                        <div className="space-y-2">
                            <Label className="text-slate-400">문제 <span className="text-red-400">*</span></Label>
                            <Textarea 
                                value={quizData.question}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuizData({...quizData, question: e.target.value})}
                                placeholder="퀴즈 문제를 입력하세요."
                                className="min-h-[80px] bg-slate-800 border-slate-700 focus-visible:ring-indigo-600 resize-none text-base"
                            />
                        </div>

                        {/* 지문 (선택) */}
                        <div className="space-y-2">
                            <Label className="text-slate-400">지문 (선택)</Label>
                            <Textarea 
                                value={quizData.passage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuizData({...quizData, passage: e.target.value})}
                                placeholder="필요한 경우 문제의 상세 지문을 입력하세요."
                                className="min-h-[100px] bg-slate-800 border-slate-700 focus-visible:ring-indigo-600 resize-y"
                            />
                        </div>

                        {/* 보기 (객관식일 경우만) */}
                        {quizData.quiz_type === 'multiple' && (
                            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <Label className="text-slate-300 font-bold block mb-2">선택지 설정 <span className="text-red-400">*</span></Label>
                                {choices.map((choice, idx) => (
                                    <div key={idx} className="flex gap-3 items-center">
                                        {/* 정답 체크 */}
                                        <button
                                            type="button"
                                            onClick={() => handleChoiceChange(idx, 'is_answer', !choice.is_answer)}
                                            className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${choice.is_answer ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 text-transparent hover:border-slate-500'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${choice.is_answer ? 'bg-emerald-400' : 'bg-transparent'}`} />
                                        </button>
                                        
                                        {/* 보기 텍스트 */}
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                                                {idx + 1}.
                                            </span>
                                            <Input
                                                value={choice.choice_text}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChoiceChange(idx, 'choice_text', e.target.value)}
                                                placeholder={`선택지 ${idx + 1} 내용을 입력하세요`}
                                                className={`pl-8 bg-slate-800 text-white ${choice.is_answer ? 'border-emerald-500/50 focus-visible:ring-emerald-600' : 'border-slate-700 focus-visible:ring-indigo-600'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <p className="text-xs text-slate-500 italic mt-2 text-center">좌측의 동그라미를 클릭하여 정답을 지정하세요.</p>
                            </div>
                        )}

                        {/* 힌트 및 해설 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400">힌트</Label>
                                <Textarea 
                                    value={quizData.hint}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuizData({...quizData, hint: e.target.value})}
                                    placeholder="힌트 내용 (선택)"
                                    className="min-h-[80px] bg-slate-800 border-slate-700 focus-visible:ring-indigo-600 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-400">해설</Label>
                                <Textarea 
                                    value={quizData.explanation}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuizData({...quizData, explanation: e.target.value})}
                                    placeholder="정답에 대한 해설 (선택)"
                                    className="min-h-[80px] bg-slate-800 border-slate-700 focus-visible:ring-indigo-600 text-sm"
                                />
                            </div>
                        </div>

                    </div>
                )}

                <DialogFooter className="mt-8 border-t border-slate-800 pt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={saving}
                        className="text-slate-400 hover:text-white"
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 shadow-lg shadow-indigo-600/20"
                    >
                        {saving ? '저장 중...' : '저장 완료'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
