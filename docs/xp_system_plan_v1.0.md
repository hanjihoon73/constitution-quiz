# XP 시스템 설계 v1.0

> **목표**: 사용자의 퀴즈 풀이 활동에 대해 경험치(XP)를 지급/차감하는 시스템을 설계하고 DB 테이블 및 백엔드 로직을 구현합니다.

## 사용자 리뷰 필요 사항

> [!IMPORTANT]
> 아래 설계를 검토 후, 수정이 필요한 부분이 있으면 알려주세요. 확정되면 구현을 시작합니다.

---

## 1. XP 규칙 요약

| 구분 | 조건 | XP |
|------|------|----|
| 온보딩 완료 | 닉네임 확정 시 | +500 |
| 퀴즈 정답 (상) | 정답 시 | +30 |
| 퀴즈 정답 (중상) | | +25 |
| 퀴즈 정답 (중) | | +20 |
| 퀴즈 정답 (중하) | | +15 |
| 퀴즈 정답 (하) | | +10 |
| 힌트 사용 (상) | 힌트 버튼 클릭 시 | -15 |
| 힌트 사용 (중상) | | -13 |
| 힌트 사용 (중) | | -10 |
| 힌트 사용 (중하) | | -7 |
| 힌트 사용 (하) | | -5 |
| 정답 콤보 | 2회 이상 연속 정답, 회당 | +20 |

### 제외 조건
- 퀴즈팩 **중단 후 초기화** 시 해당 퀴즈팩 임시 XP 초기화
- ~~완료한 퀴즈팩의 다시 풀기(2회차 이상)도 XP 지급/차감 적용~~ (v1.0 정책 변경: 모든 회차에서 XP 획득 가능)

### XP 확정 시점
- 마지막 퀴즈의 정오답 체크 완료 시 → 해당 퀴즈팩의 최종 XP 확정 지급
- 완료 화면 이동 여부와 무관하게 마지막 퀴즈 체크 시점에 지급

---

## 2. DB 스키마 변경

### 2-1. `quiz_difficulty` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `xp_correct` | integer NOT NULL DEFAULT 0 | 정답 시 획득 XP |
| `xp_hint` | integer NOT NULL DEFAULT 0 | 힌트 사용 시 차감 XP (양수로 저장, 차감 시 음수 처리) |

**데이터 업데이트**:

| id | label | xp_correct | xp_hint |
|----|-------|------------|---------|
| 1 | 하 | 10 | 10 |
| 2 | 중하 | 15 | 15 |
| 3 | 중 | 20 | 20 |
| 4 | 중상 | 25 | 25 |
| 5 | 상 | 30 | 30 |

### 2-2. `user_quizzes` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `hint_used` | boolean NOT NULL DEFAULT false | 힌트 사용 여부 |

### 2-3. `user_quizpacks` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `pending_xp` | integer NOT NULL DEFAULT 0 | 진행 중 임시 누적 XP (확정 전) |

### 2-4. `users` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `total_xp` | integer NOT NULL DEFAULT 0 | 사용자 총 XP (누적) |
| `weekly_xp` | integer NOT NULL DEFAULT 0 | 이번 주 획득 XP (매주 월요일 00:00 KST 리셋, 리그용) |

### 2-5. `users_xp_history` 테이블 — 신규 생성

사용자별 XP 변동 이력을 기록합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | bigint PK | 자동 증가 |
| `user_id` | bigint NOT NULL → `users.id` | 사용자 FK |
| `xp_type` | varchar NOT NULL | XP 유형 (아래 참고) |
| `xp_amount` | integer NOT NULL | XP 변동량 (+/-) |
| `source_id` | bigint NULL | 관련 엔티티 ID (user_quizpacks.id 또는 NULL) |
| `is_league_target` | boolean NOT NULL DEFAULT false | 리그 XP 집계 대상 여부 |
| `description` | text NULL | 상세 설명 |
| `created_at` | timestamptz DEFAULT now() | 생성 시각 |

**xp_type 값 목록**:

| xp_type | 설명 | 예시 xp_amount | is_league_target |
|---------|------|----------------|------------------|
| `onboarding` | 온보딩 완료 | +500 | `false` (1회성 보너스이므로 리그 대상 제외) |
| `quizpack_complete` | 퀴즈팩 완료 XP 확정 (모든 회차) | +180 (해당 팩 총합) | `true` (리그 대상) |

> [!NOTE]
> 개별 퀴즈의 정답/힌트/콤보 XP는 각각 기록하지 않고, 퀴즈팩 완료 시 총합으로 한 건만 기록합니다. 이유:
> - 개별 기록은 퀴즈 10개 × 3종(정답/힌트/콤보) = 최대 30건의 레코드가 매 퀴즈팩마다 생성되어 비효율적
> - 퀴즈팩 중단/초기화 시 해당 기록을 모두 삭제해야 하는 복잡성 발생
> - `pending_xp`에 실시간 합산하고, 확정 시 총합 한 건만 히스토리에 기록하는 것이 직관적

### RLS 정책

| 테이블 | 읽기 | 쓰기 | 설명 |
|--------|------|------|------|
| `users_xp_history` | 본인만 | 본인만 | 개인 XP 이력 |

---

## 3. XP 처리 흐름

### 3-1. 온보딩 완료 XP (+500)

```
닉네임 확정 (handleSubmit)
  → users INSERT 성공
  → users.total_xp = 500 (INSERT 시 기본값 또는 직후 UPDATE)
  → users_xp_history INSERT (xp_type='onboarding', xp_amount=500)
```

### 3-2. 퀴즈 풀이 중 XP 누적

```
퀴즈 정오답 체크 시 (모든 회차):
  1. 정답인 경우 → pending_xp += xp_correct (난이도별)
  2. 힌트를 사용한 경우 → pending_xp -= xp_hint (난이도별)
  3. 연속 정답 콤보 (2회 이상) → pending_xp += 20

  → user_quizpacks.pending_xp UPDATE
```

### 3-3. 퀴즈팩 완료 XP 확정

```
마지막 퀴즈 정오답 체크 완료 시 (모든 회차):
  → users.total_xp += user_quizpacks.pending_xp
  → users.weekly_xp += user_quizpacks.pending_xp (리그용 주간 XP)
  → users_xp_history INSERT (
      xp_type='quizpack_complete',
      xp_amount=pending_xp,
      source_id=user_quizpacks.id,
      is_league_target=true
    )
  → user_quizpacks.pending_xp 는 기록용으로 유지 (초기화 안 함)
```

### 3-4. 퀴즈팩 중단/초기화 시

```
다른 퀴즈팩 시작으로 현재 퀴즈팩 초기화 시 (abortInProgressQuizpack):
  → user_quizpacks.pending_xp = 0 으로 리셋
  → users.total_xp 변동 없음 (아직 확정 전이므로)
  → users_xp_history 기록 없음
```

### 3-5. 다시 풀기 (2회차 이상)

```
session_number >= 2인 경우에도:
  → 1회차와 동일하게 XP 획득/차감 적용
  → pending_xp 누적 후 완료 시 확정
  → users_xp_history에 기록
```

---

## 4. 콤보 XP 처리 상세

- **프론트엔드**에서 `comboCount` 상태 관리
- 정답 시: `comboCount += 1`
- 오답 시: `comboCount = 0`
- `comboCount >= 2`일 때 매 정답마다 콤보 XP (+20)를 `pending_xp`에 추가
- 마지막 퀴즈까지 콤보가 이어지면 마지막 퀴즈도 콤보 XP 포함

---

## 5. 리그 시스템 사전 준비

> [!NOTE]
> 리그 시스템 자체는 XP 구현 완료 후 별도 설계 예정. 여기서는 XP 구현 시 리그에 필요한 기반 데이터를 미리 준비합니다.

### 설계 핵심

| 항목 | 설명 |
|------|------|
| `users.weekly_xp` | 이번 주 리그 대상 XP. 주간 리그 순위 비교에 직접 사용 (매번 SUM 쿼리 불필요) |
| `is_league_target` | 온보딩 등 1회성 XP를 리그 집계에서 제외. 추후 이벤트 XP 등 추가 시에도 대상 여부 제어 가능 |
| 주간 리셋 | 매주 월요일 00:00 KST에 `users.weekly_xp = 0` 일괄 리셋 (Supabase pg_cron 또는 Edge Function 활용) |

### 주간 XP 리셋 전략

```
매주 월요일 00:00 KST (pg_cron 등):
  → UPDATE users SET weekly_xp = 0 WHERE weekly_xp > 0
```

> [!TIP]
> 지금은 리셋 함수만 준비해두고, 실제 cron 스케줄 등록은 리그 시스템 구현 시에 합니다. 수동 테스트용으로 함수를 호출해서 동작을 확인할 수 있습니다.

### 리그 순위 조회 쿼리 (향후 활용 예시)

```sql
SELECT id, nickname, weekly_xp
FROM users
WHERE is_active = true AND weekly_xp > 0
ORDER BY weekly_xp DESC
LIMIT 100;
```

---

## 6. 수정 대상 파일 목록

### DB 마이그레이션 (Supabase)

#### [MIGRATION] quiz_difficulty에 xp_correct, xp_hint 컬럼 추가 + 데이터 업데이트
#### [MIGRATION] user_quizzes에 hint_used 컬럼 추가
#### [MIGRATION] user_quizpacks에 pending_xp 컬럼 추가
#### [MIGRATION] users에 total_xp, weekly_xp 컬럼 추가
#### [MIGRATION] users_xp_history 테이블 생성 + RLS 정책 (is_league_target 포함)

---

### 백엔드 API

#### [NEW] [xp.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/lib/api/xp.ts)
XP 관련 API 함수 모듈:
- `grantOnboardingXP(userId)` — 온보딩 XP 지급 (is_league_target=false)
- `calculateQuizXP(difficultyId, isCorrect, hintUsed, comboCount)` — 퀴즈 1문제 XP 계산
- `updatePendingXP(userQuizpackId, xpDelta)` — pending_xp 업데이트
- `confirmQuizpackXP(userId, userQuizpackId)` — 퀴즈팩 완료 시 XP 확정 (total_xp + weekly_xp 동시 업데이트)
- `resetPendingXP(userQuizpackId)` — 중단/초기화 시 pending_xp 리셋
- `getUserXPHistory(userId)` — XP 이력 조회
- `resetWeeklyXP()` — 전체 사용자 weekly_xp 리셋 (주간 리셋용, 리그 구현 시 cron 연결)

#### [MODIFY] [quiz.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/lib/api/quiz.ts)
- `saveUserQuizAnswer()` — `hint_used` 파라미터 추가
- `abortInProgressQuizpack()` — `pending_xp = 0` 리셋 로직 추가
- `saveQuizProgress()` — 마지막 퀴즈 완료 시 XP 확정 로직 호출

---

### 프론트엔드

#### [MODIFY] [page.tsx (onboarding)](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/onboarding/page.tsx)
- `handleSubmit()` 내 users INSERT 후 `grantOnboardingXP()` 호출

#### [MODIFY] [QuizContent.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/components/quiz/QuizContent.tsx)
- 힌트 사용 시 `hintUsed` 상태 관리 및 상위 컴포넌트에 전달

#### [MODIFY] 퀴즈 풀이 페이지 (퀴즈 진행 관리 컴포넌트)
- `comboCount` 상태 관리
- `hintUsed` 상태를 `saveUserQuizAnswer()`에 전달
- 1회차 판별 후 XP 계산 및 `pending_xp` 업데이트
- 마지막 퀴즈 체크 완료 시 XP 확정 함수 호출

---

## 7. 폴더 구조

```
src/
├── lib/
│   └── api/
│       ├── quiz.ts          ← 수정 (hint_used, pending_xp 리셋)
│       └── xp.ts            ← 신규 (XP 관련 API 함수 + 주간 리셋)
├── components/
│   └── quiz/
│       └── QuizContent.tsx  ← 수정 (hint_used 상태)
├── app/
│   ├── onboarding/
│   │   └── page.tsx         ← 수정 (온보딩 XP 지급)
│   └── quiz/
│       └── [packId]/
│           └── ...          ← 수정 (콤보/XP 로직)
```

---

## 8. 검증 방법

### 수동 테스트 (제이슨 확인)

1. **온보딩 XP**: 새 계정으로 회원가입 → 닉네임 확정 → DB에서 `users.total_xp = 500`, `users.weekly_xp = 0` (온보딩은 리그 대상 아님), `users_xp_history`에 `onboarding` + `is_league_target=false` 레코드 확인
2. **퀴즈 정답 XP**: 1회차 퀴즈팩에서 퀴즈 풀이 → `user_quizpacks.pending_xp` 정상 누적 확인
3. **힌트 차감 XP**: 힌트 사용 후 → `pending_xp` 감소 확인, `user_quizzes.hint_used = true` 확인
4. **콤보 XP**: 연속 정답 2회 이상 → 콤보 XP (+20) 정상 반영 확인
5. **퀴즈팩 완료 확정**: 마지막 퀴즈 체크 → `users.total_xp` 증가, `users.weekly_xp` 증가, `users_xp_history`에 `quizpack_complete` + `is_league_target=true` 레코드 확인
6. **중단/초기화**: 퀴즈팩 중간에 다른 팩 시작 → `pending_xp = 0` 확인, `total_xp`·`weekly_xp` 변동 없음 확인
7. **다시 풀기 XP 획득**: 완료된 퀴즈팩 다시 풀기 → XP 정상 누적 및 확정 확인
8. **주간 리셋**: `resetWeeklyXP()` 수동 호출 → `users.weekly_xp = 0` 확인, `total_xp`는 유지 확인

### DB 쿼리 검증 (아론 직접 실행)
- 각 단계별로 Supabase에서 관련 테이블 쿼리하여 데이터 정합성 확인
