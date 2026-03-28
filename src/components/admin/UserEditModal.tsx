'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { updateAdminUser, getXpTitles, checkNicknameDuplicate } from '@/actions/admin/users';

interface UserEditModalProps {
    user: any | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// 날짜 포맷: YYYY.MM.DD HH:MM (24시간)
function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
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

    // 닉네임 중복 체크 상태
    const [nicknameError, setNicknameError] = useState('');
    const [checkingNickname, setCheckingNickname] = useState(false);

    // 유저 데이터 초기화
    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            setTitle(user.title || '');
            setRole(user.role || 'user');
            setIsActive(user.is_active ?? true);
            setIsTest(user.is_test ?? false);
            setNicknameError('');
        }
    }, [user]);

    // 타이틀 목록 로드
    useEffect(() => {
        if (open) {
            getXpTitles().then(setTitles);
        }
    }, [open]);

    // 닉네임 실시간 중복 체크 (debounce)
    const handleNicknameChange = useCallback(
        async (value: string) => {
            setNickname(value);
            setNicknameError('');

            if (!value.trim()) {
                setNicknameError('닉네임을 입력해주세요.');
                return;
            }

            // 원래 닉네임과 동일하면 체크 불필요
            if (value === user?.nickname) return;

            setCheckingNickname(true);
            try {
                const isDuplicate = await checkNicknameDuplicate(value.trim(), user?.id);
                if (isDuplicate) {
                    setNicknameError('이미 사용 중인 닉네임입니다.');
                }
            } catch {
                // 체크 실패 시 저장 단계에서 서버가 검증
            } finally {
                setCheckingNickname(false);
            }
        },
        [user]
    );

    // 저장 가능 여부
    const canSave = nickname.trim() && !nicknameError && !checkingNickname;

    const handleSave = async () => {
        if (!user || !canSave) return;

        setLoading(true);
        try {
            const result = await updateAdminUser(user.id, {
                nickname: nickname.trim(),
                title,
                role,
                is_active: isActive,
                is_test: isTest,
            });

            if (result.success) {
                toast.success('사용자 정보가 수정되었습니다.');
                onSuccess();
                onClose();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error('수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px] bg-slate-900 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">사용자 정보 수정</DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    {/* 읽기전용 정보: id / 계정 종류 / 가입일시 — 1행 */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-sm">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID</p>
                            <p className="font-mono text-slate-300">{user.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">계정 종류</p>
                            <p className="text-slate-300 capitalize">{user.provider || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">가입일시</p>
                            <p className="text-slate-300 tabular-nums">{formatDateTime(user.created_at)}</p>
                        </div>
                    </div>

                    {/* 닉네임 */}
                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-white font-medium">닉네임</Label>
                        <Input
                            id="nickname"
                            value={nickname}
                            onChange={(e) => handleNicknameChange(e.target.value)}
                            className="bg-slate-950 border-slate-700 focus:ring-indigo-600"
                        />
                        {/* 중복 체크 피드백 */}
                        {checkingNickname && (
                            <p className="text-xs text-slate-400">중복 확인 중...</p>
                        )}
                        {nicknameError && !checkingNickname && (
                            <p className="text-xs text-rose-400">{nicknameError}</p>
                        )}
                        {!nicknameError && !checkingNickname && nickname.trim() && nickname !== user.nickname && (
                            <p className="text-xs text-emerald-400">사용 가능한 닉네임입니다.</p>
                        )}
                    </div>

                    {/* 타이틀 — 드롭다운 */}
                    <div className="space-y-2">
                        <Label className="text-white font-medium">타이틀</Label>
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

                    {/* 권한 — 드롭다운 */}
                    <div className="space-y-2">
                        <Label className="text-white font-medium">권한</Label>
                        <Select value={role} onValueChange={(val: any) => setRole(val)}>
                            <SelectTrigger className="bg-slate-950 border-slate-700">
                                <SelectValue placeholder="권한 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                <SelectItem value="user">User (일반)</SelectItem>
                                <SelectItem value="admin">Admin (관리자)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 활성화 — 토글 */}
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-white font-medium">활성화 상태</Label>
                            <p className="text-xs text-slate-500">{isActive ? 'On — 로그인 및 서비스 이용 가능' : 'Off — 로그인 불가'}</p>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>

                    {/* 테스트 계정 — 토글 */}
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-white font-medium">테스트 계정</Label>
                            <p className="text-xs text-slate-500">{isTest ? 'Y — 통계 집계에서 제외' : 'N — 일반 사용자로 집계'}</p>
                        </div>
                        <Switch checked={isTest} onCheckedChange={setIsTest} />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
                        취소
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!canSave || loading}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-8"
                    >
                        {loading ? '저장 중...' : '저장하기'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
