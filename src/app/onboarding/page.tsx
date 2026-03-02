'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth';
import { MobileFrame } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// 닉네임 유효성 검사 정규식 (2-10자, 한글/영문/숫자만)
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;

export default function OnboardingPage() {
    const router = useRouter();
    const { user, dbUser, isLoading } = useAuth();
    const supabase = createClient();

    const [nickname, setNickname] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);

    // 이미 등록된 사용자는 홈으로 리다이렉트
    useEffect(() => {
        if (!isLoading && dbUser) {
            router.push('/');
        }
    }, [isLoading, dbUser, router]);

    // 브라우저 뒤로가기(popstate) 감지하여 로그아웃 처리
    useEffect(() => {
        const handlePopstate = async () => {
            // 현재 히스토리 상태 강제 조작 (앞으로 가기 방지)
            window.history.pushState(null, '', window.location.href);

            try {
                // 로그아웃 처리
                await supabase.auth.signOut();

                let countdown = 2;

                const renderToastContent = (count: number) => (
                    <div className="flex flex-row items-center justify-center w-full text-center gap-1.5 min-w-0">
                        <span className="font-normal text-[13px] whitespace-nowrap">온보딩을 취소하고, 안전하게 로그아웃합니다.</span>
                        <span className="font-normal text-[13px] whitespace-nowrap ml-1">({count}초)</span>
                    </div>
                );

                const toastId = toast(renderToastContent(countdown), {
                    duration: 10000,
                });

                const interval = setInterval(() => {
                    countdown -= 1;

                    if (countdown >= 0) {
                        toast(renderToastContent(countdown), {
                            id: toastId,
                            duration: 10000,
                        });
                    }

                    if (countdown === 0) {
                        clearInterval(interval);

                        // 0초를 잠깐(500ms) 보여준 후 토스트를 닫기 시작
                        setTimeout(() => {
                            toast.dismiss(toastId);

                            // 페이드아웃 애니메이션(약 500ms) 대기 후 로그인 페이지로 실제 이동
                            setTimeout(() => {
                                window.location.replace('/login');
                            }, 500);
                        }, 500);
                    }
                }, 1000);

            } catch (error) {
                console.error('로그아웃 중 에러 발생:', error);
                toast.error('로그아웃 중 오류가 발생했습니다. 강제로 이동합니다.');
                setTimeout(() => {
                    window.location.replace('/login');
                }, 1500);
            }
        };

        // 컴포넌트 마운트 시 현재 상태 push (사용자가 뒤로가기 누를 수 있도록 스택 1개 추가)
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopstate);

        return () => {
            window.removeEventListener('popstate', handlePopstate);
        };
    }, [supabase.auth]);

    // 닉네임 유효성 검사
    const validateNickname = (value: string) => {
        if (!value) {
            return '닉네임을 입력해주세요.';
        }
        if (value.length < 2) {
            return '닉네임은 2자 이상이어야 합니다.';
        }
        if (value.length > 10) {
            return '닉네임은 10자 이하여야 합니다.';
        }
        if (!NICKNAME_REGEX.test(value)) {
            return '한글, 영문, 숫자만 사용할 수 있습니다.';
        }
        return '';
    };

    // 닉네임 중복 검사
    const checkDuplicate = async (value: string) => {
        const { data, error } = await supabase
            .rpc('check_nickname_exists', { check_nickname: value });

        if (error) {
            console.error('중복 검사 에러:', error);
            return false;
        }

        return data === true;
    };

    // 닉네임 입력 핸들러
    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNickname(value);
        setIsValid(false);

        const syntaxError = validateNickname(value);
        if (syntaxError) {
            setError(syntaxError);
        } else {
            setError('');
        }
    };

    // 닉네임 실시간 중복 검사 (디바운스 적용)
    useEffect(() => {
        // 문법적 오류가 있거나 빈 문자열이면 중복 검사 실행 안 함
        if (!nickname || validateNickname(nickname) !== '') {
            setIsValid(false);
            return;
        }

        // 300ms 후에 중복 검사 API 호출
        const timer = setTimeout(async () => {
            setIsChecking(true);
            const isDuplicate = await checkDuplicate(nickname);

            if (isDuplicate) {
                setError('이미 사용 중인 닉네임입니다.');
                setIsValid(false);
            } else {
                setError('');
                setIsValid(true);
            }
            setIsChecking(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [nickname, supabase]);

    // 닉네임 확정 핸들러
    const handleSubmit = async () => {
        if (!isValid) return; // 유효하지 않으면 제출 방지

        setIsSubmitting(true);

        try {
            if (!user) {
                throw new Error('로그인 정보가 없습니다.');
            }

            console.log('[온보딩] user 정보:', {
                id: user.id,
                provider: user.app_metadata.provider,
                email: user.email
            });

            // users 테이블에 사용자 정보 저장
            const insertPayload = {
                provider_id: user.id,
                auth_id: user.id,
                provider: user.app_metadata.provider as 'google' | 'kakao',
                nickname: nickname,
                role: 'user' as const,
            };

            const { data, error: insertError } = await supabase
                .from('users')
                .insert(insertPayload)
                .select();

            if (insertError) {
                console.error('[온보딩] Insert 에러 발생!', insertError);
                throw insertError;
            }

            // 저장 성공! 전체 페이지를 새로고침하여 AuthProvider가 dbUser를 확실히 로드하도록 함
            window.location.href = '/?welcome=true';
        } catch (err) {
            console.error('저장 에러:', err);
            toast.error('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MobileFrame className="bg-background text-foreground">
            <div className="flex flex-1 flex-col relative min-h-full">
                {/* 메인 컨텐츠 영역 (중앙 정렬) */}
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    {/* BI 로고 영역 */}
                    <div className="flex flex-col items-center">
                        <Image
                            src="/bi-constitution-quiz-vertical.svg"
                            alt="모두의 헌법"
                            width={180}
                            height={120}
                            priority
                        />
                    </div>

                    {/* Spacing 1 (로고와 환영 메시지 사이) */}
                    <div className="h-8" />

                    {/* 환영 메시지 */}
                    <p className="text-center text-muted-foreground animate-fade-in-up delay-100">
                        환영합니다!<br />
                        사용하실 닉네임을 입력해주세요.
                    </p>

                    {/* Spacing 2 (메시지와 폼 사이) */}
                    <div className="h-8" />

                    {/* 닉네임 입력 폼 */}
                    <div className="w-full max-w-[320px] space-y-4 animate-fade-in-up delay-200">
                        <div>
                            <Input
                                type="text"
                                placeholder="닉네임 (2-10자)"
                                value={nickname}
                                onChange={handleNicknameChange}
                                maxLength={10}
                                className={`h-12 rounded-xl text-center text-lg !ring-0 transition-colors duration-200 ${error
                                    ? 'border-gray-200 focus-visible:border-gray-400 text-gray-600'
                                    : isValid
                                        ? 'border-gray-400 focus-visible:border-gray-400 text-gray-600'
                                        : 'border-input focus-visible:border-gray-400'
                                    }`}
                            />
                            {error && (
                                <p className="mt-2 text-center text-xs text-red-500">{error}</p>
                            )}
                            {isValid && !error && (
                                <p className="mt-2 text-center text-xs text-green-600">사용 가능한 닉네임입니다!</p>
                            )}
                            {!error && !isValid && (
                                <p className="mt-2 text-center text-xs text-gray-400">
                                    한글, 영문, 숫자 사용 가능
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                            className={`h-12 w-full rounded-xl font-semibold transition-all duration-200 ${isValid && !isSubmitting
                                ? 'bg-[#2D2D2D] text-[#FF8400] shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                                : 'bg-muted-foreground/30 text-white cursor-not-allowed'
                                }`}
                        >
                            {isChecking ? '확인 중...' : isSubmitting ? '저장 중...' : '시작하기'}
                        </Button>
                    </div>
                </div>
            </div>
        </MobileFrame>
    );
}