# 어드민 사이트 구축 구현 계획서

## 1. 개요
"모두의 헌법" 서비스 관리를 위한 통합 어드민 사이트를 구축합니다. 기존 프로젝트 내 `/admin` 경로를 활용하여 데이터와 인증 시스템을 공유합니다.

## 2. 주요 변경 사항

### [인프라 및 보안]
#### [MODIFY] [middleware.ts](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/middleware.ts)
- `/admin` 경로로 시작하는 요청에 대해 `users.role = 'admin'` 여부를 체크하는 로직 추가.
- 권한이 없는 경우 홈(`/`)으로 리다이렉트.

### [페이지 및 레이아웃]
#### [NEW] [admin/layout.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/layout.tsx)
- 어드민 전용 사이드바 및 헤더 레이아웃 구성.
#### [NEW] [admin/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/page.tsx)
- 대시보드: DAU, WAU, MAU, Stickness 지표 및 차트 표시.
#### [NEW] [admin/users/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/users/page.tsx)
- 사용자 관리: 검색, 필터링, 수정 팝업 기능.
#### [NEW] [admin/activities/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/activities/page.tsx)
- 활동 관리: 유저별 XP, 퀴즈 달성률 등 상세 로그 조회.
#### [NEW] [admin/contents/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/contents/page.tsx)
- 콘텐츠 관리: 퀴즈팩 목록 조회/수정, 노출 순서(`quizpack_loadmap`) 조정 및 하위 퀴즈 목록 관리.
#### [NEW] [admin/league-test/page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/app/admin/league-test/page.tsx)
- 리그 테스트 도구: 기존 `test-league.html` 기능(RPC 호출) 이관.

### [컴포넌트 및 액션]
#### [NEW] [src/components/admin/](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/components/admin/)
- `StatsCard`, `UserTable`, `UserEditModal` 등 어드민 전용 UI 컴포넌트.
- `QuizPreviewModal`: 실제 퀴즈 풀이 화면을 모달로 미리보기.
- `QuizEditPopup`: 퀴즈 유형별 상세 정보 수정.
#### [NEW] [src/actions/admin/](file:///d:/SynologyDrive/dev_projects/constitution-quiz/src/actions/admin/)
- `getAdminStats`: 대시보드 통계 조회 (Server Action).
- `updateUserAdmin`: 사용자 권한/상태 수정 (Server Action).
- `callLeagueRPC`: 리그 테스트용 RPC 호출 관리 (Server Action).

## 3. 폴더 및 파일 구성
```text
src/
├── app/
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx          (대시보드)
│       ├── users/
│       │   └── page.tsx      (사용자 관리)
│       ├── activities/
│       │   └── page.tsx      (활동 관리)
│       ├── contents/
│       │   └── page.tsx      (콘텐츠 관리)
│       └── league-test/
│           └── page.tsx      (리그 테스트)
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── StatsCard.tsx
│       ├── UserTable.tsx
│       ├── QuizPreviewModal.tsx
│       └── QuizEditPopup.tsx
├── actions/
│   └── admin/
│       ├── stats.ts
│       ├── users.ts
│       ├── contents.ts
│       └── league.ts
└── middleware.ts (업데이트)
```

## 4. 라이브러리 추가 계획
- `lucide-react`: 아이콘 활용 (기존 프로젝트 설치 유무 확인 후)
- `recharts`: 대시보드 그래프 (필요 시)
- `tanstack-table`: 복잡한 사용자 목록 관리 최적화

## 5. 검증 계획
### 자동화 및 매뉴얼 테스트
1. **권한 체크**: 일반 계정으로 `/admin` 접근 시 차단 여부 확인.
2. **데이터 정확성**: SQL 직접 쿼리 결과와 대시보드 DAU/WAU 수치 비교.
3. **기능 동작**: 사용자 닉네임 수정 및 리그 테스트 RPC 호출 후 DB 반영 확인.
