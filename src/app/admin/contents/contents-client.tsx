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
    const [orders, setOrders] = useState<{ id: number; order: number }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleOrderChange = (id: number, newOrder: number) => {
        setOrders(prev => {
            const filtered = prev.filter(o => o.id !== id);
            return [...filtered, { id, order: newOrder }];
        });
    };

    const handleSaveOrders = async () => {
        if (orders.length === 0) {
            toast.info('변경사항이 없습니다.');
            return;
        }

        setIsSaving(true);
        try {
            await updateQuizpackOrder(orders);
            toast.success('퀴즈팩 노출 순서가 저장되었습니다.');
            setOrders([]);
        } catch (error) {
            toast.error('순서 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <AlertCircle className="w-4 h-4 text-indigo-400" />
                    <span>순서 변경 후 우측 상단의 저장 버튼을 클릭하세요.</span>
                </div>
                
                <Button 
                    onClick={handleSaveOrders} 
                    disabled={isSaving || orders.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 shadow-lg shadow-indigo-600/20"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? '저장 중...' : '노출 순서 저장'}
                </Button>
            </div>

            <div className="space-y-4">
                {quizpacks.map(pack => (
                    <QuizpackItem 
                        key={pack.id} 
                        quizpack={pack} 
                        onOrderChange={handleOrderChange}
                    />
                ))}
            </div>
        </div>
    );
}
