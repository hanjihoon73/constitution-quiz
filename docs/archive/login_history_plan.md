# 사용자 로그인/로그아웃 히스토리 저장 구현 계획 (v1.0)

## 1. 개요
현재 Supabase 데이터베이스에 `user_login_history` 테이블이 선언되어 있으나, 애플리케이션 내에 실제 로그인과 로그아웃 시 관련 데이터를 삽입(Insert)하는 로직이 누락되어 있습니다. 또한 기존 테이블 구조는 로그인 시점(`logged_in_at`)만 고려되어 있어, 로그아웃 이벤트도 함께 저장하기 위한 약간의 스키마 변경이 필요합니다.

## 2. 데이터베이스 스키마 수정 (Supabase)

기존 `user_login_history` 테이블에 대해 '로그인'과 '로그아웃'을 구분할 수 있는 `action` 컬럼을 추가하고, 이벤트 발생 시각 컬럼의 이름을 포괄적으로 변경합니다. (별도의 스키마 마이그레이션 도구인 Supabase SQL Editor를 통해 실행 필요)

**실행할 SQL:**
```sql
-- 1. 로그인/로그아웃 구분을 위한 action 컬럼 추가
ALTER TABLE user_login_history 
ADD COLUMN action VARCHAR(20) DEFAULT 'login' NOT NULL;

-- 2. logged_in_at 컬럼을 좀 더 범용적인 이름(created_at)으로 변경 권장 
--    (또는 기존 명칭을 유지하되 이벤트 발생 시각으로 사용)
ALTER TABLE user_login_history 
RENAME COLUMN logged_in_at TO created_at;

-- 3. created_at 컬럼에 기본값 NOW() 설정
ALTER TABLE user_login_history 
ALTER COLUMN created_at SET DEFAULT NOW();
```
> ※ 관련 타입 정의 (`src/types/database.ts`) 도 위 변경에 맞게 수정해야 합니다.

## 3. 코드 구현 위치 및 방법

### 3.1 로그인 히스토리 기록 (`src/app/auth/callback/route.ts`)
- **위치:** OAuth 인증 후 세션으로 교환되는 서버 콜백 라우트
- **내용:** `exchangeCodeForSession` 성공 직후, `users` 테이블 조회 후 조건에 해당될 때 `user_login_history` 테이블에 `action: 'login'` 기록 한 줄 추가 (Server action / API Level 삽입으로 안전함).

### 3.2 로그아웃 히스토리 기록 (`src/components/auth/AuthProvider.tsx`)
- **위치:** `AuthProvider` 내부의 `signOut` 함수
- **내용:** `supabase.auth.signOut()` 호출 **직전**에 현재 사용자의 정보(`user.id`, `dbUser.provider`)를 활용하여 `user_login_history` 테이블에 `action: 'logout'`으로 레코드 삽입.
- *참고: 명시적인 탭 닫기나 세션 자동 만료 등은 감지하기 어려우며, 사용자가 [로그아웃] 버튼을 클릭했을 때의 이벤트를 저장하는 방식으로 구현합니다.*

## 4. 작업 목록 (Task List)
- [ ] 1. Supabase SQL Editor를 통해 `user_login_history` 테이블에 `action` 컬럼 추가 및 컬럼 정리
- [ ] 2. `src/types/database.ts` 타입 정보 업데이트
- [ ] 3. `src/app/auth/callback/route.ts`에 로그인 히스토리 INSERT 로직 추가
- [ ] 4. `src/components/auth/AuthProvider.tsx`에 로그아웃 히스토리 INSERT 로직 추가
- [ ] 5. 실제 로그인/로그아웃 테스트 후 Supabase 테이블에 데이터가 정상적으로 쌓이는지 검증

## 5. 검증 계획
1. `npm run dev` 구동 후 로컬 환경 브라우저에서 서비스 접속
2. 구글 혹은 카카오로 **로그인** 진행
3. Supabase 대시보드 (Table Editor) 에서 `user_login_history` 테이블 조회 -> `action: 'login'` 정상 저장 확인
4. 마이페이지에서 **로그아웃** 버튼 클릭
5. Supabase 대시보드 `user_login_history` 테이블 조회 -> `action: 'logout'` 정상 저장 확인
