'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth';
import { MobileFrame } from '@/components/common';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WithdrawDialog } from '@/components/profile';
import { updateNickname, checkNicknameDuplicate } from '@/lib/api/user';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Check, X, LogOut, CircleUser } from 'lucide-react';

// 닉네임 유효성 검사 정규식 (2-10자, 한글/영문/숫자만)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;

export default function ProfilePage() {
    const router = useRouter();
    const { user, dbUser, isLoading, isDbUserLoaded, signOut, refreshDbUser } = useAuth();

    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

    // 로그인 안 되어 있으면 로그인 페이지로
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    // 닉네임 유효성 검사
    const validateNickname = (value: string) => {
        if (!value) return '닉네임을 입력해주세요.';
        if (value.length < 2) return '닉네임은 2자 이상이어야 합니다.';
        if (value.length > 10) return '닉네임은 10자 이하여야 합니다.';
        if (!NICKNAME_REGEX.test(value)) return '한글, 영문, 숫자만 사용할 수 있습니다.';
        return '';
    };

    // 닉네임 입력 핸들러
    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewNickname(value);
        setIsValid(false);

        const syntaxError = validateNickname(value);
        if (syntaxError) {
            setNicknameError(syntaxError);
        } else {
            setNicknameError('');
        }
    };

    // 닉네임 실시간 중복 검사 (디바운스 적용)
    useEffect(() => {
        if (!newNickname || validateNickname(newNickname) !== '') {
            setIsValid(false);
            return;
        }

        if (dbUser && newNickname === dbUser.nickname) {
            // 본인 원래 닉네임과 동일하면 중복 처리 통과
            setNicknameError('');
            setIsValid(true);
            return;
        }

        const timer = setTimeout(async () => {
            setIsChecking(true);
            if (dbUser) {
                const isDuplicate = await checkNicknameDuplicate(newNickname, dbUser.id);
                if (isDuplicate) {
                    setNicknameError('이미 사용 중인 닉네임입니다.');
                    setIsValid(false);
                } else {
                    setNicknameError('');
                    setIsValid(true);
                }
            }
            setIsChecking(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [newNickname, dbUser]);

    // 닉네임 편집 시작
    const startEditNickname = () => {
        setNewNickname(dbUser?.nickname || '');
        setNicknameError('');
        setIsValid(true);
        setIsEditingNickname(true);
    };

    // 닉네임 편집 취소
    const cancelEditNickname = () => {
        setIsEditingNickname(false);
        setNewNickname('');
        setNicknameError('');
        setIsValid(false);
    };

    // 닉네임 저장
    const saveNickname = async () => {
        if (!dbUser) return;

        // 변경 없으면 종료
        if (newNickname === dbUser.nickname) {
            cancelEditNickname();
            return;
        }

        if (!isValid) return;

        setIsSaving(true);

        // 업데이트
        const result = await updateNickname(dbUser.id, newNickname);
        if (result.success) {
            toast.success('닉네임이 변경되었습니다.');
            await refreshDbUser();
            setIsEditingNickname(false);
        } else {
            toast.error(result.error || '닉네임 변경에 실패했습니다.');
        }

        setIsSaving(false);
    };

    // 로그아웃
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            window.location.replace('/login');
        } catch (error) {
            console.error('로그아웃 에러:', error);
            toast.error('로그아웃에 실패했습니다.');
            setIsLoggingOut(false);
        }
    };

    const getProviderLabel = (provider: string) => {
        switch (provider) {
            case 'google': return 'Google';
            case 'kakao': return 'Kakao';
            default: return provider;
        }
    };

    // 초기 인증 확인 및 DB유저 조회 1회가 안 끝났을 경우에만 로딩 표시
    if (isLoading || !isDbUserLoaded) {
        return (
            <MobileFrame>
                <Header />
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-gray-400">로딩 중...</div>
                </div>
            </MobileFrame>
        );
    }

    return (
        <MobileFrame>
            <Header />
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* 뒤로가기 */}
                <div className="px-4 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 hover:text-gray-700 cursor-pointer"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* 프로필 카드 */}
                <div className="px-4 pt-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        {/* 프로필 아이콘 + 닉네임 */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ecececff' }}>
                                <CircleUser className="w-18 h-18" color="#2D2D2D" strokeWidth={1.8} />
                            </div>

                            {/* 닉네임 영역 */}
                            {isEditingNickname ? (
                                <div className="w-full max-w-[300px] space-y-3">
                                    <div className="relative flex items-center justify-center w-full">
                                        <div className="w-48 relative">
                                            <Input
                                                type="text"
                                                placeholder="닉네임 (2-10자)"
                                                value={newNickname}
                                                onChange={handleNicknameChange}
                                                maxLength={10}
                                                className={`h-12 w-full rounded-xl text-center text-lg !ring-0 transition-colors duration-200 ${nicknameError
                                                    ? 'border-gray-200 focus-visible:border-gray-400 text-gray-600'
                                                    : isValid
                                                        ? 'border-gray-400 focus-visible:border-gray-400 text-gray-600'
                                                        : 'border-input focus-visible:border-gray-400'
                                                    }`}
                                                autoFocus
                                            />
                                            {/* 버튼 그룹: 입력창의 오른쪽 바깥에 위치 */}
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1 flex items-center gap-0">
                                                <button
                                                    onClick={saveNickname}
                                                    disabled={!isValid || isSaving || isChecking}
                                                    className="p-1.5 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-[#FF8400] disabled:opacity-50 disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <Check size={22} />
                                                </button>
                                                <button
                                                    onClick={cancelEditNickname}
                                                    className="p-1.5 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-[#FF8400] transition-colors cursor-pointer"
                                                >
                                                    <X size={22} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-5">
                                        {nicknameError && (
                                            <p className="text-center text-xs text-red-500">{nicknameError}</p>
                                        )}
                                        {isValid && !nicknameError && (
                                            <p className="text-center text-xs text-green-600">사용 가능한 닉네임입니다!</p>
                                        )}
                                        {!nicknameError && !isValid && (
                                            <p className="text-center text-xs text-gray-400">
                                                한글, 영문, 숫자 사용 가능
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative flex items-center justify-center w-full">
                                    <div className="flex relative items-center justify-center z-10 w-full">
                                        <h2 className="text-xl font-bold text-gray-800 text-center px-10 relative">
                                            {dbUser?.nickname}
                                            <button
                                                onClick={startEditNickname}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        </h2>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 계정 정보 */}
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="space-y-4 pt-2">
                            {/* 계정 종류 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">계정 종류</span>
                                <div className="flex items-center">
                                    <span
                                        className="px-3 py-1 rounded-md text-[12px] font-medium"
                                        style={{ backgroundColor: '#2D2D2D', color: '#ff8400' }}
                                    >
                                        {getProviderLabel(dbUser?.provider || '')}
                                    </span>
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="border-t border-gray-100" />

                            {/* 가입일시 */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">가입 일시</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {dbUser?.created_at ? (() => {
                                        const d = new Date(dbUser.created_at);
                                        const yyyy = d.getFullYear();
                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                        const dd = String(d.getDate()).padStart(2, '0');
                                        const hh = String(d.getHours()).padStart(2, '0');
                                        const min = String(d.getMinutes()).padStart(2, '0');
                                        return `${yyyy}. ${mm}. ${dd}. ${hh}:${min}`;
                                    })() : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 로그아웃 버튼 */}
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                    <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        variant="outline"
                        className="w-full h-12 rounded-xl text-gray-600 border-gray-200 hover:bg-gray-50 font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    >
                        {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                    </Button>
                </div>

                {/* 회원탈퇴 */}
                <div className="px-4 pb-4 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
                    <button
                        onClick={() => setShowWithdrawDialog(true)}
                        className="text-sm text-gray-400 underline underline-offset-4 hover:text-gray-500 transition-colors cursor-pointer"
                    >
                        회원탈퇴
                    </button>
                </div>

                {/* 서비스 문의 */}
                <div className="px-4 pb-4 flex justify-center mt-2 animate-in fade-in duration-500 delay-700 fill-mode-both">
                    <p className="text-xs text-gray-400">
                        서비스 문의: cognityhelp@gmail.com
                    </p>
                </div>

                {/* 이용약관 및 개인정보처리방침 */}
                <div className="px-4 pb-4 flex justify-center animate-in fade-in duration-500 delay-700 fill-mode-both">
                    <a
                        href="https://maperson.notion.site/2d2e387af28e804c94cecdf08c322ef6?source=copy_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground/60 underline hover:text-foreground cursor-pointer transition-colors"
                    >
                        이용약관 및 개인정보처리방침
                    </a>
                </div>

                {/* 저작권 문구 */}
                <div className="px-4 pb-12 flex justify-center mt-auto animate-in fade-in duration-500 delay-700 fill-mode-both">
                    <p className="text-xs text-gray-400">
                        ⓒ 2025 COGNITY. All rights reserved.
                    </p>
                </div>
            </main>

            {/* 회원탈퇴 안내 팝업 */}
            <WithdrawDialog
                open={showWithdrawDialog}
                onOpenChange={setShowWithdrawDialog}
                nickname={dbUser?.nickname || ''}
                userId={dbUser?.id || 0}
                authId={user?.id || ''}
            />
        </MobileFrame>
    );
}
