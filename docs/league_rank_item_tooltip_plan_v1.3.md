# [PLAN] 랭커 카드 상세 통계 툴팁(Tooltip) (v1.3)

랭커 카드에 마우스 호버 또는 터치 시 상세 정보를 보여주는 툴팁 기능을 구현합니다.

## 폴더 구조 및 파일 구성
```text
src/
  app/
    league/
      page.tsx          # 주요 수정 대상 (RankItem 내 툴팁 로직 및 UI 추가)
```

## Proposed Changes

### [Component] Rank Item Tooltip
`src/app/league/page.tsx` 내의 `RankItem` 컴포넌트를 확장하여 툴팁 기능을 추가합니다.

#### [MODIFY] [page.tsx](file:///d:/SynologyDrive/dev_projects/constitution-quiz-0.5/src/app/league/page.tsx)
- **상태 관리**: `const [showTooltip, setShowTooltip] = useState(false);` 추가
- **이벤트 핸들러**:
    - `onMouseEnter`, `onMouseLeave` (데스크톱 호버 처리)
    - `onClick` (모바일 터치 토글 처리)
- **툴팁 UI 구현**:
    - 카드 상단 중앙(`absolute -top-16 left-1/2 -translate-x-1/2`)에 배치
    - 말풍선 꼬리(`Tail`) 구현: 작은 `div`를 약 45도 회전시켜 중앙 하단에 배치
    - 시안 반영 요소:
        - 팩 수 아이콘(`Box`) + 다크 배지(숫자)
        - 완료 수 아이콘(`CircleCheckBig`) + 다크 배지(숫자)
        - 평균 정답률 텍스트
- **아이콘 재임포트**: `lucide-react`에서 `Box`, `CircleCheckBig` 추가

## Verification Plan

### Automated Tests
- 빌드 에러 여부 확인 (`npm run dev`)

### Manual Verification
1. 데스크톱에서 랭커 카드에 마우스를 올렸을 때 툴팁이 자연스럽게 나타나는지 확인
2. 툴팁 내의 수치(유니크 팩, 완료 횟수, 정답률)가 올바른지 확인
3. 모바일 환경(또는 개발자 도구 모바일 모드)에서 터치 시 툴팁이 토글되는지 확인
4. 툴팁의 디자인(그림자, 꼬리, 배지 스타일)이 제공된 시안과 일치하는지 확인
