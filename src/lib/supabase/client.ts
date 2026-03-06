import { createBrowserClient } from '@supabase/ssr';

/**
 * 기본 브라우저 fetch를 감싸서, 일정 시간 응답이 없으면 타임아웃 에러를 발생시키고
 * 필요한 경우 재시도(Retry)할 수 있도록 만든 커스텀 fetch 함수입니다.
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const RETRY_COUNT = 1;      // 실패 시 1회 재시도
  const TIMEOUT_MS = 8000;    // 8초 동안 응답 없으면 연결 끊기 (Timeout)

  let attempt = 0;
  while (attempt <= RETRY_COUNT) {
    // AbortController를 통해 fetch 강제 중단 기능 생성
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(id); // 정상 응답 시 타이머 해제
      return response;
    } catch (error: any) {
      clearTimeout(id);

      // AbortError(우리가 발생시킨 타임아웃) 이거나 네트워크 오류일 때 재시도
      if (error.name === 'AbortError' || error.message?.includes('fetch')) {
        attempt++;
        if (attempt > RETRY_COUNT) {
          console.error('[Supabase Fetch Error] Max retries reached or network disconnected:', error);
          throw error;
        }
        console.warn(`[Supabase Fetch Retry] Attempt ${attempt} after timeout/error.`);
        // 재시도 전 아주 짧은 대기 시간 (브라우저 네트워크 소켓 정리 시간)
        await new Promise((res) => setTimeout(res, 500));
        continue;
      }

      // 타임아웃/네트워크 류의 에러가 아니면 즉시 실패 처리
      throw error;
    }
  }

  throw new Error('Fetch failed unexpectedly.');
};

export function createClient() {
  // 모바일/PC 유휴 상태(Idle)에서 소켓이 끊긴 뒤 무한 로딩에 빠지는 현상 방지
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: customFetch,
      },
    }
  );
}
