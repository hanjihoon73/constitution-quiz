# 랭킹 페이지 UI 수정 개발 계획서

## 1. 개요
* **기능 설명**: 스크롤 시 랭킹 페이지 상단의 컨트롤/타이틀 영역 및 1위~3위 랭커를 고정(Sticky) 처리.
* **참고 문서**: `docs/league_ranking_scroll_prd_v2.md`

## 2. 작업 폴더 구조 및 대상 파일
* 대상 프로젝트: `constitution-quiz-0.5`
* 수정 대상 파일: `src/app/league/page.tsx`
* 추가 기획 문서: `docs/league_ranking_scroll_prd_v2.md`
* 추가 계획 문서: `docs/league_ranking_scroll_plan_v2.md` (현재 파일)
기존 폴더 구조는 절대 변경하지 않습니다.

## 3. 세부 구현 계획

### `src/app/league/page.tsx` 수정 방법
1. **리스트 데이터 분리 로직 추가**:
   기존 `displayItems` 아래에, 1~3위(`top3Items`)와 4위 이하(`otherItems`)를 분리.
   ```typescript
   const top3Items = displayItems.filter(item => item.rank <= 3);
   const otherItems = displayItems.filter(item => item.rank > 3);
   ```

2. **JSX 렌더링 구조 변경**:
   기존 `<main>` 내부 최상단 엘리먼트들을 묶어, `sticky top-0 z-10 bg-background` CSS 클래스를 적용한 컴포넌트로 분리.
   
   **고정(Sticky) 영역**:
   ```tsx
   <div className="sticky top-0 z-10 bg-background pb-3">
       {/* 상단 컨트롤 영역 (뒤로가기, 새로고침) */}
       {/* 헤더 타이틀 영역 (주간 리그 랭킹) */}
       
       {/* 1위 ~ 3위 랭킹 목록 */}
       <div className="px-4 flex flex-col gap-2">
           {top3Items.map((item, idx) => (
               <RankItem key={item.userId} item={item} animationDelay={idx * 50} />
           ))}
       </div>
       
       {/* 스크롤 시 구분을 위한 하단 구분선 (선택) */}
       <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100" />
   </div>
   ```

   **스크롤 영역**:
   ```tsx
   <div className="px-4 pb-12 pt-2 flex flex-col gap-2">
       {otherItems.map((item, idx) => (
           <RankItem key={item.userId} item={item} animationDelay={(top3Items.length + idx) * 50} />
       ))}
   </div>
   ```

3. **로딩 상태 (isLoading) 대응**:
   - 로딩 중일 때는 1~3위를 `sticky` 영역에서 보여줄 수 없음. 전체를 로딩 컴포넌트로 처리하거나, `sticky` 영역에 로딩 처리를 나눠서 진행. 가장 직관적인 형태는 기존 로직을 최대한 유지하여 `isLoading` 처리를 분기하는 것.

## 4. 검증 및 테스트 방안 (Verficiation)
* **테스트 환경**: 로컬 개발 서버 (`npm run dev`)
* **테스트 절차**:
  1. 앱에 로그인한 상태에서 '주간 리그 랭킹' 버튼을 클릭하여 리그 페이지로 진입.
  2. 랭킹 데이터가 모두 로드된 후 스크롤을 내리면서 동작 확인.
  3. 스크롤 진행 중 **상단 타이틀 영역과 1, 2, 3위 랭커 리스트가 상단에 고정되는지 확인**.
  4. 4위 이하 랭커 및 본인 랭커 목록은 고정된 영역 아래로 가려지며 정상적으로 스크롤되는지 검증.
  5. UI 상 배경색이 겹치지 않는지(투명도 문제) 확인.
