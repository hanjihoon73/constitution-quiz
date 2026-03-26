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
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updateAdminUser, getXpTitles } from '@/actions/admin/users';

interface UserEditModalProps {
    user: any | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function UserEditModal({ user, open, onClose, onSuccess }: UserEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [titles, setTitles] = useState<any[]>([]);
    
    // Form state
    const [nickname, setNickname] = useState('');
    const [title, setTitle] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [isActive, setIsActive] = useState(true);
    const [isTest, setIsTest] = useState(false);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            setTitle(user.title || '');
            setRole(user.role || 'user');
            setIsActive(user.is_active ?? true);
            setIsTest(user.is_test ?? false);
        }
    }, [user]);

    useEffect(() => {
        if (open) {
            getXpTitles().then(setTitles);
        }
    }, [open]);

    const handleSave = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            const result = await updateAdminUser(user.id, {
                nickname,
                title,
                role,
                is_active: isActive,
                is_test: isTest
            });

            if (result.success) {
                toast.success('사용자 정보가 수정되었습니다.');
                onSuccess();
                onClose();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">사용자 정보 수정</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Readonly Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                        <div className="space-y-1">
                            <Label className="text-slate-500">ID</Label>
                            <p className="font-mono text-slate-300">{user.id}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-500">가입 일시</Label>
                            <p className="text-slate-300">{new Date(user.created_at).toLocaleDateString('ko-KR')}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-white">닉네임</Label>
                        <Input
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="bg-slate-950 border-slate-700 focus:ring-indigo-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">타이틀</Label>
                        <Select value={title} onValueChange={setTitle}>
                            <SelectTrigger className="bg-slate-950 border-slate-700">
                                <SelectValue placeholder="타이틀 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                {titles.map((t) => (
                                    <SelectItem key={t.code} value={t.title}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">권한</Label>
                        <Select value={role} onValueChange={(val: any) => setRole(val)}>
                            <SelectTrigger className="bg-slate-950 border-slate-700">
                                <SelectValue placeholder="권한 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                <SelectItem value="user">일반 사용자</SelectItem>
                                <SelectItem value="admin">관리자</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-white font-medium">활성화 상태</Label>
                            <p className="text-xs text-slate-500">로그인 및 서비스 이용 가능 여부</p>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-white font-medium">테스트 계정</Label>
                            <p className="text-xs text-slate-500">통계 집계 시 제외 여부</p>
                        </div>
                        <Switch
                            checked={isTest}
                            onCheckedChange={setIsTest}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        취소
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8">
                        {loading ? '저장 중...' : '저장하기'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
