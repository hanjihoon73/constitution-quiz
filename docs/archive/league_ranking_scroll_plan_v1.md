# 랭킹 페이지 자동 포커스 개발 계획서 (v1)

## 1. 개요
* **기능 설명**: 자신이 속한 랭킹 아이템을 찾아 사용자가 직접 스크롤하지 않도록, `RankItem`이 마운트된 시점에 위치를 계산해 화면 중앙으로 자동 스크롤.
* **요구사항 문서**: `docs/league_ranking_scroll_prd_v1.md`

## 2. 작업 폴더 구조 및 변경 파일
* 대상 파일: `src/app/league/page.tsx` (기존 폴더 구조 유지)

## 3. 세부 구현 계획
1. **모듈 임포트 수정**:
   * `react` 내부에서 `useRef`를 추가로 임포트.

2. **RankItem 컴포넌트 수정**:
   * `const itemRef = useRef<HTMLDivElement>(null);` 추가.
   * 최상단 `<div className="animate-in fade-in ...">` 엘리먼트에 `ref={itemRef}` 연결.
   * `useEffect`를 추가하여 `isMe`가 `true`일 때 다음 로직 실행:
      ```tsx
      useEffect(() => {
          if (isMe && itemRef.current) {
              const timer = setTimeout(() => {
                  itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
              return () => clearTimeout(timer);
          }
      }, [isMe]);
      ```
   ※ 타이머 300ms: 컴포넌트 진입 시 아이템 애니메이션 진행 시간(350ms)을 감안하여 화면의 스크롤 점프 현상을 자연스럽게 연출하기 위한 목적.

## 4. 검증 및 테스트 방안 (Verficiation)
* 서버 실행 후 사용자의 클라에서 직접 `주간 리그 랭킹` 버튼을 클릭하여 이동 및 로드 후 부드럽게 내 항목으로 정렬되는지 시각적으로 검증합니다.
