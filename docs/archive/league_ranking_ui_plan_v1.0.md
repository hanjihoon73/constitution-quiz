# [PLAN] 랭킹 페이지 타이틀 UI 개선 (v1.0)

랭킹 페이지의 상단 디자인을 시안과 동일하게 수정하여 시각적 완성도를 높입니다.

## 폴더 구조 및 파일 구성
```text
src/
  app/
    league/
      page.tsx          # 주요 수정 대상 (UI 로직 및 스타일링)
  components/
    common/
      index.ts          # 헤더 등 공통 컴포넌트 (참고용)
```

## Proposed Changes

### [Component] League Page Title & Controls
`src/app/league/page.tsx` 파일을 수정하여 시각적 요소를 추가하고 스타일을 변경합니다.

#### [MODIFY] [page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/league/page.tsx)
- **아이콘 추가**: `lucide-react`에서 `CircleHelp` 임포트 및 상단 컨트롤 영역(새로고침 버튼 좌측)에 추가
- **서브타이틀 추가**: 메인 타이틀(h1) 아래에 "Weekly Leaderboard" 텍스트 추가 (Secondary text 스타일)
- **리그 기간 포맷 수정**: `getCurrentWeekLabel` 함수 리턴값을 시안에 맞게 "YY.MM.DD ~ YY.MM.DD" 형식으로 변경
- **리그 기간 스타일링**: 
    - `div`와 `span`을 활용하여 우측 정렬된 튜브(캡슐) 형태 구현
    - 배경색: `#2D2D2D`, 글자색: `#FF8400`, 폰트 굵기: Bold 적용
    - `flex` 레이아웃 상에서 `justify-between` 등을 활용해 타이틀과 기간 표시 분리

## Verification Plan

### Automated Tests
- 현재 프로젝트에는 관련 UI 자동화 테스트가 없으므로, 빌드 에러 여부만 체크합니다.
- `npm run dev` 상태에서 실시간 반영 확인 (아론이 직접 수행)

### Manual Verification
1. `league` 페이지 접속 후 상단 타이틀 영역 확인
2. "주간 리그 랭킹" 아래 "Weekly Leaderboard"가 표시되는지 확인
3. 우측에 다크 튜브 스타일로 "26.03.16 ~ 26.03.23" 형태의 기간이 표시되는지 확인
4. 새로고침 버튼 좌측에 도움말(?) 아이콘이 추가되었고, 다른 버튼들과 정렬이 맞는지 확인
5. 모바일 뷰(360px ~ 430px)에서 레이아웃이 깨지지 않고 자연스러운지 확인
