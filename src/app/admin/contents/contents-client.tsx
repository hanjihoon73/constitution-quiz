'use client';

import { useState } from 'react';
import { QuizpackItem } from '@/components/admin/QuizpackItem';
import { Button } from '@/components/ui/button';
import { Save, AlertCircle } from 'lucide-react';
import { updateQuizpackOrder } from '@/actions/admin/contents';
import { toast } from 'sonner';

interface ContentsClientProps {
    quizpacks: any[];
}

export function ContentsClient({ quizpacks }: ContentsClientProps) {
    const [localPacks, setLocalPacks] = useState<any[]>(quizpacks);
    const [isModified, setIsModified] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // props가 바뀌면 초기화
    // useEffect(() => { setLocalPacks(quizpacks); setIsModified(false); }, [quizpacks]); // 직접 수정 모드에서 훅 호출 문제 방지를 위해 주석, 필요 시 활성화

    const moveUp = (index: number) => {
        if (index === 0) return;
        setLocalPacks(prev => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
        setIsModified(true);
    };

    const moveDown = (index: number) => {
        if (index === localPacks.length - 1) return;
        setLocalPacks(prev => {
            const next = [...prev];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
            return next;
        });
        setIsModified(true);
    };

    const handleCancelOrders = () => {
        setLocalPacks(quizpacks); // 원본 복구
        setIsModified(false);
    };

    const handleSaveOrders = async () => {
        if (!isModified) return;

        setIsSaving(true);
        try {
            // 현재 배열 순서(index + 1)를 order로 매핑
            const orders = localPacks.map((pack, index) => ({
                id: pack.id,
                order: index + 1
            }));
            await updateQuizpackOrder(orders);
            toast.success('퀴즈팩 노출 순서가 저장되었습니다.');
            setIsModified(false);
            // 원본 데이터는 revalidate로 갱신됨 (page.tsx에서 다시 받아옴)
        } catch (error) {
            toast.error('순서 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 min-h-0">
            {/* 고정 영역: 안내 + 순서 저장 버튼 */}
            <div className="shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <AlertCircle className="w-4 h-4 text-indigo-400" />
                    <span>퀴즈팩의 상/하 버튼으로 순서를 조정할 수 있습니다.</span>
                </div>

                {isModified && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <Button
                            variant="ghost"
                            onClick={handleCancelOrders}
                            disabled={isSaving}
                            className="text-slate-400 hover:text-white"
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handleSaveOrders}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 shadow-lg shadow-indigo-600/20"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? '저장 중...' : '변경된 순서 저장'}
                        </Button>
                    </div>
                )}
            </div>

            {/* 스크롤 영역: 퀴즈팩 목록 */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                {localPacks.map((pack, index) => (
                    <QuizpackItem
                        key={pack.id}
                        quizpack={pack}
                        orderInfo={{
                            current: index + 1,
                            canMoveUp: index > 0,
                            canMoveDown: index < localPacks.length - 1,
                            onMoveUp: () => moveUp(index),
                            onMoveDown: () => moveDown(index)
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
