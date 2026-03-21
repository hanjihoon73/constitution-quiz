# 주간 리그 시스템 구현 계획

이 문서는 [docs/weekly_league_planning.md](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/docs/weekly_league_planning.md)의 기획 내용을 바탕으로 작성된 주간 리그 및 랭킹 시스템의 기술 구현 계획입니다.

## Proposed Changes

### 1. Database & Backend (Supabase)

#### [CREATE] RPC Function: `get_weekly_ranking`
별도의 `users_weekly_ranking` 테이블에 데이터를 복제하는 대신, 실시간으로 랭킹을 계산하여 반환하는 PostgreSQL 함수를 만듭니다.
- **성능 고려 (유저 피드백 반영)**: 조회 부하를 최소화하기 위해 랭킹 계산에 필요한 `users` 테이블의 컬럼(`weekly_xp`, `weekly_unique_packs_count`, `weekly_total_packs_count`, `quizpack_avrg_correct`)에 복합 인덱스(Compound Index)를 생성하여 정렬 및 순위 계산 속도를 극대화합니다.
- 특정 사용자의 랭킹 주변 컨텍스트(상/하위 N명)와 TOP 5를 함께 반환하는 로직을 포함합니다.

#### [MODIFY] `users` 테이블 구조 변경 (리그 랭킹 조건용)
이번 주(주간) 기준의 2차, 3차 정렬 조건을 O(1)으로 빠르게 조회하기 위해 주간 집계 컬럼을 추가하고, 4차 조건을 위한 누적 정답률 컬럼을 추가합니다.
- `weekly_unique_packs_count` (integer, default 0): 이번 주에 완료한 고유 퀴즈팩 개수. (2차 조건)
- `weekly_total_packs_count` (integer, default 0): 이번 주에 완료한 총 퀴즈팩 횟수 (반복 포함). (3차 조건)
- `quizpack_avrg_correct` (numeric, default 0): 누적 평균 정답률. (4차 조건)
- `total_correct_answers` (integer, default 0): 정답률 계산을 위한 누적 정답 수.
- `total_quiz_attempts` (integer, default 0): 정답률 계산을 위한 누적 풀이 수.

#### [MODIFY] XP 및 퀴즈 완료 시 업데이트 로직 ([api/xp.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/lib/api/xp.ts), `api/quiz.ts`)
- 퀴즈팩 완료 시 `users.weekly_unique_packs_count`와 `weekly_total_packs_count`를 상황에 맞게 증가시킵니다.
- 퀴즈 풀이 시 제출된 결과를 기반으로 `total_correct_answers`와 `total_quiz_attempts`를 누적하고, `quizpack_avrg_correct`를 다시 계산하여 업데이트합니다.

#### [CREATE] `users_ranking_history` 테이블
- 주간 리그가 종료될 때마다 사용자의 최종 순위 통계를 저장하는 테이블.
- 컬럼: `id`, `user_id`, `week_start_date`, `weekly_xp`, `rank`, `completed_unique_packs`, `total_completed_count`, `avrg_correct`, `created_at`.

#### [CREATE] 스케줄러 (Edge Function / pg_cron)
매주 월요일 0시 KST에 실행.
1. 현재 랭킹을 계산하여 상위 유저들의 기록을 `users_ranking_history`에 저장.
2. `users` 테이블의 주간 데이터(`weekly_xp`, `weekly_unique_packs_count`, `weekly_total_packs_count`)를 0으로 일괄 초기화.

---

### 2. Frontend UI/UX

#### [NEW] `src/components/league/LeagueFloatingButton.tsx`
- 홈 화면과 마이페이지에 표시될 플로팅 버튼.
- 트로피 아이콘 및 지정된 색상 테마(#FF8400 포인트) 적용.

#### [NEW] `src/components/league/LeagueEndPopup.tsx`
- 지난주 리그 결과를 보여주는 팝업.
- 순위별 안내 문구 분기 로직 포함 (`isFirstPlace`, `isTop5` 등).
- 쿠키(`league_end_popup_viewed_week_xxx`)를 사용하여 주 1회만 노출.

#### [NEW] `src/components/league/LeagueStartPopup.tsx`
- 새로운 리그 시작을 알리는 팝업.
- 쿠키를 활용하여 제어하며, EndPopup 유무에 따라 순차적 노출.
- **노출 조건 (유저 피드백 반영)**: 이번 주(월요일 0시 이후)에 `user_quizpacks` 테이블에서 `status='completed'`로 변경된(즉, `modified_at`이 이번 주 월요일 0시 이후인) 기록이 있는지 판단하여 리그 참여 여부를 결정하고 팝업을 노출합니다.

#### [NEW] `src/app/league/page.tsx` (or `/ranking`)
- 랭킹 메인 페이지. 
- [새로고침] 버튼 기능 연동.
- 랭커 목록 컴포넌트 구현:
  - 1위~5위까지는 고정 노출 (5명).
  - 본인 순위의 위로 7명, 본인 포함, 아래로 7명을 표시. (총 20명 내외 노출 지원).
  - 목록 아이템에 타이틀, 닉네임, 주간 XP 등 요구사항 데이터 표시.
  - 내 순위 아이템 하이라이팅 처리 (테두리 #FF8400, 자동 포커스 스크롤).

#### [MODIFY] [src/app/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/page.tsx), [src/app/profile/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/profile/page.tsx)
- 플로팅 버튼 컴포넌트 마운트.
- 팝업 매니저를 통해 조건부 팝업 마운트 로직 추가.

---

## Verification Plan

### Automated Tests
1. **정렬 우선순위 검증**: DB에 인덱스 설정 후, 다양한 케이스의 모의 데이터(Seed Data)로 RPC 함수(`get_weekly_ranking`)를 호출하여 기획서의 1~4차 정렬 순서대로 랭킹이 반환되는지 성능 테스트와 함께 검증.
2. **평균 정답률 검증**: 단위 테스트를 통해 퀴즈를 풀었을 때 (정답/오답) 누적 정답 수 및 시도 수가 증가하고 평균 정답률이 갱신되는지 확인.

### Manual Verification
1. 적용 후 임의 데이터 주입 및 로컬 서버 실행을 통해 랭킹 페이지 UI가 1~5위 및 본인 주변(상/하 7명)을 정확히 표시하는지 시각적으로 확인.
2. 팝업 노출 조건: 퀴즈팩 하나를 완료한 후 홈 화면 진입 시, 리그 시작 팝업이 노출되는지 검증하고 쿠키 동작 확인.

---

## Proposed Changes

### 1. Database & Backend (Supabase)

#### [CREATE] RPC Function: `get_weekly_ranking`
별도의 `users_weekly_ranking` 테이블에 데이터를 복제하는 대신, 실시간으로 랭킹을 계산하여 반환하는 PostgreSQL 함수를 만듭니다.
- **로직**: `users` 테이블을 읽어 조건(1차: weekly_xp, 2차: unique 팩 수, 3차: 전체 완료 수, 4차: 평균 정답률)에 따라 정렬하고 윈도우 함수(`RANK()`)를 적용하여 순위를 매깁니다.
- 특정 사용자의 랭킹 주변 컨텍스트(상/하위 N명)와 TOP 5를 함께 반환하는 로직을 포함합니다.

#### [MODIFY] `users` 테이블
- `quizpack_avrg_correct` (numeric, default 0) 컬럼 추가.
- (기획 확정에 따라 주간 통계용 컬럼이 추가로 필요할 수 있습니다).

#### [CREATE] `users_ranking_history` 테이블
- 주간 리그가 종료될 때마다 사용자의 최종 순위 통계를 저장하는 테이블.
- 컬럼: `id`, `user_id`, `week_start_date`, `weekly_xp`, `rank`, `completed_unique_packs`, `total_completed_count`, `avrg_correct`, `created_at`.

#### [CREATE] 스케줄러 (Edge Function / pg_cron)
매주 월요일 0시 KST에 실행되는 로직.
1. 현재 랭킹을 계산하여 `users_ranking_history`에 저장.
2. `users.weekly_xp` (및 필요한 경우 다른 주간 스탯)를 0으로 초기화.

---

### 2. Frontend UI/UX

#### [NEW] `src/components/league/LeagueFloatingButton.tsx`
- 홈 화면과 마이페이지에 표시될 플로팅 버튼.
- 트로피 아이콘 및 지정된 색상 테마 적용.

#### [NEW] `src/components/league/LeagueEndPopup.tsx`
- 지난주 리그 결과를 보여주는 팝업.
- 순위별 안내 문구 분기 로직 포함 (`isFirstPlace`, `isTop5` 등).
- 쿠키(`league_end_popup_viewed_week_xxx`)를 사용하여 주 1회만 노출.

#### [NEW] `src/components/league/LeagueStartPopup.tsx`
- 새로운 리그 시작을 알리는 팝업.
- 쿠키를 활용하여 제어하며, EndPopup 유무에 따라 순차적 노출.

#### [NEW] `src/app/league/page.tsx` (or `/ranking`)
- 랭킹 전체 페이지. 
- [새로고침] 버튼 기능 연동.
- 랭킹 리스트 아이템 컴포넌트 (`LeagueRankItem.tsx`).
- Framer Motion 등을 활용한 순차적 렌더링 애니메이션 구현.

#### [MODIFY] [src/app/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/page.tsx), [src/app/profile/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/profile/page.tsx)
- 플로팅 버튼 컴포넌트 마운트.
- 팝업 매니저를 통해 조건부 팝업 마운트 로직 추가.

---

## Verification Plan

### Automated Tests
1. **정렬 우선순위 검증**: 다양한 케이스의 `weekly_xp`, 완료 횟수, 정답률을 가진 모의 데이터(Seed Data)를 DB에 강제 주입하고, RPC 함수가 기획서의 1~4차 정렬 순서대로 정확하게 1위부터 N위까지를 뱉어내는지 쿼리 레벨에서 검증.
2. **리셋 로직 검증**: 월요일 0시 리셋 함수(또는 쿼리)를 수동 실행하여, `users_ranking_history`에 지난주 데이터가 올바르게 복사되는지, 그리고 `users.weekly_xp`가 0으로 초기화되는지 확인.

### Manual Verification
1. 적용 후 제이슨(USER)에게 임의의 데이터 주입 및 로컬 서버 실행을 요청하여 랭킹 페이지 UI가 1~5위 및 본인 주변(상/하 7명)을 정확히 표시하는지 시각적으로 확인.
2. 팝업 노출 우선순위 검증: 쿠키를 강제 삭제한 후 홈 진입 시, 리그 종료 팝업 -> 닫기 -> 리그 시작 팝업이 순차적으로 올바르게 뜨는지 확인.
3. 평균 정답률 로직 검증: 퀴즈를 풀고 정답/오답을 제출할 때마다 DB의 `users.quizpack_avrg_correct`가 기대값으로 업데이트되는지 확인.
