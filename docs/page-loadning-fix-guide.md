# 서비스 영역 무한 로딩 버그 수정 가이드

> **작성 목적:** 이 문서는 "모두의 헌법" 서비스의 무한 로딩 버그를 수정하기 위한 AI 코드 수정 요청용 가이드입니다.
> **수정 대상 파일:** 총 4개
> **수정 난이도:** 전체 낮음 (각 수정은 독립적이며 서로 의존성 없음)

---

## 1. 버그 개요

### 증상

사용자가 서비스 페이지에서 일정 시간 대기(수 분 이상) 후 다른 페이지로 이동하려 하면 두 가지 현상이 발생합니다.

- **케이스 A:** 버튼을 클릭해도 페이지 전환이 일어나지 않고 현재 페이지가 로딩 상태("저장 중…")로 굳어버림
- **케이스 B:** 페이지 전환은 되었지만 새 페이지가 무한 로딩 상태에 빠짐

발생 화면: 홈(퀴즈팩 목록), 퀴즈 화면, 퀴즈팩 완료 화면, 랭킹 페이지, 마이페이지

### 어드민 영역은 동일한 현상이 없는 이유

어드민 페이지는 Next.js 서버 컴포넌트(`async function`) + `'use server'` 액션 구조입니다. 페이지 이동 시 브라우저가 서버에 새 HTTP 요청을 보내고, 서버의 Node.js가 Supabase 쿼리를 실행합니다. 서버는 자체 연결 풀을 관리하므로 브라우저 네트워크 상태와 무관합니다.

서비스 페이지는 `'use client'` + 브라우저 Supabase SDK 구조입니다. 브라우저가 유휴 상태일 때 OS/브라우저 네트워크 레이어가 TCP 연결을 조용히 닫지만 Supabase 클라이언트 SDK는 이를 감지하지 못합니다. 이후 Supabase 쿼리를 실행하면 `Promise`가 영원히 `pending` 상태가 되어 `finally` 블록이 실행되지 않고, `setIsLoading(false)`가 호출되지 않아 무한 로딩이 됩니다.

---

## 2. 수정 목록 요약

| 순위 | 파일 | 수정 내용 | 해결 증상 |
|------|------|-----------|-----------|
| 1 | `src/lib/utils/withTimeout.ts` | **신규 파일 생성** — 타임아웃 유틸 함수 | 모든 hang 방지의 기반 |
| 2 | `src/components/auth/AuthProvider.tsx` | Page Visibility API 추가 + supabase useMemo 고정 + 에러 처리 수정 | 연결 끊김 예방 + auth 상태 불일치 방지 |
| 3 | `src/hooks/useQuizpacks.ts` | withTimeout 적용 | 케이스 B — 홈 무한 로딩 |
| 4 | `src/hooks/useQuiz.ts` | withTimeout 적용 | 케이스 B — 퀴즈 화면 무한 로딩 |
| 5 | `src/app/quiz/[packId]/complete/page.tsx` | withTimeout 적용 (결과 로드 + 저장/이동 핸들러) | 케이스 A + 케이스 B — 완료 화면 |

---

## 3. 수정 1 — `withTimeout` 유틸 함수 신규 생성

### 파일 경로

```
src/lib/utils/withTimeout.ts
```

### 작업 내용

이 파일은 **새로 생성**합니다. 기존에 존재하지 않는 파일입니다.

### 완성 코드

```typescript
/**
 * Promise에 타임아웃을 걸어주는 유틸 함수.
 * Supabase 쿼리가 유휴 후 끊어진 TCP 연결에서 hang되는 상황을 방지합니다.
 *
 * @param promise - 타임아웃을 적용할 Promise
 * @param ms - 타임아웃 시간 (밀리초, 기본값 8000ms)
 * @returns 원래 Promise와 경쟁하는 새 Promise (타임아웃 초과 시 에러 throw)
 */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
        ),
    ]);
}
```

---

## 4. 수정 2 — `AuthProvider.tsx` 3가지 수정

### 파일 경로

```
src/components/auth/AuthProvider.tsx
```

### 현재 파일 전체 내용 (참고용)

```typescript
'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User as DbUser } from '@/types/database';

// ... (AuthContextType interface, AuthContext 선언은 동일)

export function AuthProvider({ children }: { children: ReactNode }) {
    // ... (useState 선언들은 동일)

    const supabase = createClient();  // ← 수정 대상 A

    const fetchDbUser = async (authUser: User) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('provider_id', authUser.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    setDbUser(null);
                    setIsDbUserLoaded(true);
                    return;
                }
                return;  // ← 수정 대상 B: isDbUserLoaded 미갱신
            }
            // ...
        } catch {
            setIsDbUserLoaded(true);
        }
    };

    useEffect(() => {
        // initializeAuth, onAuthStateChange ...

        return () => {
            subscription.unsubscribe();
            // ← 수정 대상 C: Page Visibility 이벤트 리스너 추가
        };
    }, []);
```

### 수정 A — `supabase` 인스턴스를 `useMemo`로 고정

**변경 전 (28번째 줄 근처):**

```typescript
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
```

```typescript
const supabase = createClient();
```

**변경 후:**

`import` 문에 `useMemo` 추가:

```typescript
import { createContext, useContext, useEffect, useState, useRef, useMemo, ReactNode } from 'react';
```

`supabase` 선언 변경:

```typescript
const supabase = useMemo(() => createClient(), []);
```

### 수정 B — `fetchDbUser`의 에러 침묵 처리 수정

`PGRST116`이 아닌 에러(네트워크 에러, 타임아웃 등) 발생 시 `isDbUserLoaded`가 갱신되지 않아 이후 서비스 페이지 로딩이 영원히 대기하는 버그입니다.

**변경 전 (`fetchDbUser` 내 `if (error)` 블록):**

```typescript
if (error) {
    if (error.code === 'PGRST116') {
        setDbUser(null);
        setIsDbUserLoaded(true);
        return;
    }
    // 그 외 에러(네트워크, 타임아웃, 탭 동기화 AbortError 등)는 무시
    // → 기존에 로드된 dbUser가 있으면 그대로 유지
    return;
}
```

**변경 후:**

```typescript
if (error) {
    if (error.code === 'PGRST116') {
        setDbUser(null);
        setIsDbUserLoaded(true);
        return;
    }
    // 네트워크 에러, 타임아웃 등: 기존 dbUser는 유지하되 loaded는 반드시 true로 설정
    // → 미갱신 시 이후 마운트된 서비스 페이지가 영원히 대기하는 버그 방지
    setIsDbUserLoaded(true);
    return;
}
```

### 수정 C — Page Visibility API 추가 (연결 복구)

사용자가 탭을 오랫동안 떠났다가 돌아왔을 때 세션을 강제로 재확인하여 끊어진 TCP 연결을 재수립합니다.

`useEffect` 내부의 `return () => { subscription.unsubscribe(); };` 부분을 아래와 같이 교체합니다.

**변경 전:**

```typescript
return () => {
    subscription.unsubscribe();
};
```

**변경 후:**

```typescript
// 탭 재활성화 시 세션 재확인 → 끊어진 연결 복구
const handleVisibilityChange = async () => {
    if (!document.hidden && isInitialized.current) {
        try {
            const { data: { session: currentSession } } = await Promise.race([
                supabase.auth.getSession(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('getSession timeout')), 8000)
                ),
            ]);
            if (currentSession?.user) {
                await fetchDbUser(currentSession.user);
            }
        } catch {
            // getSession 자체가 hang되는 경우도 대비하여 조용히 무시
        }
    }
};

document.addEventListener('visibilitychange', handleVisibilityChange);

return () => {
    subscription.unsubscribe();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
};
```

> **주의:** `handleVisibilityChange`는 `useEffect` 내부의 `initializeAuth` 호출과 `onAuthStateChange` 구독 코드 **아래**, `return` 문 **바로 위**에 위치해야 합니다. `supabase`와 `fetchDbUser`, `isInitialized`를 클로저로 참조합니다.

---

## 5. 수정 3 — `useQuizpacks.ts`에 타임아웃 적용

### 파일 경로

```
src/hooks/useQuizpacks.ts
```

### 수정 내용

파일 상단 import에 `withTimeout` 추가 후, `getQuizpacksWithStatus` 호출에 타임아웃 적용.

**변경 전 (import 영역):**

```typescript
import { QuizpackWithStatus, getQuizpacksWithStatus } from '@/lib/api/quizpacks';
import { useAuth } from '@/components/auth';
```

**변경 후:**

```typescript
import { QuizpackWithStatus, getQuizpacksWithStatus } from '@/lib/api/quizpacks';
import { useAuth } from '@/components/auth';
import { withTimeout } from '@/lib/utils/withTimeout';
```

**변경 전 (`fetchQuizpacks` 내 try 블록):**

```typescript
try {
    const data = await getQuizpacksWithStatus(dbUser.id);
    setQuizpacks(data);
} catch (err: any) {
    if (err?.name === 'AbortError') return;
    console.error('퀴즈팩 조회 에러:', err);
    setError(err instanceof Error ? err : new Error('퀴즈팩을 불러오는데 실패했습니다.'));
} finally {
    setIsLoading(false);
}
```

**변경 후:**

```typescript
try {
    const data = await withTimeout(getQuizpacksWithStatus(dbUser.id), 10000);
    setQuizpacks(data);
} catch (err: any) {
    if (err?.name === 'AbortError') return;
    console.error('퀴즈팩 조회 에러:', err);
    setError(err instanceof Error ? err : new Error('퀴즈팩을 불러오는데 실패했습니다.'));
} finally {
    setIsLoading(false);  // 타임아웃 포함 반드시 실행되어 무한 로딩 해제
}
```

> **핵심:** `finally`의 `setIsLoading(false)`는 이미 있는 코드입니다. `withTimeout`을 적용하면 `getQuizpacksWithStatus`가 hang되더라도 10초 후 에러를 throw하여 `catch` → `finally`가 반드시 실행됩니다.

---

## 6. 수정 4 — `useQuiz.ts`에 타임아웃 적용

### 파일 경로

```
src/hooks/useQuiz.ts
```

### 수정 내용

파일 상단 import에 `withTimeout` 추가 후, `loadQuizzes` 함수 내 Supabase 호출들에 타임아웃 적용.

**변경 전 (import 영역, 파일 첫째 줄 근처):**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { Quiz, QuizPackData, getQuizzesByPackId, saveQuizProgress, getUserQuizProgress, saveUserQuizAnswer, getUserQuizpackId, getUserPreviousAnswers, updateUserQuizpackCurrentOrder, initializeUserQuizpack, resetUserQuizpack } from '@/lib/api/quiz';
```

**변경 후 (import 마지막 줄 아래에 추가):**

```typescript
import { withTimeout } from '@/lib/utils/withTimeout';
```

**변경 전 (`loadQuizzes` 내 주요 await 호출들, 약 102번째 줄 근처):**

```typescript
const data = await getQuizzesByPackId(packId);
```

**변경 후:**

```typescript
const data = await withTimeout(getQuizzesByPackId(packId), 10000);
```

**변경 전 (dbUser 있을 때 퀴즈팩 초기화, 약 115번째 줄 근처):**

```typescript
try {
    userQuizpackId = await initializeUserQuizpack(dbUser.id, packId);
} catch (err) {
    console.error('퀴즈팩 초기화 실패:', err);
}
```

**변경 후:**

```typescript
try {
    userQuizpackId = await withTimeout(initializeUserQuizpack(dbUser.id, packId), 8000);
} catch (err) {
    console.error('퀴즈팩 초기화 실패:', err);
}
```

**변경 전 (진행 상태 조회, 약 122번째 줄 근처):**

```typescript
const progress = await getUserQuizProgress(dbUser.id, packId);
```

**변경 후:**

```typescript
const progress = await withTimeout(getUserQuizProgress(dbUser.id, packId), 8000);
```

**변경 전 (이전 답변 조회, 약 138번째 줄 근처):**

```typescript
const previousAnswers = await getUserPreviousAnswers(userQuizpackId);
```

**변경 후:**

```typescript
const previousAnswers = await withTimeout(getUserPreviousAnswers(userQuizpackId), 8000);
```

> **`loadQuizzes`의 catch 블록 확인:** 현재 코드의 최상위 `catch` 블록에서 `setState({ isLoading: false })`를 설정하고 있습니다. `withTimeout`을 적용하면 hang 시 10초 후 에러를 throw하여 이 `catch` 블록이 반드시 실행됩니다. `finally`는 별도로 없지만, `catch`에서 `isLoading: false`를 설정하므로 정상 동작합니다.

---

## 7. 수정 5 — `complete/page.tsx`에 타임아웃 적용

### 파일 경로

```
src/app/quiz/[packId]/complete/page.tsx
```

### 수정 내용

이 파일은 두 곳에 타임아웃이 필요합니다.

- **수정 5-A:** 결과 로드 (`loadResult`) — 케이스 B 방지
- **수정 5-B:** 저장 후 이동 (`handleSaveAndNavigate`) — 케이스 A 방지

**변경 전 (import 영역):**

```typescript
import { getUserQuizProgress, updateQuizpackStatistics, saveQuizpackRating, unlockNextQuizpack, getUserQuizpackId, resetUserQuizpack } from '@/lib/api/quiz';
```

**변경 후 (import 줄 아래에 추가):**

```typescript
import { withTimeout } from '@/lib/utils/withTimeout';
```

### 수정 5-A — `loadResult` 함수

**변경 전 (`loadResult` 내부, 약 44번째 줄 근처):**

```typescript
async function loadResult() {
    if (!dbUser?.id) return;

    try {
        const progress = await getUserQuizProgress(dbUser.id, packId);
        if (progress) {
            setResult({
                // ...
            });
        }
    } catch (error) {
        console.error('결과 로드 에러:', error);
    } finally {
        setIsLoading(false);
    }
}
```

**변경 후:**

```typescript
async function loadResult() {
    if (!dbUser?.id) return;

    try {
        const progress = await withTimeout(getUserQuizProgress(dbUser.id, packId), 10000);
        if (progress) {
            setResult({
                // ... (내부 내용은 동일)
            });
        }
    } catch (error) {
        console.error('결과 로드 에러:', error);
    } finally {
        setIsLoading(false);  // 타임아웃 포함 반드시 실행
    }
}
```

> `finally`의 `setIsLoading(false)`는 이미 있는 코드입니다. `withTimeout` 적용으로 hang 시에도 반드시 실행됩니다.

### 수정 5-B — `handleSaveAndNavigate` 함수

현재 코드는 `await` 직렬 체인 형태로, hang 시 `catch`조차 실행되지 않아 버튼이 "저장 중…"으로 영원히 굳습니다. `withTimeout`을 각 `await`에 적용하고, `finally`로 `setIsSaving(false)`를 보장합니다.

**변경 전 (약 155번째 줄 근처):**

```typescript
const handleSaveAndNavigate = useCallback(async (destination: 'next' | 'home') => {
    if (!dbUser?.id || !result) return;

    setIsSaving(true);
    try {
        // 1. 퀴즈팩 통계 업데이트
        await updateQuizpackStatistics(
            packId,
            result.correctCount,
            result.totalQuizCount
        );

        // 2. 평점 저장 (선택한 경우에만)
        if (rating > 0) {
            await saveQuizpackRating(dbUser.id, packId, rating);
        }

        // 3. 다음 퀴즈팩 해금 및 이동 처리
        if (destination === 'next') {
            const nextPackId = await unlockNextQuizpack(dbUser.id, packId);

            if (nextPackId) {
                const nextUserPackId = await getUserQuizpackId(dbUser.id, nextPackId);
                if (nextUserPackId) {
                    await resetUserQuizpack(nextUserPackId);
                }
                router.push(`/quiz/${nextPackId}?restart=true`);
            } else {
                router.push('/?allClear=true');
            }
        } else {
            const nextPackId = await unlockNextQuizpack(dbUser.id, packId);
            if (!nextPackId) {
                router.push('/?allClear=true');
            } else {
                router.push('/');
            }
        }
    } catch (error) {
        console.error('저장 에러:', error);
        router.push('/');
    }
}, [dbUser?.id, packId, result, rating, router]);
```

**변경 후:**

```typescript
const handleSaveAndNavigate = useCallback(async (destination: 'next' | 'home') => {
    if (!dbUser?.id || !result) return;

    setIsSaving(true);
    try {
        // 1. 퀴즈팩 통계 업데이트
        await withTimeout(
            updateQuizpackStatistics(packId, result.correctCount, result.totalQuizCount),
            8000
        );

        // 2. 평점 저장 (선택한 경우에만)
        if (rating > 0) {
            await withTimeout(saveQuizpackRating(dbUser.id, packId, rating), 8000);
        }

        // 3. 다음 퀴즈팩 해금 및 이동 처리
        if (destination === 'next') {
            const nextPackId = await withTimeout(unlockNextQuizpack(dbUser.id, packId), 8000);

            if (nextPackId) {
                const nextUserPackId = await withTimeout(getUserQuizpackId(dbUser.id, nextPackId), 8000);
                if (nextUserPackId) {
                    await withTimeout(resetUserQuizpack(nextUserPackId), 8000);
                }
                router.push(`/quiz/${nextPackId}?restart=true`);
            } else {
                router.push('/?allClear=true');
            }
        } else {
            const nextPackId = await withTimeout(unlockNextQuizpack(dbUser.id, packId), 8000);
            if (!nextPackId) {
                router.push('/?allClear=true');
            } else {
                router.push('/');
            }
        }
    } catch (error) {
        // 타임아웃이든 실제 에러든 이동은 반드시 보장
        console.error('저장 에러 (타임아웃 포함):', error);
        router.push('/');
    } finally {
        // hang 여부와 무관하게 저장 중 상태 해제
        setIsSaving(false);
    }
}, [dbUser?.id, packId, result, rating, router]);
```

> **핵심 변경 2가지:**
> 1. 각 `await`에 `withTimeout` 적용 → hang 시 8초 후 `catch`로 탈출하여 `router.push('/')`로 이동 보장
> 2. `finally { setIsSaving(false) }` 추가 → 어떤 경우에도 버튼 상태 복구 보장

---

## 8. 수정 순서 및 검증 방법

### 권장 수정 순서

```
1. withTimeout.ts 생성
2. AuthProvider.tsx 수정 (A → B → C 순서)
3. useQuizpacks.ts 수정
4. useQuiz.ts 수정
5. complete/page.tsx 수정
```

각 수정은 독립적이므로 순서를 바꿔도 무관합니다. 다만 `withTimeout.ts`는 다른 파일에서 import하므로 반드시 먼저 생성해야 합니다.

### 타입스크립트 컴파일 확인

모든 수정 완료 후 아래 명령으로 타입 에러 여부를 확인합니다.

```bash
npx tsc --noEmit
```

### 수동 검증 시나리오

1. 서비스 페이지(홈)를 열어둔 채 **5분 이상 방치** (또는 다른 탭으로 이동 후 복귀)
2. 퀴즈팩 카드를 클릭하거나 페이지 이동 시도
3. **기대 동작:** 10초 이내에 페이지가 정상 로딩되거나 에러 메시지 표시 (무한 로딩 없음)
4. 완료 화면에서 "다음 퀴즈팩 시작" 또는 "홈으로 가기" 버튼 클릭
5. **기대 동작:** 8초 이내에 이동하거나 홈으로 fallback (버튼이 영원히 "저장 중…"으로 굳지 않음)

---

## 9. 수정 범위 외 참고 사항

아래 항목은 이번 수정 범위에 포함되지 않지만, 관련 맥락으로 참고하시기 바랍니다.

- **`useQuiz.ts`의 XP 처리 비동기 블록** (`checkAnswer` 내 IIFE): 이미 `catch`로 에러를 무시하는 구조이므로 hang 발생 시에도 UI는 영향받지 않습니다. 별도 타임아웃 불필요.
- **`saveProgress`, `completeQuizPack`** (`useQuiz.ts`): 이 함수들은 퀴즈 진행 중에 직접 호출되며, 호출부(`complete/page.tsx` 이전 단계)에서 이미 에러가 무시되거나 throw됩니다. `complete/page.tsx`의 수정 5-B가 적용되면 이 함수들의 hang도 8초 후 탈출이 보장됩니다.
- **랭킹 페이지, 마이페이지**: 현재 코드를 확인하지 않았으나, 동일한 `'use client'` + Supabase 훅 패턴을 사용한다면 각 페이지의 데이터 페칭 훅에도 `withTimeout`을 동일하게 적용하는 것을 권장합니다.
