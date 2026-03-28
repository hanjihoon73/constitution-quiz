# 어드민 사용자 관리 조회 이슈 해결 및 기능 고도화 계획 (v2)

사용자 관리 페이지에서 어드민 본인만 조회되는 문제를 해결하고, 어드민 기능의 안정성을 높이기 위한 계획입니다.

## User Review Required

> [!IMPORTANT]
> **RLS 정책 수정**: `users` 테이블의 보안 정책(Row Level Security)을 수정하여 `admin` 권한을 가진 유저가 모든 유저의 데이터를 조회할 수 있도록 SQL을 실행할 예정입니다.

## Proposed Changes

### 1. Database (Supabase SQL)

#### [MODIFY] RLS Policies
어드민 권한을 가진 사용자가 모든 데이터를 보고 수정할 수 있도록 정책을 보완합니다.

- **users 테이블**: 
  - `SELECT`: `(SELECT role FROM users WHERE auth_id = auth.uid()) = 'admin'` 조건의 정책 추가.
  - `UPDATE`: 동일한 조건의 정책 추가.
- **user_xp_history 테이블**: 
  - 어드민의 전체 조회 권한 추가.

### 2. Admin Logic

#### [MODIFY] [users.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/actions/admin/users.ts)
- 서버 액션에서 쿼리 시 전체 사용자 조회가 보장되는지 확인.

### 3. Verification Plan

- **사용자 관리 페이지**: 어드민 계정으로 접속하여 모든 사용자가 목록에 나타나는지 확인.
- **활동 관리 페이지**: 자신의 로그뿐만 아니라 다른 사용자의 XP 로그도 정상적으로 조회되는지 확인.
