'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileFrame, Header } from '@/components/common';
import { QuizpackList, WelcomeDialog, ExitConfirmDialog } from '@/components/home';
import { useAuth } from '@/components/auth';
import { useQuizpacks } from '@/hooks/useQuizpacks';
import { AllClearDialog } from '@/components/quiz/AllClearDialog';
import { RestartOptionDialog } from '@/components/quiz/RestartOptionDialog';
import { AbortConfirmDialog } from '@/components/quiz/AbortConfirmDialog';
import {
  resetUserQuizpack,
  getUserQuizpackId,
  getInProgressQuizpack,
  abortInProgressQuizpack,
} from '@/lib/api/quiz';

export default function Home() {
  return (
    <Suspense fallback={
      <MobileFrame>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      </MobileFrame>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, dbUser, isLoading: authLoading, isDbUserLoaded } = useAuth();
  const { quizpacks, isLoading: quizpacksLoading, error } = useQuizpacks();

  const [showAllClearDialog, setShowAllClearDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [inProgressPack, setInProgressPack] = useState<{
    id: number;
    quizpack_id: number;
    quizpack_order: number;
  } | null>(null);
  // 중단 후 실행할 액션을 저장
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // 신규 사용자는 온보딩으로 자동 리다이렉트
  // isDbUserLoaded가 true가 된 후에만 판단 (로딩 중 오진 방지)
  useEffect(() => {
    if (!authLoading && isDbUserLoaded && user && !dbUser) {
      window.location.replace('/onboarding');
    }
  }, [authLoading, isDbUserLoaded, user, dbUser]);

  // All Clear 파라미터 확인
  useEffect(() => {
    if (searchParams.get('allClear') === 'true') {
      setShowAllClearDialog(true);
    }
  }, [searchParams]);

  // 환영 파라미터 확인 (온보딩 직후)
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcomeDialog(true);
      // Next.js 라우터의 비동기 동작 간섭을 피하기 위해 네이티브 방식을 사용해 파라미터를 조용히 지웁니다.
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, [searchParams, router]);

  // 브라우저 뒤로가기(popstate) 감지하여 앱 종료 모달 표시
  useEffect(() => {
    let trapSet = false;

    const setupTrap = () => {
      if (!trapSet) {
        // Next.js 상태를 해치지 않게 현재 state를 그대로 복사해서 한 칸 더 전진(push)합니다.
        window.history.pushState(null, '', window.location.href);
        trapSet = true;
      }
    };

    // 1. 페이지 로드 시 500ms 지연 후 트랩 설치 (일부 브라우저에선 무시될 수 있음)
    const timeoutId = setTimeout(setupTrap, 500);

    // 2. 확실한 방어: 브라우저 보안 제약을 뚫기 위해 화면을 처음 터치/클릭하는 순간 즉시 트랩 설치
    window.addEventListener('click', setupTrap, { capture: true, once: true });
    window.addEventListener('touchstart', setupTrap, { capture: true, once: true });

    const handlePopstate = () => {
      // 뒤로가기를 강제로 취소하고(다시 앞으로 밀어놓고) 종료 다이얼로그 띄우기
      window.history.pushState(null, '', window.location.href);
      setShowExitDialog(true);
    };

    window.addEventListener('popstate', handlePopstate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('click', setupTrap, { capture: true });
      window.removeEventListener('touchstart', setupTrap, { capture: true });
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  const handleAllClearDialogChange = (open: boolean) => {
    setShowAllClearDialog(open);
    if (!open) {
      router.replace('/', { scroll: false });
    }
  };

  /**
   * 진행 중인 퀴즈팩 체크 후 액션 실행
   * - in_progress 퀴즈팩이 있으면 경고 다이얼로그 표시 후 대기
   * - 없으면 바로 액션 실행
   */
  const checkInProgressAndExecute = useCallback(async (
    targetPackId: number,
    action: () => void
  ) => {
    if (!dbUser?.id) return;

    try {
      const existing = await getInProgressQuizpack(dbUser.id, targetPackId);
      if (existing) {
        // 진행 중인 퀴즈팩이 있으면 경고 표시
        setInProgressPack(existing);
        setPendingAction(() => action);
        setShowAbortDialog(true);
      } else {
        // 없으면 바로 실행
        action();
      }
    } catch (err) {
      console.error('진행 중 퀴즈팩 체크 실패:', err);
      action(); // 에러 시에도 진행
    }
  }, [dbUser?.id]);

  // 열림(opened) 퀴즈팩 클릭 핸들러
  const handleOpenedClick = useCallback((quizpackId: number) => {
    checkInProgressAndExecute(quizpackId, () => {
      router.push(`/quiz/${quizpackId}`);
    });
  }, [checkInProgressAndExecute, router]);

  // 완료된 퀴즈팩 클릭 핸들러
  const handleCompletedClick = useCallback((quizpackId: number) => {
    setSelectedPackId(quizpackId);
    setShowRestartDialog(true);
  }, []);

  // 결과 보기 핸들러
  const handleViewResults = useCallback(() => {
    setShowRestartDialog(false);
    if (selectedPackId) {
      router.push(`/quiz/${selectedPackId}?mode=view`);
    }
  }, [selectedPackId, router]);

  // 다시 풀기 핸들러
  const handleRestart = useCallback(async () => {
    if (!selectedPackId || !dbUser?.id) return;

    const executeRestart = async () => {
      try {
        const userQuizpackId = await getUserQuizpackId(dbUser.id, selectedPackId);
        if (userQuizpackId) {
          await resetUserQuizpack(userQuizpackId);
        }
        setShowRestartDialog(false);
        router.push(`/quiz/${selectedPackId}?restart=true`);
      } catch (err) {
        console.error('퀴즈팩 초기화 실패:', err);
      }
    };

    // 다시풀기도 in_progress 체크 필요 (다른 퀴즈팩이 진행 중일 수 있음)
    setShowRestartDialog(false);
    checkInProgressAndExecute(selectedPackId, executeRestart);
  }, [selectedPackId, dbUser?.id, router, checkInProgressAndExecute]);

  // AbortConfirmDialog 확인 핸들러 (기존 진행 중 퀴즈팩 중단 + 새 퀴즈팩 시작)
  const handleAbortConfirm = useCallback(async () => {
    if (!inProgressPack) return;

    try {
      await abortInProgressQuizpack(inProgressPack.id);
      setShowAbortDialog(false);
      setInProgressPack(null);

      // 대기 중이던 액션 실행
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      console.error('진행 중 퀴즈팩 중단 실패:', err);
    }
  }, [inProgressPack, pendingAction]);

  // AbortConfirmDialog 취소 핸들러
  const handleAbortCancel = useCallback(() => {
    setShowAbortDialog(false);
    setInProgressPack(null);
    setPendingAction(null);
  }, []);

  // ExitConfirmDialog (앱 종료) 확인 핸들러
  const handleExitConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace('/login');
    } catch (err) {
      console.error('로그아웃 에러:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <MobileFrame className="animate-in fade-in duration-500">
      <Header />

      {/* 퀴즈팩 목록 (전체 화면 스크롤) */}
      <main className="pb-10 pt-2">
        <QuizpackList
          quizpacks={quizpacks}
          isLoading={authLoading || quizpacksLoading}
          error={error}
          onCompletedClick={handleCompletedClick}
          onOpenedClick={handleOpenedClick}
        />
      </main>

      <AllClearDialog
        open={showAllClearDialog}
        onOpenChange={handleAllClearDialogChange}
      />

      {/* 온보딩 후 1회성 웰컴 다이얼로그 */}
      <WelcomeDialog
        open={showWelcomeDialog}
        onOpenChange={setShowWelcomeDialog}
      />

      {/* 완료된 퀴즈팩 재시작 옵션 팝업 (홈에서 표시) */}
      <RestartOptionDialog
        open={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
        onViewResults={handleViewResults}
        onRestart={handleRestart}
      />

      {/* 진행 중 퀴즈팩 경고 다이얼로그 */}
      <AbortConfirmDialog
        open={showAbortDialog}
        currentPackOrder={inProgressPack?.quizpack_order || 0}
        onConfirm={handleAbortConfirm}
        onCancel={handleAbortCancel}
      />

      {/* 앱 종료 확인 다이얼로그 */}
      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleExitConfirm}
        isLoggingOut={isLoggingOut}
      />
    </MobileFrame>
  );
}