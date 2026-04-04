# XP 시스템 설계 v1.1 — 회차별 차등 지급 정책

> **목표**: 동일한 퀴즈팩을 반복 풀이하여 XP를 무한 획득하는 문제를 방지하기 위해, 완료 횟수(`completed_count`)에 따라 XP를 차등 지급하도록 시스템을 수정합니다.

## 사용자 리뷰 필요 사항

> [!IMPORTANT]
> 아래 설계를 검토 후, 수정이 필요한 부분이 있으면 알려주세요. 확정되면 구현을 시작합니다.

---

## 1. 변경 사항 요약

### 1-1. v1.0 → v1.1 정책 변경 비교

| 항목 | v1.0 (현재) | v1.1 (변경 후) |
|------|-------------|----------------|
| 1회차 XP | 100% 지급 | 100% 지급 (동일) |
| 2회차 XP | 100% 지급 | **50% 지급** |
| 3회차 이후 XP | 100% 지급 | **0% (XP 획득 불가)** |
| 힌트 차감 | 모든 회차 적용 | 1~2회차만 적용 (3회차 이후 XP 자체가 없으므로) |
| 콤보 보너스 | 모든 회차 적용 | 1~2회차만 적용 (3회차 이후 XP 자체가 없으므로) |

### 1-2. XP 배율 정의

```
XP_MULTIPLIER (completed_count 기준):
  0회 완료 → 1회차 플레이: ×1.0 (100%)
  1회 완료 → 2회차 플레이: ×0.5 (50%)
  2회 이상 완료 → 3회차+ 플레이: ×0.0 (0%)
  ※ 콤보 포인트도 동일하게 적용됨
```

### 1-3. 완료 횟수 판별 기준

> [!NOTE]
> 기존 `session_number`는 시작/중단 반복 시 값이 부정확해지는 문제가 있어, **`completed_count` 컬럼을 새로 추가**하여 완료 횟수를 관리합니다.
>
> - `completed_count = 0`: 한 번도 완료한 적 없음 → **1회차 플레이 (100%)**
> - `completed_count = 1`: 1회 완료 → **2회차 플레이 (50%)**
> - `completed_count >= 2`: 2회 이상 완료 → **3회차+ 플레이 (0%)**
>
> 기존 `session_number` 로직은 보기 셔플 시드 등에서 계속 사용되므로 변경하지 않습니다.

---

## 2. DB 스키마 변경

### 2-1. `user_quizpacks` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `completed_count` | integer NOT NULL DEFAULT 0 | 퀴즈팩 완료 횟수 (XP 배율 계산용) |

### 2-2. 기존 데이터 보정

```sql
-- users_xp_history에서 해당 user_quizpack의 quizpack_complete 레코드 수로 정확한 완료 횟수 설정
UPDATE user_quizpacks uq
SET completed_count = COALESCE(
    (SELECT COUNT(*) 
     FROM users_xp_history uxh 
     WHERE uxh.source_id = uq.id 
       AND uxh.xp_type = 'quizpack_complete'),
    0
);
```

> [!NOTE]
> `users_xp_history`에 `quizpack_complete` 레코드가 있는 경우, 그 개수가 정확한 완료 횟수입니다. 이력이 없으면 0으로 설정됩니다.

---

## 3. 수정 대상 파일 목록

### DB 마이그레이션 (Supabase)

#### [MIGRATION] user_quizpacks에 completed_count 컬럼 추가 + 기존 데이터 보정

---

### 백엔드 API

#### [MODIFY] [quiz.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/lib/api/quiz.ts)

- `saveQuizProgress()` — completed 시 `completed_count += 1` 업데이트 추가

```diff
 if (data.status === 'completed') {
     updateData.completed_at = new Date().toISOString();
     updateData.session_number = (existing.session_number || 0) + 1;
+    // completed_count를 DB에서 직접 증가시키기 위해 별도 RPC 또는 raw increment 사용
 }
```

#### [MODIFY] [xp.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/lib/api/xp.ts)

- `calculateQuizXP()` — `completedCount` 파라미터 추가

```typescript
export async function calculateQuizXP(
    difficultyId: number,
    isCorrect: boolean,
    hintUsed: boolean,
    comboCount: number,
    completedCount: number = 0  // 기본값 0 = 1회차
): Promise<number> {
    // 3회차 이후 (2회 이상 완료): XP 획득 불가
    if (completedCount >= 2) return 0;
    
    // ... 기존 XP 계산 로직 ...
    
    // 2회차 (1회 완료): 50% 적용 (반올림)
    if (completedCount === 1) {
        xpDelta = Math.round(xpDelta * 0.5);
    }
    
    return xpDelta;
}
```

---

### 프론트엔드

#### [MODIFY] [useQuiz.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/hooks/useQuiz.ts)

- 상태에 `completedCount` 추가 (기존 `sessionNumber`와 별도 관리)
- 퀴즈팩 진행 상태 조회 시 `completed_count`도 함께 가져오기
- `checkAnswer()` 내 `calculateQuizXP()` 호출 시 `completedCount` 전달
- **3회차 이후 진입 시 토스트 팝업 표시**: `completedCount >= 2`이면 1번 퀴즈 로딩 완료 시 "두 번 이상 완료한 퀴즈팩은 XP를 획득할 수 없습니다." 토스트 표시

```diff
 // 상태 초기화 시
+completedCount = progress?.completed_count || 0;

 // checkAnswer() 내 XP 계산
 const xpDelta = await calculateQuizXP(
     capturedDifficultyId,
     isCorrect,
     hintUsed,
     newComboCount,
+    state.completedCount
 );

+// 퀴즈 데이터 로드 완료 후 (loadQuizzes 내부)
+if (completedCount >= 2) {
+    toast.info('두 번 이상 완료한 퀴즈팩은 XP를 획득할 수 없습니다.', {
+        id: 'xp-disabled-toast',
+        duration: 3000
+    });
+}
```

#### [MODIFY] [QuizLayout.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/components/quiz/QuizLayout.tsx)

- `QuizPendingXpBadge`에 `disabled` prop 추가
- `disabled=true`일 때 XP 숫자와 라벨을 회색(`#9CA3AF`)으로 표시
- `QuizLayout`에 `isXpDisabled` prop 추가하여 `QuizPendingXpBadge`에 전달

#### [MODIFY] [page.tsx (quiz)](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/quiz/[packId]/page.tsx)

- `useQuiz`에서 `completedCount` 가져와서 `QuizLayout`에 `isXpDisabled={completedCount >= 2}` 전달

---

## 4. XP 처리 흐름 (v1.1)

```
퀴즈팩 진입 시:
  1. completedCount 확인 (user_quizpacks.completed_count)
  2. if completedCount >= 2 → 토스트 표시 + XP 배지 회색 비활성화

퀴즈 정오답 체크 시:
  1. if completedCount >= 2 → xpDelta = 0 (XP 획득 불가)
  2. else → 기존 XP 계산 (정답 + 힌트 차감 + 콤보)
  3. if completedCount === 1 → xpDelta = Math.round(xpDelta * 0.5) (반올림)
  4. pending_xp += xpDelta
```

### 예시 시나리오

| 상황 | completed_count | 정답(중) | 콤보(3연속) | 힌트 | 원래 XP | 배율 | 최종 XP |
|------|----------------|----------|------------|------|---------|------|---------|
| 1회차 플레이 | 0 | +20 | +20 | -20 | +20 | ×1.0 | **+20** |
| 2회차 플레이 | 1 | +20 | +20 | -20 | +20 | ×0.5 | **+10** (반올림) |
| 3회차 플레이 | 2 | — | — | — | — | ×0.0 | **0** (XP 비활성화 UI) |

### 시작/중단 반복 시나리오 (버그 방지 확인)

| 단계 | completed_count | XP 배율 |
|------|----------------|---------|
| 002번 최초 시작 | 0 | ×1.0 ✅ |
| 002번 중단 → 재시작 | 0 (변동 없음) | ×1.0 ✅ |
| 002번 중단 → 재시작 (반복) | 0 (변동 없음) | ×1.0 ✅ |
| 002번 1회 완료 | 0 → 1 | — |
| 002번 다시 풀기 | 1 | ×0.5 ✅ |
| 002번 2회 완료 | 1 → 2 | — |
| 002번 다시 풀기 | 2 | ×0.0 ✅ |

---

## 5. 폴더 구조 (변경 사항만)

```
src/
├── lib/
│   └── api/
│       ├── quiz.ts          ← 수정 (completed 시 completed_count 증가)
│       └── xp.ts            ← 수정 (completedCount 파라미터 + 반올림)
├── hooks/
│   └── useQuiz.ts           ← 수정 (completedCount 상태 + 3회차 토스트)
├── components/
│   └── quiz/
│       └── QuizLayout.tsx   ← 수정 (XP 배지 비활성화 UI)
├── app/
│   └── quiz/
│       └── [packId]/
│           └── page.tsx     ← 수정 (isXpDisabled prop 전달)
```

---

## 6. 검증 방법

### DB 쿼리 검증 (아론 직접 실행)

- 마이그레이션 후 `user_quizpacks.completed_count` 데이터 보정 결과 확인
- `users_xp_history`의 `quizpack_complete` 레코드 수와 `completed_count` 일치 여부 확인

### 수동 테스트 (제이슨 확인)

1. **1회차 XP**: 새 퀴즈팩 시작 → 정답 시 XP 100% 지급 확인
2. **2회차 XP**: 완료된 퀴즈팩 다시 풀기 → 정답 시 XP 50% 지급 확인 (반올림)
3. **3회차 XP**: 2회 완료된 퀴즈팩 다시 풀기 → XP 0 확인
4. **3회차 UI**: 2회 완료 후 퀴즈팩 진입 → 토스트 팝업 표시 확인 → XP 배지 회색 비활성화 확인
5. **시작/중단 반복**: 같은 퀴즈팩을 시작-중단 반복 → completed_count 변동 없음 확인
6. **콘솔 로그**: `[XP]` 로그에서 completedCount와 xpDelta 값 확인

---

## 7. 리그 시스템 연관성

> [!TIP]
> 이 XP 차등 지급 정책은 리그 시스템의 공정성을 위한 사전 작업입니다. `completed_count`는 리그 시스템에서도 활용 가능합니다 (예: "새로운 퀴즈팩 도전 보너스" 등).
