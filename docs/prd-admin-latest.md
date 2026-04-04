# PRD: 모두의 헌법 — 어드민 통합 문서

> **문서 버전**: 1.0
> **최종 업데이트**: 2026-04-01
> **목적**: `docs/` 폴더 내 어드민 관련 문서들을 단일 참조 소스로 통합한 PRD

---

## 목차

1. [어드민 시스템 개요](#1-어드민-시스템-개요)
2. [아키텍처 및 기술 구조](#2-아키텍처-및-기술-구조)
3. [인증 및 접근 제어](#3-인증-및-접근-제어)
4. [라우팅 구조](#4-라우팅-구조)
5. [대시보드 페이지](#5-대시보드-페이지)
6. [콘텐츠 관리 페이지](#6-콘텐츠-관리-페이지)
7. [사용자 관리 페이지](#7-사용자-관리-페이지)
8. [활동 관리 페이지](#8-활동-관리-페이지)
9. [리그 테스트 페이지](#9-리그-테스트-페이지)
10. [DB 정책 및 보안](#10-db-정책-및-보안)
11. [운영 정책](#11-운영-정책)

---

## 1. 어드민 시스템 개요

### 1.1 서비스 정의

"모두의 헌법" 서비스의 관리 및 운영을 위한 어드민 인터페이스. 동일한 Next.js 프로젝트 내 `/admin` 경로에 통합되어 있으며, Supabase Auth 기반 권한 제어로 관리자 계정만 접근 가능하다.

### 1.2 통합 개발 방식 채택 배경

별도 프로젝트 분리 대신 `/admin` 경로 통합 방식을 채택한 이유:

- **코드·타입 재사용**: Supabase 테이블 스키마와 TypeScript 타입을 별도 설정 없이 공유
- **관리 일원화**: 환경 변수, Supabase 설정, 공통 유틸리티를 단일 위치에서 관리
- **인증 연동**: 기존 Supabase Auth 시스템에 관리자 권한 체크 로직만 추가
- **배포 효율성**: 기존 Vercel 배포 환경을 그대로 활용

---

## 2. 아키텍처 및 기술 구조

### 2.1 폴더 구조

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx              # 어드민 전용 레이아웃 (사이드바 포함)
│       ├── page.tsx                # 대시보드 (리다이렉트 또는 직접 렌더)
│       ├── dashboard/
│       │   └── page.tsx            # 대시보드 페이지
│       ├── contents/
│       │   └── page.tsx            # 콘텐츠 관리 페이지
│       ├── users/
│       │   └── page.tsx            # 사용자 관리 페이지
│       ├── activity/
│       │   └── page.tsx            # 활동 관리 페이지
│       └── league-test/
│           └── page.tsx            # 리그 테스트 페이지
├── components/
│   └── admin/                      # 어드민 전용 UI 컴포넌트
│       ├── QuizDetailModal.tsx     # 퀴즈 상세 수정 모달
│       ├── QuizPreviewModal.tsx    # 퀴즈 미리보기 모달
│       └── ...
├── actions/
│   └── admin/
│       ├── users.ts                # 사용자 관련 서버 액션
│       ├── quizpacks.ts            # 퀴즈팩 관련 서버 액션
│       └── league.ts               # 리그 테스트 관련 서버 액션
└── middleware.ts                   # 어드민 경로 권한 체크
```

### 2.2 렌더링 전략

어드민 페이지는 **서버 컴포넌트(Server Component)** 를 기본으로 사용한다.

- 페이지 컴포넌트: `async function AdminXxxPage()` — `'use client'` 없는 서버 컴포넌트
- 데이터 조회: `'use server'` 서버 액션 호출 → Node.js 서버에서 Supabase Admin Client로 실행
- 모달·인터랙티브 요소: 클라이언트 컴포넌트로 분리 (`'use client'`)

### 2.3 Supabase 클라이언트 구분

| 구분 | 클라이언트 타입 | 사용 위치 |
|------|----------------|-----------|
| 어드민 데이터 조회/수정 | `createAdminClient` (service_role key) | 서버 액션 (`actions/admin/*.ts`) |
| 쿠키 기반 인증 확인 | `createServerClient` | 미들웨어, 서버 컴포넌트 |

**핵심**: 어드민 서버 액션은 브라우저 TCP 연결에 의존하지 않으므로, 서비스 영역에서 발생하는 무한 로딩 버그에 면역이다.

---

## 3. 인증 및 접근 제어

### 3.1 접근 권한

| 조건 | 접근 허용 |
|------|-----------|
| `users.role = 'admin'` | ✅ 어드민 + 서비스 영역 모두 접근 가능 |
| `users.role = 'user'` | ❌ 어드민 접근 불가 (미들웨어에서 차단) |
| 미인증 사용자 | ❌ 로그인 페이지로 리다이렉트 |

### 3.2 미들웨어 권한 체크

`src/middleware.ts`에서 `/admin` 경로에 대해 다음을 검사한다:

1. Supabase 세션 유효성 확인
2. `users.role = 'admin'` 여부 확인
3. 조건 불충족 시 `/` 또는 `/login`으로 리다이렉트

### 3.3 어드민 계정 URL

```
https://{domain}/admin
```

---

## 4. 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/admin` | 대시보드 | 진입점, 대시보드로 리다이렉트 또는 직접 렌더 |
| `/admin/dashboard` | 대시보드 | 서비스 지표 및 통계 |
| `/admin/contents` | 콘텐츠 관리 | 퀴즈팩·퀴즈 조회 및 수정 |
| `/admin/users` | 사용자 관리 | 회원 검색·필터·수정 |
| `/admin/activity` | 활동 관리 | XP·랭킹 통계 |
| `/admin/league-test` | 리그 테스트 | 리그 데이터 조작 도구 |

---

## 5. 대시보드 페이지

**경로**: `/admin/dashboard`
**렌더링**: 서버 컴포넌트 (데이터 서버에서 조회 후 렌더)

### 5.1 Active User 정의

- **Active User**: 해당 기간 중 퀴즈팩을 시작한 사용자
- **Timezone**: KST (한국 표준시, UTC+9) 기준으로 집계

### 5.2 표시 지표

| 지표 | 정의 | 계산식 |
|------|------|--------|
| **DAU** | 일간 활성 사용자 | 당일 KST 기준 퀴즈팩을 시작한 고유 사용자 수 |
| **WAU** | 주간 활성 사용자 | 최근 7일 기준 고유 사용자 수 |
| **MAU** | 월간 활성 사용자 | 최근 30일 기준 고유 사용자 수 |
| **Stickiness** | 서비스 점착도 | `(DAU ÷ MAU) × 100` (%) |
| **정답률** | 전체 정답률 | `(전체 정답 수 ÷ 전체 퀴즈 수) × 100` (%) |
| **완료율** | 퀴즈팩 완료율 | `(퀴즈팩 완료 사용자 수 ÷ Active User) × 100` (%) |
| **가장 빠른 사용자** | 진행 최선두 사용자 | `quizpack_loadmap` 기준 완료 퀴즈팩의 `pack_order`가 가장 큰 사용자 |
| **별점** | 평균 별점 | `average(quizpack_statistics.average_rating)` (별점이 기록된 전체 퀴즈팩 대상) |

### 5.3 가장 빠른 사용자 표시 정보

- 사용자 `id`
- 닉네임 (`users.nickname`)
- 완료한 퀴즈팩의 `pack_order`

---

## 6. 콘텐츠 관리 페이지

**경로**: `/admin/contents`
**렌더링**: 서버 컴포넌트 (초기 데이터) + 클라이언트 컴포넌트 (인터랙션)

### 6.1 퀴즈팩 목록

퀴즈팩에 속하는 퀴즈들을 **토글(펼치기/접기)** 방식으로 표시한다.

**퀴즈팩 목록 표시 항목:**

| 컬럼 | 데이터 소스 | 비고 |
|------|-------------|------|
| ID | `quizpacks.id` | 수정 불가 |
| 현재 퀴즈 수 | `quizpacks.quiz_count_all` | |
| 최대 퀴즈 수 | `quizpacks.quiz_max` | |
| 키워드 | `quizpacks.keywords` | |
| 상태 | `quizpacks.is_active` | `true` = "On" / `false` = "Off" |
| 별점 | `quizpack_statistics.average_rating` | 정보 없으면 "-" 표시 |
| [수정] 버튼 | — | 클릭 시 수정 모드 전환 |

**퀴즈팩 수정 모드:**

- 수정 가능 필드: 현재 퀴즈 수, 최대 퀴즈 수, 키워드, 상태
- 수정 불가 필드: ID
- [취소] 버튼: 클릭 시 조회 모드로 전환 (변경사항 미저장)
- [저장] 버튼: not null 조건 및 데이터 정합성 체크 후 DB 업데이트

### 6.2 퀴즈 목록

퀴즈팩 토글 펼치기 시 하위 퀴즈 목록이 노출된다.

**퀴즈 목록 표시 항목:**

| 컬럼 | 데이터 소스 | 비고 |
|------|-------------|------|
| ID | `quizzes.id` | |
| 순서 | `quizzes.quiz_order` | |
| 난이도 | `quizzes.difficulty_id` | 1=하 / 2=중하 / 3=중 / 4=중상 / 5=상 |
| 유형 | `quizzes.quiz_type` | 선다형 / OX / 빈칸채우기 |
| 문제 | `quizzes.question` | |
| 상태 | `quizzes.is_active` | ON 텍스트 라벨 + 점(dot) 병행 표기 |
| [미리보기] 버튼 | — | 퀴즈 화면 모달 표시 |
| [상세] 버튼 | — | 퀴즈 상세 수정 팝업 표시 |

### 6.3 QuizPreviewModal (퀴즈 미리보기 모달)

[미리보기] 버튼 클릭 시 노출. 앱 내 실제 퀴즈 화면과 동일한 환경을 렌더링한다.

- 힌트 표시
- 퀴즈 정오답 선택
- 정오답 체크
- 정오답 결과 표시

### 6.4 QuizDetailModal (퀴즈 상세 수정 모달)

[상세] 또는 [Edit] 버튼 클릭 시 노출. 퀴즈 유형(3가지)별로 전체 필드를 조회하고 수정한다.

**수정 가능 항목:**

| 항목 | UI 요소 | 비고 |
|------|---------|------|
| 문제 본문 | Textarea | |
| 지문 (Passage) | Textarea | 빈칸채우기 등에서 사용 |
| 추가 힌트 | Textarea | |
| 해설 | Textarea | |
| 선택지 (Choices) 4개 | 라디오/체크리스트 | 정답 여부 직관적 선택 |
| 난이도 | Select Box | 1=하 ~ 5=상 |
| 노출 상태 | ON/OFF 토글 라벨 | |

**저장 동작:**

- `updateQuiz`: 문제 메타데이터 UPSERT
- `updateQuizChoices`: 선택지 목록 UPSERT
- 저장 완료 후 부모 컴포넌트의 퀴즈 목록 자동 새로고침 (실시간 반영)

---

## 7. 사용자 관리 페이지

**경로**: `/admin/users`
**렌더링**: 서버 컴포넌트 (초기 데이터) + 클라이언트 인터랙션

### 7.1 검색

- 검색 대상: `users.id`, `users.nickname`
- 방식: **실시간 조회** (입력 시마다 즉시 필터링)

### 7.2 필터

필터 간 중복 적용 가능.

| 필터 항목 | 선택지 |
|-----------|--------|
| 계정 종류 | all / google / kakao |
| 권한 | all / user / admin |
| 상태 | all / true / false |
| 테스트 계정 | all / true / false |

### 7.3 정렬

| 정렬 기준 | 기본 정렬 방향 |
|-----------|---------------|
| ID | 오름차순 (default) |
| 가입 일시 | 선택 가능 |
| 마지막 로그인 | 선택 가능 |

### 7.4 사용자 목록 표시 항목

| 컬럼 | 데이터 소스 | 비고 |
|------|-------------|------|
| ID | `users.id` | |
| 계정 종류 | `users.provider` | |
| 닉네임 | `users.nickname` | |
| 타이틀 | `users.title` | |
| 권한 | `users.role` | |
| 상태 | `users.is_active` | `true` = "On" / `false` = "Off" |
| 가입 일시 | `users.created_at` | |
| 마지막 로그인 | `user_login_history` | |
| 테스트 계정 | `users.is_test` | `true` = "Y" / `false` = "N" |
| [수정] 버튼 | — | 클릭 시 수정 팝업 표시 |

### 7.5 사용자 정보 수정 팝업 (UserEditModal)

**수정 불가 항목:** ID, 계정 종류, 가입 일시

**수정 가능 항목:**

| 항목 | UI 요소 | 유효성 검사 |
|------|---------|-------------|
| 닉네임 | 텍스트 입력 | 실시간 중복 조회 및 안내 |
| 타이틀 | 드롭다운 메뉴 | |
| 권한 | 드롭다운 메뉴 | |
| 상태 | 토글 버튼 | |
| 테스트 계정 | 토글 버튼 | |

**버튼 동작:**

- [취소]: 팝업 종료 (변경사항 미저장)
- [저장]: not null 조건 및 데이터 정합성 체크 후 DB 업데이트

---

## 8. 활동 관리 페이지

**경로**: `/admin/activity`
**렌더링**: 서버 컴포넌트 (초기 데이터) + 클라이언트 인터랙션

### 8.1 검색

- 검색 대상: `users.id`, `users.nickname`
- 방식: **실시간 조회**

### 8.2 정렬

| 정렬 기준 | 기본 정렬 방향 |
|-----------|---------------|
| ID | 선택 가능 |
| 누적 XP | 내림차순 (default) |
| 주간 XP | 선택 가능 |
| 주간 랭킹 | 선택 가능 |

### 8.3 활동 목록 표시 항목

| 컬럼 | 데이터 소스 | 비고 |
|------|-------------|------|
| ID | `users.id` | |
| 닉네임 | `users.nickname` | |
| 타이틀 | `users.title` | |
| 누적 XP | `users.total_xp` | |
| 주간 XP | `users.weekly_xp` | |
| 주간 랭킹 | — | 실시간 조회 |
| 퀴즈 개수 | `users.total_quiz_attempts` | |
| 정답 개수 | `users.total_correct_answers` | |
| 평균 정답률 | `users.quizpack_avrg_correct` | |
| 주간 퀴즈팩 완료 개수 | `users.weekly_unique_packs_count` | 고유 퀴즈팩 기준 |
| 주간 퀴즈팩 완료 횟수 | `users.weekly_total_packs_count` | 중복 포함 전체 완료 횟수 |
| 퀴즈팩 완료율 | — | `(사용자 완료 퀴즈팩 수 ÷ 전체 퀴즈팩 수) × 100` (%) |
| 마지막 로그인 | `user_login_history` | |

---

## 9. 리그 테스트 페이지

**경로**: `/admin/league-test`
**렌더링**: 클라이언트 컴포넌트
**목적**: 주간 리그 기능 개발·QA 시 사용하는 데이터 조작 도구. `'서비스 페이지로 이동'` 기능을 제외한 `test-league.html`의 모든 기능을 어드민 UI 톤앤매너에 맞게 통합.

### 9.1 카드 구성 (5개)

#### 카드 1: 더미 데이터 제어

| 버튼 | 서버 액션 | RPC |
|------|-----------|-----|
| 100명 일괄 생성 | `createDummyLeagueUsers()` | `create_dummy_league_users` |
| 일괄 삭제 | `deleteDummyLeagueUsers()` | `delete_dummy_league_users` |

- 더미 유저 수: **100명** (기존 20명에서 상향)

#### 카드 2: 통계 조작

| 버튼 | 서버 액션 | RPC |
|------|-----------|-----|
| 랭킹 랜덤 변동 갱신 | `randomizeDummyLeagueScores()` | `randomize_dummy_league_scores` |

- 더미 유저의 주간 XP 등 통계를 랜덤 갱신하여 동적 랭킹 변동 테스트

#### 카드 3: 리그 리셋 매크로

| 버튼 | 서버 액션 | RPC |
|------|-----------|-----|
| 주간 리그 강제 초기화 (원클릭) | `resetWeeklyLeague()` | `reset_weekly_league` |

- 리그 생성 → 종료 → 보상 배분을 단일 액션으로 통합 (기존 3개 버튼을 1개로 통합)

#### 카드 4: 쿠키 도구

| 버튼 | 동작 |
|------|------|
| 팝업 쿠키 전체 삭제 | `document.cookie` 전체 루프 → `Expires` 갱신 → 클라이언트 쿠키 전체 만료 처리 |

- 리그 관련 팝업(주간 보상 등)의 쿠키를 초기화하여 재노출 테스트

#### 카드 5: 바로가기

| 버튼 | 동작 |
|------|------|
| 홈 화면 바로가기 | 서비스 홈(`/`) 탭 유지 이동 |

### 9.2 서버 액션 파일

**`src/actions/admin/league.ts`** 에 4개의 RPC 호출 액션 구현:

```
createDummyLeagueUsers()     → create_dummy_league_users RPC
deleteDummyLeagueUsers()     → delete_dummy_league_users RPC
randomizeDummyLeagueScores() → randomize_dummy_league_scores RPC
resetWeeklyLeague()          → reset_weekly_league RPC
```

---

## 10. DB 정책 및 보안

### 10.1 RLS (Row Level Security) 정책

어드민 서버 액션은 `service_role` 키를 사용하는 `createAdminClient`를 통해 RLS를 우회하여 전체 데이터에 접근한다. 단, 명시적 RLS 정책도 함께 설정한다.

**`users` 테이블:**

```sql
-- SELECT 정책
CREATE POLICY "admin_can_select_all_users"
ON users FOR SELECT
USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin');

-- UPDATE 정책
CREATE POLICY "admin_can_update_all_users"
ON users FOR UPDATE
USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin');
```

**`user_xp_history` 테이블:**

```sql
-- 어드민 전체 조회 권한
CREATE POLICY "admin_can_select_all_xp_history"
ON user_xp_history FOR SELECT
USING ((SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin');
```

### 10.2 어드민 데이터 조회 시 주의사항

- `createAdminClient` (`service_role` 키)는 서버 액션(`'use server'`) 내에서만 사용
- 절대로 클라이언트 컴포넌트나 브라우저에서 접근 불가
- 환경 변수 `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드 전용 (`.env.local`에서 `NEXT_PUBLIC_` 접두사 사용 금지)

---

## 11. 운영 정책

### 11.1 퀴즈팩 순서 변경 정책

퀴즈팩의 `pack_order` 변경은 기존 사용자의 진행 상태에 영향을 미치므로 신중하게 운영해야 한다.

**사용자 상태별 영향도 요약:**

| 사용자 상태 | 순서 변경 시 영향 |
|-------------|-----------------|
| 퀴즈팩 미시작 | 낮음. 새 순서 기준으로 첫 퀴즈팩만 `opened` |
| `closed` 상태 퀴즈팩 이동 | 이동 위치에 따라 `opened`/`closed` 전환 가능 |
| `opened` 상태 퀴즈팩 이동 | 뒤로 이동 시 `closed`로 돌변 위험 (DB 이력 없는 경우) |
| `in_progress` 상태 퀴즈팩 이동 | DB 이력 우선 적용 → 안전, 단 UI상 순서 역전 현상 가능 |
| `completed` 상태 퀴즈팩 이동 | 이동 후 위치의 다음 퀴즈팩 자동 해금 → 연쇄 파급 주의 |

**권장/비권장 운영 방식:**

| 구분 | 내용 |
|------|------|
| ✅ 권장 | 새 퀴즈팩을 **목록 가장 마지막**에 추가 (`closed` 상태로 배포) |
| ❌ 비권장 | 운영 중 기존 진행/완료 퀴즈팩의 순서를 뒤바꾸어 해금 체계 교란 |

> **원칙**: 앱이 이미 운영 중이고 사용자가 활동 중인 상황에서는 기존 퀴즈팩의 순서를 섣불리 변경하지 않는다.

### 11.2 퀴즈팩 상태 관리

- `quizpacks.is_active = false` ("Off"): 사용자 화면에 노출되지 않음
- 신규 퀴즈팩 배포 시 `is_active = false`로 먼저 등록한 후 준비 완료 시 `true`로 전환 권장

### 11.3 어드민 계정 정책

- 어드민 권한 사용자는 **서비스 영역과 어드민 영역 모두** 정상 사용 가능
- `users.role = 'admin'` 값은 DB에서 직접 설정 (어드민 UI에서도 권한 변경 가능하나 관리 주의 필요)
- 어드민 사용자도 서비스 이용 시 XP, 리그, 퀴즈 진행 이력이 동일하게 누적됨

### 11.4 리그 테스트 운영 주의사항

- 리그 테스트 페이지는 **개발/QA 환경 전용**으로 운영. 프로덕션 환경에서 무분별한 더미 데이터 생성·삭제 금지
- 더미 유저 생성 후 반드시 **일괄 삭제**로 정리 후 종료
- `reset_weekly_league` RPC 실행 시 현재 리그의 정산·보상이 즉시 처리되므로 타이밍 주의
