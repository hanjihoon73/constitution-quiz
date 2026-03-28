# 리그 테스트 제어판 (test-league.html vs 현재 구현체) 분석 및 수정 계획

## 1. 개요
당초 기획된 `public/test-league.html` 도구와 현재 구현된 `src/app/admin/league-test/page.tsx` 제어판 페이지 간의 기능 불일치 및 누락 사항을 분석하고, 이를 바탕으로 기획과 100% 동일한 기능을 제공하기 위한 수정 계획입니다.

## 2. 발견된 오류 및 기능 불일치 상세 분석

### 2.1. 테스트 유저 제어 기능 누락 및 불일치
*   **기획 (`test-league.html`)**: 
    1) 더미 유저 생성 (`create_dummy_league_users`)
    2) 더미 유저 일괄 삭제 (`delete_dummy_league_users`)
*   **현재 구현**: 
    `generate_fake_league_data` 단일 기능만 구현되어 있으며, 테스트가 끝난 후 **더미 유저를 일괄 삭제하는 청소(Clean-up) 기능이 누락**되었습니다. (또한 이전 협의에 따라 더미 유저는 20명에서 100명으로 상향되어야 합니다.)

### 2.2. 통계 시뮬레이션(랜덤 갱신) 기능 완전 누락
*   **기획 (`test-league.html`)**: 
    *   더미 랭킹 데이터 랜덤 갱신 (`randomize_dummy_league_scores`) 
*   **현재 구현**: 
    해당 기능 및 매핑된 서버 액션이 **완전히 누락**되어, 동적인 랭킹 변동을 테스트할 수 없습니다.

### 2.3. 주간 리그 강제 리셋 매크로의 부재
*   **기획 (`test-league.html`)**: 
    *   주간 리그 강제 리셋 (`reset_weekly_league`) 
*   **현재 구현**: 
    `create_league`(생성), `end_league`(종료), `distribute_rewards`(보상) 세 가지 버튼으로 파편화되어 있어, 기획 의도와 달리 원클릭으로 초기화 매크로를 돌릴 수 없습니다.

### 2.4. 팝업 노출 쿠키 초기화 기능 완전 누락
*   **기획 (`test-league.html`)**: 
    *   팝업 쿠키 전체 삭제 (`clearCookies()`) 
*   **현재 구현**: 
    로컬 캐시/쿠키를 제어하는 프론트엔드 로직이 **완전히 누락**되었습니다.

---

## 3. 폴더 구조 및 파일 구성
이번 작업을 위해 수정 및 갱신될 파일의 구조는 다음과 같습니다.

```text
src/
├── actions/
│   └── admin/
│       └── league.ts            # [수정] 기획서에 명시된 4개의 매크로 RPC 호출 액션 추가
├── app/
│   └── admin/
│       └── league-test/
│           └── page.tsx         # [수정] test-league.html과 동일한 5개의 카드와 쿠키 삭제 로직 반영
└── docs/
    └── league_test_plan_v1.0.md # [신규] 본 구현 계획 문서
```

---

## 4. 구체적인 수정 계획 (Implementation Details)

### Phase 1: 서버 액션(`src/actions/admin/league.ts`) 재건
현재 파편화된 액션들 외에 `test-league.html`에서 사용했던 오리지널 통합 액션(RPC) 4종을 추가 및 교체합니다.
*   `createDummyLeagueUsers()`: 더미 100명 생성 (`create_dummy_league_users` RPC 호출)
*   `deleteDummyLeagueUsers()`: 더미 삭제 (`delete_dummy_league_users` RPC 호출)
*   `randomizeDummyLeagueScores()`: 랭킹 랜덤 조작 (`randomize_dummy_league_scores` RPC 호출)
*   `resetWeeklyLeague()`: 정산 및 초기화 매크로 (`reset_weekly_league` RPC 호출)

### Phase 2: 클라이언트 UI(`src/app/admin/league-test/page.tsx`) 전면 원복
`test-league.html` 의 5개 동작 카드 구조를 현 관리자 UI(어드민 사이드바) 톤앤매너에 맞게 재배치합니다.
1.  **더미 데이터 제어 카드**: "100명 일괄 생성" 버튼과 "일괄 삭제" 버튼 포함.
2.  **통계 조작 카드**: "랭킹 랜덤 변동 갱신" 버튼 포함.
3.  **리그 리셋 매크로 카드**: 주간 리그 강제 초기화 버튼 1개로 통합.
4.  **쿠키 도구 카드**: `document.cookie` 전체 루프 브라우저 로컬 쿠키 `Expires` 갱신 로직 추가.
5.  **바로가기 카드**: 홈 화면 바로가기 탭 유지.

> [!IMPORTANT]
> **사용자 피드백 요청 사항**
> 분석된 문제점과 제안된 해결책, 파일/폴더 구조에 동의하시나요?
> 동의해주시면 즉시 개발(Phase 1, 2)에 착수하여 코드를 정비하겠습니다.
