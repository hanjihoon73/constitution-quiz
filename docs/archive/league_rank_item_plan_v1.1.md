# [PLAN] 랭커 카드(RankItem) UI 개편 (v1.1)

랭킹 페이지의 개별 랭커 카드 디자인을 시안에 맞춰 고도화합니다.

## 폴더 구조 및 파일 구성
```text
src/
  app/
    league/
      page.tsx          # 주요 수정 대상 (RankItem 컴포넌트)
public/
  medal_gold.svg        # 1위 메달 (이미 존재)
  medal_silver.svg      # 2위 메달 (이미 존재)
  medal_bronze.svg      # 3위 메달 (이미 존재)
```

## Proposed Changes

### [Component] Rank Item Redesign
`src/app/league/page.tsx` 내의 `RankItem` 함수와 관련 스타일을 대폭 수정합니다.

#### [MODIFY] [page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/league/page.tsx)
- **순위 영역 (1~3위)**: 
    - `medal_*.svg`를 `img` 태그로 배경으로 깔고, 그 위에 `span`으로 순위 숫자를 흰색으로 표시
    - `relative`와 `absolute` 포지셔닝 활용
- **사용자 정보 영역**: 
    - 닉네임과 타이틀을 가로로 정렬
    - 타이틀 아이콘(`item.titleCode` 기반) 표시
    - 타이틀 텍스트를 검은색 배경의 캡슐 스타일(`bg-[#2D2D2D] text-white`)로 표시
- **XP 정보 영역**:
    - 우측 정렬된 컬럼 레이아웃 적용
    - 주간 XP: `#FF8400` 색상, 굵은 폰트, 약 `17px` 크기
    - 누적 XP: 회색 테마, 약 `12px` 크기
- **통계 아이콘 제거**: 기존의 퀴즈 완료 팩 수와 정답률 아이콘(`Box`, `CircleCheckBig`)을 디자인 간결화를 위해 제거

## Verification Plan

### Automated Tests
- 빌드 에러 여부 확인 (`npm run dev`)

### Manual Verification
1. 랭킹 페이지 접속 후 1~3위가 메달 아이콘과 함께 표시되는지 확인
2. 4위 이하가 숫자만 깔끔하게 표시되는지 확인
3. 닉네임 우측의 타이틀이 다크 캡슐 스타일로 보여지는지 확인
4. 우측 XP 영역이 위아래(주간/누적)로 잘 구분되어 정렬되는지 확인
5. 모바일 뷰에서의 레이아웃 균형 확인
