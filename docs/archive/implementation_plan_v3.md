# 퀴즈팩 하위 퀴즈 조회/수정 고도화 계획 (v3)

## 목표
기획서 `admin_planning.md` 에 기재된 불일치 항목 2~5번을 모두 해결하고, 퀴즈 상세 조회를 비롯한 수정 기능을 구현합니다.

---

## 2번 항목: 난이도 매핑
**현재**: `quizzes.difficulty_id` 확인 없이 하드코딩된 "중" 라벨 표시.
**수정**:
- `QuizpackItem.tsx` 안에서 매핑 테이블(Record<number, string>) 선언 (1=하, 2=중하, 3=중, 4=중상, 5=상)
- 해당 `quiz.difficulty_id` 에 맞게 텍스트 렌더링하도록 변경.

## 3번 항목: 미리보기 연동
**현재**: `QuizPreviewModal`은 존재하며 UI단위 버튼은 있으나 확실한 피드백이 부족한 상태 혹은 이전 버전 언급.
**수정**:
- `QuizpackItem.tsx`의 Eye 아이콘 버튼 클릭 시 `setPreviewQuizId(quiz.id)`가 정상 호출되고 모달이 열리는지 확실히 연동되었음을 재검토하고 완벽하게 작동하게 보장.

## 5번 항목: 상태 텍스트 표시
**현재**: 초록/회색 동그라미 모양(`dot`)으로만 표시됨.
**수정**:
- `dot` 오른쪽에 `is_active === true`면 초록색 "ON", `false`면 회색 "OFF" 텍스트 뱃지를 함께 표시하여 명시성 강화.

---

## 4번 항목: 퀴즈 상세 수정 팝업 (신규 구현)
> [!IMPORTANT]
> 기획에 명시된 문제/지문/보기/정답/힌트/해설 조회 및 수정을 처리할 핵심 컴포넌트 추가입니다.

### 설계 구조 및 컴포넌트

```text
src/
  components/admin/
    ├── QuizpackItem.tsx          # 퀴즈 목록 (2, 3, 5번 항목 수정 및 QuizDetailModal 호출)
    └── QuizDetailModal.tsx       # [NEW] 퀴즈 상세/수정 팝업 컴포넌트
  actions/admin/
    ├── contents.ts               # (기존 활용) updateQuiz, updateQuizChoices 액션 호출
    └── contents_detail.ts        # (기존 활용) getQuizDetail 액션 호출
```

### 상세 기능 명세
- `QuizpackItem.tsx`의 퀴즈 리스트 항목에 있는 Edit 아이콘 버튼 클릭 시, `editQuizId` state에 ID를 세팅하고 `QuizDetailModal`을 렌더링.
- `QuizDetailModal` 내부 동작:
  1. `getQuizDetail(quizId)`를 호출해 기존 퀴즈 객체와 보기(choices) 배열을 모두 조회.
  2. 로딩 후, 문제 내용, 지문, 보기 4개, 정답 선택란, 힌트, 해설, 난이도, 활성 상태 등을 Input 요소들로 채운 Form을 노출.
  3. Form 내용을 변경 및 저장 버튼 리스너 동작:
     - 빈 텍스트 등의 null 체크 (not null 필수 항목 검증)
     - `updateQuiz`를 호출하여 퀴즈 메타 데이터 업데이트.
     - `updateQuizChoices`를 호출하여 4개 보기 배열 동시 업데이트.
  4. 저장 완료 성공 시 토스트 메시지와 함께 모달 닫기 및 퀴즈팩의 확장된 리스트 갱신.

---

## 작업 리뷰 요청
> [!NOTE]
> 1. `QuizDetailModal`의 Form 디자인 구성을 사용자의 편의를 고려하여 상하 1열(모바일/작은 해상도 호환) 혹은 2열 분리 구조로 나눌지 결정 가능합니다. (직관적인 1열 하향 구조 추천)
> 2. 위 계획대로 2, 3, 5번의 빠른 UI 수정 및 4번 구현을 진행해도 될지 승인을 부탁드립니다.
