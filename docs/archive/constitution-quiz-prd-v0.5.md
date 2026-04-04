# PRD_v0.5

category: 모두의 헌법
assign: Jason
started_at: 2025/12/20
ended_at: 2026/01/25
status: In Progress
Created: 2025년 12월 20일 오후 2:06
Is_At: 26.01

- **개발 배경**
    1. 일반적으로 법은 어렵고 멀게 느껴집니다.
    2. 방대한 양과 어려운 용어, 지루한 내용 때문에 관련 종사자나 특별히 관심이 있는 일부 사람들을 제외하면 거의 관심을 갖지 않습니다.
    3. 하지만 법은 모르면 칼이 되어 나를 겨누고, 알면 유용한 도구가 되는 양면성을 가지고 있습니다.
    4. 특히 헌법은 대한민국의 최상위 법률이자 국가의 기본 틀을 규정하는 핵심 법으로서 국민이라면 누구나 관심을 가지고 어느 정도는 알아야 합니다.
    5. 때마침 윤석렬이 저지른 위헌적 계엄 사태는 너무나 많은 상처와 고통을 주고 있지만, 반면에 많은 국민들이 헌법에 대해 관심을 갖게 만드는 계기가 됐습니다.
    6. 이에 앞으로 누구나 쉽고 재미있게 헌법을 알아가고 가까이 할 수 있도록 헌법을 활용한 캐쥬얼 퀴즈를 개발해 서비스 합니다.
- **서비스 개요**
    1. 서비스 타이틀: 모두의 헌법
    2. 1,000개 이상의 대한민국 헌법 관련 퀴즈를 쉬운 단계부터 어려운 단계로 풀어나가며 헌법에 대한 지식을 쉽고 재미있게 쌓을 수 있음
- **Dev Spec**
    - Language: TypeScript
    - Framework: Next.js (App Router)
    - Database & Auth: Supabase
    - UI/UX Style:
        - CSS: Tailwind CSS
        - Components: shadcn/ui, Lucide React icons
- **Device & Layout Spec**
    - Primary Target: Mobile-only Responsive Web App.
    - Layout Rule: PC에서도 모바일 비율을 유지하는 'Centered Mobile Frame' 구조
    - Visual Frame:
        - Max-width: `480px`
        - PC View: 가로 중앙 정렬 및 외부 배경 `#ffffff`처리
        - Shadow: 컨테이너에 은은한 `shadow-2xl` 적용
    - Height Strategy:
        - `min-height: 100dvh`를 사용하여 주소창 대응
        - 내부 레이아웃은 콘텐츠가 적어도 전체 높이를 차지하도록 `flex flex-col` 사용
    - Component Constraint: - Modal, Drawer 등 모든 Overlay 컴포넌트는 `480px` 프레임 내부에 렌더링되도록 제한
    - iOS Safari 대응:
        - 고무줄 스크롤 방지: `overscroll-behavior: none` 적용
        - Safe Area 대응: `padding: env(safe-area-inset-top)` 등 적용
        - 터치 하이라이트 제거: `webkit-tap-highlight-color: transparent`
- **Visual Design Concept**
    - concept: 모던하고 세련된 디자인, 글래스모피즘
    - theme: light
    - primary: `#2D2D2D`
    - secondary: `#FF8400`
    - background: `#ffffff`

- **Database Schema**
    - user
        
        ```sql
        // 가입 방식 정의
        enum auth_provider {
          google [note: '구글 로그인']
          kakao [note: '카카오 로그인']
        }
        
        // 사용자 권한 정의
        enum user_role {
          user [note: '사용자']
          admin [note: '관리자']
        }
        
        // 사용자 기본 정보 관리 테이블
        Table users {
          id bigint [primary key, note: '사용자 고유 ID']
          
          // 필수 계정 정보
          nickname varchar(50) [not null, unique, note: '정규식: ^[가-힣a-zA-Z0-9]{4,20}$']
          provider auth_provider [not null, note: '가입 방식 (google, kakao)']
          provider_id varchar(255) [not null, note: '소셜 로그인 제공업체 고유 ID']
        	role user_role [default: 'user', note: '사용자 권한']
          
          // 계정 상태
          is_active boolean [default: true, note: '계정 활성화 상태']
          
          // 시간 정보
          created_at timestamp [default: `now()`, note: '계정 생성 시간']
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
          
          Note: '''
          Trigger 설정:
          - modified_at은 UPDATE 시 자동으로 NOW()로 변경됨
          - update_modified_at_column() 함수 사용
          '''
          
          Indexes {
            (provider, provider_id) [unique, note: '소셜 로그인 중복 방지']
            nickname [unique, note: '닉네임 중복 확인']
            role [note: '관리자 조회']
          }
        }
        
        // 사용자 로그인 이력 테이블 (인증은 Supabase Auth 사용)
        Table user_login_history {
          id bigint [primary key]
          user_id bigint [not null, note: '사용자 ID']
          provider auth_provider [not null, note: '로그인 방식']
          logged_in_at timestamp [default: `now()`, note: '로그인 시간']
          
          Indexes {
            user_id [note: '사용자별 로그인 이력 조회']
            (user_id, logged_in_at) [note: '최근 로그인 조회']
          }
          
          Note: '''
          목적: 로그인 이력 기록 (분석/보안 감사용)
          - 인증 및 세션 관리는 Supabase Auth 사용
          - JWT 토큰 관리는 Supabase가 자동 처리
          - RLS(Row Level Security)로 데이터 접근 제어
          '''
        }
        
        Ref: user_login_history.user_id > users.id [delete: cascade]
        ```
        
    - contents
        
        ```sql
        // 각 퀴즈팩의 정보 관리 테이블
        Table quizpacks {
          id bigint [primary key]
          quiz_count_all integer
          quiz_max integer [default: 10]
          keywords text [not null, default: '', note: '퀴즈팩 카드에 표시할 태그 정보 (쉼표 구분, 1~5개, 각 2~10자)']
          is_active boolean [default: true, note: '관리자가 활성/비활성 설정']
          is_deleted boolean [default: false, note: '소프트 딜리트']
          deleted_at timestamp [note: '삭제 시점']
          deleted_by bigint [note: '삭제한 관리자 ID']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
        }
        
        // 퀴즈팩들의 기본 순서 관리 테이블
        Table quizpack_loadmap {
          id bigint [primary key]
          quizpack_id bigint [ref: > quizpacks.id]
          quizpack_order integer [not null, note: '기본 순서 1,2,3...']
        
          Indexes {
            quizpack_id [unique, note: '퀴즈팩당 하나의 순서만 존재']
            quizpack_order [note: '순서별 정렬 조회 최적화']
          }
        }
        
        // 퀴즈 타입 정의
        enum quiz_type {
          multiple [note: '4지선다']
          truefalse [note: 'OX']
          choiceblank [note: '빈칸채우기']
        }
        
        // 각 퀴즈의 정보 관리 테이블
        Table quizzes {
          id bigint [primary key]
          quizpack_id bigint [ref: > quizpacks.id]
          
          // 기본 정보
          quiz_order integer [not null, note: '퀴즈팩 내 원본 순서 (1, 2, 3...)']
          difficulty_id bigint [ref: > quiz_difficulty.id]
          quiz_type quiz_type [not null]
          constitution_info_id bigint [ref: > constitution_info.id]
          question text [not null]
          passage text [not null]
          hint text [not null]
          explanation text [not null]
          blank_count integer
          
          // 상태 정보
          is_active boolean [default: true, note: '관리자가 활성/비활성 설정']
          is_deleted boolean [default: false, note: '소프트 딜리트']
          
          // 시간 정보
          deleted_at timestamp [note: '삭제 시점']
          deleted_by bigint [note: '삭제한 관리자 ID']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
        
          Indexes {
            (quizpack_id, quiz_order) [unique, note: '퀴즈팩 내 순서 고유성']
          }
        }
        
        // 퀴즈의 헌법 조문 정보 관리 테이블
        Table constitution_info {
          id bigint [primary key]
          chapter_number integer [not null, unique]
          chapter_title varchar(100) [not null]
          article_number integer [not null]
        }
        
        // 퀴즈의 난이도와 포인트 배율 관리 테이블
        Table quiz_difficulty {
          id bigint [primary key]
          label varchar [note: '1=하, 2=중하, 3=중, 4=중상, 5=상']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
        }
        
        // 각 퀴즈의 보기와 정답 정보 관리 테이블
        Table quiz_choices {
          id bigint [primary key]
          quiz_id bigint [not null]
          choice_text text [not null]
          choice_order integer [not null]
          is_correct boolean [default: false]
          blank_position integer [note: '빈칸 위치 (1~3), NULL이면 일반 오답 보기'] // 예시: 빈칸 3개 → 정답 보기 3개(blank_position 1,2,3) + 오답 보기 2개(blank_position NULL)
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
          Indexes {
          quiz_id [note: '퀴즈별 보기 조회']
          (quiz_id, choice_order) [note: '퀴즈별 순서 조회']
        	}
        	
          Note: '''
          보기 순서 랜덤화:
        	1. choice_order는 원본 순서 (변경 안 함)
        	2. 프론트엔드에서 user_quizpack_id를 Seed로 랜덤 정렬
        	3. 같은 세션 내에서는 항상 동일한 순서 보장
          '''
        }
        
        Ref: quiz_choices.quiz_id > quizzes.id [delete: cascade]
        ```
        
    - user-contents
        
        ```sql
        // 퀴즈팩 진행 상태 정의
        enum quizpack_status {
          closed [note: '닫힘 - 아직 열리지 않음']
          opened [note: '열림 - 시작 가능']
          in_progress [note: '진행 중']
          completed [note: '완료']
        }
        
        // 사용자의 퀴즈팩 진행 상태 관리 및 결과 기록 테이블
        Table user_quizpacks {
          id bigint [primary key]
          user_id bigint [not null, note: '사용자 ID']
          quizpack_id bigint [not null]
          quizpack_order integer [not null, note: 'quizpack_loadmap.quizpack_order의 스냅샷 (퀴즈팩 unlock 시점 기준)']
          status quizpack_status [default: 'closed', note: '진행 상태'] // 상태 - 초기값은 closed (가입 시 로직으로 1번만 opened)
          note: '''
        	  사용자별 퀴즈팩 상태 관리 요구사항:
        		  1. 최초 가입: 1번 퀴즈팩만 열림(opened), 나머지는 닫힘(closed)
        		  2. N번 퀴즈팩 완료 시 → (N+1)번 퀴즈팩을 열림으로 변경
        		  3. 완료한 퀴즈팩은 언제든 재시작 가능
        		  4. 순서를 건너뛰는 것은 불가능
        	'''
          
          // 진행 정보
          total_quiz_count integer [not null, note: '총 퀴즈 수']
          solved_quiz_count integer [default: 0, note: '정답 확인 완료한 퀴즈 수']
          correct_count integer [default: 0, note: '정답 수']
          incorrect_count integer [default: 0, note: '오답 수']
          current_quiz_order integer [note: 'UI에 현재 표시 중인 퀴즈 순서 (선택적)']
          session_number integer [note: '1회차, 2회차, 3회차...']
          
          // 통계 정보
          correct_rate decimal(4,1) [default: 0, note: '정답률 (0.0~100.0)']
          total_time_seconds integer [default: 0, note: '총 소요 시간(초)']
          
          // 시간 정보
          started_at timestamp [note: '시작 시간']
          completed_at timestamp [note: '완료 시간']
          last_played_at timestamp [note: '마지막 플레이 시간']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
          
          Indexes {
          (user_id, quizpack_order) [note: '사용자별 순서 정렬 조회']
          (user_id, status, quizpack_order) [note: 'Status별 순서 조회 최적화']
          (user_id, status) [note: '사용자별 진행 중/완료 조회']
          (user_id, quizpack_id) [note: '홈 화면 최적화 - 모든 세션 조회']
          (quizpack_id, status) [note: '퀴즈팩별 완료자 수 집계']
          (user_id, quizpack_id, session_number) [unique, note: '세션 고유성 보장'] // 1회차(session_number=1)인지 확인 → 선호도 입력 여부 결정
        	}
        }
        
        // 사용자의 퀴즈 풀이 기록 관리 테이블
        Table user_quizzes {
          id bigint [primary key]
          user_id bigint [not null, note: '사용자 ID']
          quiz_id bigint [not null]
          user_quizpack_id bigint [not null, note: '퀴즈팩 세션 ID']
          quiz_order integer [not null, note: '해당 세션에서의 퀴즈 순서 (1, 2, 3...)']
          
          // 답안 정보
        	selected_answers jsonb [not null, note: '선택한 답안 (JSON 형태)']
          is_correct boolean [not null, note: '정답 여부']
          
          // 시간 정보
          answered_at timestamp [default: `now()`]
        	started_at timestamp [note: '퀴즈 시작 시간']
          time_seconds integer [note: '소요 시간(초)']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
          
          Indexes {
          (user_quizpack_id, quiz_order) [note: '세션별 순서 조회']
          (user_id, answered_at) [note: '사용자별 최근 풀이 조회']
        	}
        }
        
        // 퀴즈팩 선호도(별점) 관리 테이블
        Table user_quizpack_ratings {
          id bigint [primary key]
          user_id bigint [not null, ref: > users.id]
          quizpack_id bigint [not null, ref: > quizpacks.id]
          rating integer [not null, note: '1~5점']
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: '수정 시각 (Trigger로 자동 업데이트)']
          
          Indexes {
            (user_id, quizpack_id) [unique]  // 1회만 등록
          }
        }
        
        Ref: user_quizzes.quiz_id > quizzes.id [delete: cascade]
        Ref: user_quizpacks.quizpack_id > quizpacks.id [delete: cascade]
        Ref: user_quizzes.user_quizpack_id > user_quizpacks.id
        Ref: user_quizzes.user_id > users.id [delete: cascade]
        Ref: user_quizpacks.user_id > users.id [delete: cascade]
        ```
        
    - notice
        
        ```sql
        enum notice_type {
          general [note: '일반 공지']
          important [note: '중요 공지']
        }
        
        // 공지사항 게시판 테이블
        Table notices {
          id bigint [primary key, note: '공지사항 ID']
          
          // 공지 내용
          title varchar(200) [not null, note: '공지 제목']
          content text [not null, note: '공지 내용 (마크다운/HTML 지원)']
          
          // 분류 및 우선순위
          category notice_type [default: 'general', note: '유형']
          is_important boolean [default: false, note: '중요 공지 여부 (상단 고정)']
          
          // 상태 관리
          is_published boolean [default: false, note: '게시 여부']
          published_at timestamp [note: '게시 시작 시간']
          is_deleted boolean [default: false, note: '소프트 딜리트']
          created_by bigint [not null, ref: > users.id, note: '작성한 관리자 ID']
          modified_by bigint [ref: > users.id, note: '수정한 관리자 ID']
          deleted_by bigint [ref: > users.id, note: '삭제한 관리자 ID']
          
          // 통계
          view_count integer [default: 0, note: '조회수']
          
          // 시간 정보
          created_at timestamp [default: `now()`, note: '작성 시점']
          modified_at timestamp [default: `now()`, note: '수정 시점']
        	deleted_at timestamp [default: `now()`, note: '삭제 시점']
          
          Indexes {
            is_published [note: '게시 상태별 조회']
            (is_important, published_at) [note: '중요 공지 우선 정렬']
            category [note: '카테고리별 조회']
            published_at [note: '게시일 정렬']
          }
        }
        ```
        
    - statistics
        
        ```sql
        // 전체 사용자의 퀴즈팩 평균 정답률 관리 테이블
        Table quizpack_statistics {
          id bigint [primary key]
          quizpack_id bigint [unique, not null, ref: > quizpacks.id]
          
          // 통계 정보
          total_completions integer [default: 0, note: '완료 횟수 (모든 세션 포함)']
          total_correct_count integer [default: 0, note: '전체 정답 수']
          total_quiz_count integer [default: 0, note: '전체 풀이 퀴즈 수']
          average_correct_rate decimal(5,2) [default: 0, note: '평균 정답률 (0.00~100.00) - 계산값']
          
          // 선호도 통계
          rating_count integer [default: 0, note: '선호도 입력 횟수']
          rating_sum integer [default: 0, note: '선호도 합계']
          average_rating decimal(3,2) [default: 0, note: '평균 선호도 (0.00~5.00)']
          
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: 'Trigger로 자동 업데이트']
        
          Note: '''
            업데이트 방식: 배치 처리 (일 1회)
            - 매일 새벽 3시 Cron Job으로 자동 실행
            - 완료 상태(status='completed')인 세션만 집계
          '''
        
          Indexes {
            quizpack_id [unique]
            average_correct_rate [note: '정답률 정렬']
            average_rating [note: '선호도 정렬']
          }
        }
        
        // 퀴즈별 통계 관리 테이블
        Table quiz_statistics {
          id bigint [primary key]
          quiz_id bigint [unique, not null, ref: > quizzes.id]
          
          // 통계 정보
          play_count integer [default: 0, note: '플레이 횟수']
          correct_count integer [default: 0, note: '정답 횟수']
          incorrect_count integer [default: 0, note: '오답 횟수']
          correct_rate decimal(5,2) [default: 0, note: '정답률 (0.00~100.00) - 10회마다 재계산']
          
          // 시간 정보
          created_at timestamp [default: `now()`]
          modified_at timestamp [default: `now()`, note: 'Trigger로 자동 업데이트']
        
          Note: '''
            업데이트 방식: Trigger (실시간)
            - user_quizzes INSERT 시 자동 업데이트
            - 10회 플레이마다 정답률 재계산 (성능 최적화)
          '''
        
          Indexes {
            quiz_id [unique, note: '퀴즈당 하나의 통계 레코드']
            correct_rate [note: '정답률 정렬 조회']
          }
        }
        ```
        
- **Supabase RLS**
    
    
    | 테이블 | 읽기 | 쓰기 | 설명 |
    | --- | --- | --- | --- |
    | `quiz_difficulty` | 모든 인증 사용자 | 없음 | 기초 데이터 |
    | `constitution_info` | 모든 인증 사용자 | 없음 | 기초 데이터 |
    | `quizpacks` | 모든 인증 사용자 | 관리자만 | 콘텐츠 |
    | `quizpack_loadmap` | 모든 인증 사용자 | 관리자만 | 콘텐츠 |
    | `quizzes` | 모든 인증 사용자 | 관리자만 | 콘텐츠 |
    | `quiz_choices` | 모든 인증 사용자 | 관리자만 | 콘텐츠 |
    | `users` | 본인만 | 본인만 | 개인정보 |
    | `user_login_history` | 본인만 | 시스템만 | 개인정보 |
    | `user_quizpacks` | 본인만 | 본인만 | 진행 데이터 |
    | `user_quizzes` | 본인만 | 본인만 | 진행 데이터 |
    | `user_quizpack_ratings` | 본인만 | 본인만 | 진행 데이터 |
    | `quizpack_statistics` | 모든 인증 사용자 | 시스템만 | 통계 |
    | `quiz_statistics` | 모든 인증 사용자 | 시스템만 | 통계 |
    | `notices` | 모든 인증 사용자 | 관리자만 | 공지 |
- **Data Flow**
    - 최초 로그인 ~ 1번 퀴즈팩 완료
        
        ### 최초 로그인 (OAuth)
        
        - `users` - provider, provider_id - **READ** (기존 사용자 확인)
        - `users` - id, provider, provider_id, is_active, created_at - **CREATE** (신규 사용자, nickname 제외)
        - `user_login_history` - user_id, provider, logged_in_at - **CREATE**
        
        ### 닉네임 확정
        
        - `users` - nickname - **READ** (중복 확인)
        - `users` - nickname, modified_at - **UPDATE**
        
        ### 홈 화면 최초 진입
        
        - `quizpacks` - is_active, is_deleted - **READ** (모든 활성 퀴즈팩 조회)
        - `quizpack_loadmap` - quizpack_id, quizpack_order - **READ** (순서 정보)
        - `user_quizpacks` - user_id - **READ** (기존 레코드 확인)
        - `user_quizpacks` - user_id, quizpack_id, quizpack_order, status, total_quiz_count, created_at - **CREATE** (모든 퀴즈팩 레코드 생성, 1번만 status='opened', 나머지 'closed')
        - `quizpack_statistics` - average_correct_rate, average_rating - **READ** (친구 정답률, 평균 선호도)
        
        ### 1번 퀴즈팩 시작
        
        - `user_quizpacks` - status='in_progress', session_number=1, started_at, last_played_at - **UPDATE**
        - `quizzes` - quizpack_id=1, quiz_order, is_active, is_deleted - **READ** (퀴즈 목록 조회)
        
        ### 1번 퀴즈 표시
        
        - `quizzes` - id, question, passage, hint - **READ** (첫 번째 퀴즈 상세 정보)
        - `quiz_choices` - quiz_id, choice_text, choice_order, blank_position - **READ** (보기 목록)
        - `quiz_difficulty` - label - **READ** (난이도 표시)
        - `constitution_info` - chapter_number, chapter_title, article_number - **READ** (헌법 조문 정보)
        
        ### 1번 퀴즈 풀기
        
        - `user_quizzes` - user_id, quiz_id, user_quizpack_id, quiz_order=1, selected_answers, is_correct, answered_at, created_at - **CREATE**
        - `quiz_statistics` - play_count, correct_count, incorrect_count - **UPDATE** (Trigger 자동 실행)
        
        ### [다음] 버튼 클릭
        
        - `user_quizpacks` - solved_quiz_count, correct_count/incorrect_count, last_played_at - **UPDATE**
        - `quizzes` - id, question, passage, hint - **READ** (다음 퀴즈 정보)
        - `quiz_choices` - quiz_id - **READ** (다음 퀴즈 보기)
        
        ### 2번 퀴즈 표시
        
        - `quizzes` - id, question, passage, hint, explanation - **READ**
        - `quiz_choices` - quiz_id, choice_text, choice_order - **READ**
        - `quiz_difficulty` - label - **READ**
        - `constitution_info` - chapter_number, chapter_title, article_number - **READ**
        
        ### ... (3번~9번 퀴즈 반복)
        
        - 위 "1번 퀴즈 풀기" → "[다음] 버튼 클릭" → "퀴즈 표시" 과정 반복
        
        ### 마지막 퀴즈 표시 (10번 퀴즈)
        
        - `quizzes` - id, question, passage, hint - **READ**
        - `quiz_choices` - quiz_id, choice_text, choice_order - **READ**
        - `quiz_difficulty` - label - **READ**
        - `constitution_info` - chapter_number, chapter_title, article_number - **READ**
        
        ### 마지막 퀴즈 풀기
        
        - `user_quizzes` - user_id, quiz_id, user_quizpack_id, quiz_order=10, selected_answers, is_correct, answered_at - **CREATE**
        - `quiz_statistics` - play_count, correct_count, incorrect_count - **UPDATE** (Trigger)
        
        ### [완료] 버튼 클릭
        
        - `user_quizpacks` - solved_quiz_count, correct_count, incorrect_count, status='completed', completed_at, correct_rate, total_time_seconds - **UPDATE**
        
        ### 퀴즈팩 완료 화면 표시
        
        - `user_quizpacks` - correct_rate, correct_count, total_quiz_count, total_time_seconds - **READ** (완료 정보 조회)
        - `user_quizzes` - is_correct=false, quiz_order - **READ** (오답 퀴즈 번호 조회)
        - `user_quizpack_ratings` - user_id, quizpack_id - **READ** (선호도 입력 여부 확인)
        - `user_quizpack_ratings` - user_id, quizpack_id, rating, created_at - **CREATE** (선호도 입력 시)
        
        ### [다음 퀴즈팩 시작] 버튼 클릭
        
        - `user_quizpacks` - status='opened' WHERE quizpack_order=2 - **UPDATE** (2번 퀴즈팩 Unlock)
        - `user_quizpacks` - status='in_progress', session_number=1, started_at, last_played_at - **UPDATE** (2번 퀴즈팩 시작)
        - `quizzes` - quizpack_id=2 - **READ** (2번 퀴즈팩 퀴즈 목록)
        - `quiz_choices` - quiz_id - **READ** (2번 퀴즈팩 보기 목록)
        
    - 기존 사용자 로그인 ~ 2번 퀴즈팩 중단 후 재시작
        
        ### 기존 사용자 로그인 (OAuth)
        
        - `users` - provider, provider_id - **READ** (기존 사용자 확인)
        - `user_sessions` - session_type='logout' - **UPDATE** (기존 세션 무효화)
        - `user_login_history` - user_id, provider, logged_in_at - **CREATE**
        
        ### 홈 화면 진입
        
        - `quizpacks` - is_active, is_deleted - **READ** (활성 퀴즈팩 조회)
        - `quizpack_loadmap` - quizpack_id, quizpack_order - **READ** (순서 정보)
        - `user_quizpacks` - user_id - **READ** (기존 진행 상황 조회)
        - `quizpack_statistics` - average_correct_rate, average_rating - **READ** (친구 정답률, 평균 선호도)
        
        ### 2번 퀴즈팩 시작
        
        - `user_quizpacks` - status='opened' WHERE quizpack_order=2 - **READ** (시작 가능 여부 확인)
        - `user_quizpacks` - status='in_progress', session_number=1, started_at, last_played_at - **UPDATE** (2번 퀴즈팩 시작)
        - `quizzes` - quizpack_id=2, quiz_order, is_active, is_deleted - **READ** (퀴즈 목록 조회)
        
        ### 1번 퀴즈 표시
        
        - `quizzes` - id, question, passage, hint - **READ** (랜덤 순서로 첫 번째 퀴즈)
        - `quiz_choices` - quiz_id, choice_text, choice_order, blank_position - **READ** (보기 목록)
        - `quiz_difficulty` - label - **READ** (난이도)
        - `constitution_info` - chapter_number, chapter_title, article_number - **READ** (헌법 조문)
        
        ### 1번 퀴즈 풀기 & [다음] 클릭
        
        - `user_quizzes` - user_id, quiz_id, user_quizpack_id, quiz_order=1, selected_answers, is_correct, answered_at - **CREATE**
        - `quiz_statistics` - play_count, correct_count, incorrect_count - **UPDATE** (Trigger)
        - `user_quizpacks` - solved_quiz_count=1, correct_count/incorrect_count, last_played_at - **UPDATE**
        
        ### 2번~5번 퀴즈 풀기 (반복)
        
        - `quizzes` - id, question, passage, hint - **READ**
        - `quiz_choices` - quiz_id - **READ**
        - `user_quizzes` - quiz_order=2~5, selected_answers, is_correct - **CREATE**
        - `quiz_statistics` - play_count, correct_count, incorrect_count - **UPDATE** (Trigger)
        - `user_quizpacks` - solved_quiz_count=2~5, correct_count, incorrect_count, last_played_at - **UPDATE**
        
        ### 중단 (5번 퀴즈 정답 확인 후 브라우저 종료)
        
        - `user_quizpacks` - solved_quiz_count=5, status='in_progress', last_played_at - **READ** (자동 저장 완료 상태)
        
        ---
        
        ### 재시작: 기존 사용자 로그인
        
        - `users` - provider, provider_id - **READ** (기존 사용자 확인)
        - `user_sessions` - session_type='logout' - **UPDATE** (기존 세션 무효화)
        - `user_sessions` - user_id, session_type='login', session_token, created_at - **CREATE** (새 세션 생성)
        
        ### 홈 화면 진입
        
        - `quizpacks` - is_active, is_deleted - **READ**
        - `quizpack_loadmap` - quizpack_id, quizpack_order - **READ**
        - `user_quizpacks` - user_id, status='in_progress' - **READ** (진행 중인 퀴즈팩 확인)
        - `quizpack_statistics` - average_correct_rate, average_rating - **READ**
        
        ### 2번 퀴즈팩 재개 (클릭 시)
        
        - `user_quizpacks` - id, solved_quiz_count=5, session_number=1 - **READ** (중단 지점 확인)
        - `user_quizpacks` - last_played_at - **UPDATE** (재개 시간 갱신)
        - `quizzes` - quizpack_id=2 - **READ** (퀴즈 목록 재조회)
        - `user_quizzes` - user_quizpack_id, quiz_order<=5 - **READ** (이미 푼 퀴즈 확인, UI 표시용)
        
        ### 6번 퀴즈 표시 (solved_quiz_count + 1)
        
        - `quizzes` - id, question, passage, hint - **READ** (6번째 퀴즈)
        - `quiz_choices` - quiz_id - **READ**
        - `quiz_difficulty` - label - **READ**
        - `constitution_info` - chapter_number, chapter_title, article_number - **READ**
        
        ### 6번 퀴즈 풀기 & [다음] 클릭
        
        - `user_quizzes` - quiz_order=6, selected_answers, is_correct - **CREATE**
        - `quiz_statistics` - play_count, correct_count, incorrect_count - **UPDATE** (Trigger)
        - `user_quizpacks` - solved_quiz_count=6, correct_count, incorrect_count, last_played_at - **UPDATE**
        
        ### 7번~10번 퀴즈 진행 (계속)
        
        - 위 "6번 퀴즈 풀기" 과정 반복
        
    - 기존 사용자 로그인 ~ 프로필에서 닉네임 수정 완료
        
        ### 프로필 페이지 진입
        
        - `users` - id, nickname, provider, provider_id, created_at - **READ** (현재 사용자 정보 조회)
        
        ### 닉네임 수정 아이콘 클릭
        
        - (UI 상태 변경만, DB 작업 없음)
        
        ### 닉네임 입력 중 (실시간 중복 확인)
        
        - `users` - nickname - **READ** (입력한 닉네임 중복 여부 확인)
        
        ### [확정] 버튼 클릭
        
        - `users` - nickname - **READ** (최종 중복 확인)
        - `users` - nickname, modified_at - **UPDATE** (닉네임 업데이트)
        
    - 기존 사용자 로그인 ~ 프로필에서 [로그아웃] 버튼 클릭
        
        ### 프로필 페이지 진입
        
        - `users` - id, nickname, provider, provider_id, created_at - **READ** (현재 사용자 정보 조회)
        
        ### [로그아웃] 버튼 클릭
        
        - `user_sessions` - session_type='logout', created_at - **UPDATE** (현재 세션 무효화)
        
    - 기존 사용자 로그인 ~ 프로필에서 회원탈퇴 클릭 후 회원탈퇴 처리
        
        ### 프로필 페이지 진입
        
        - `users` - id, nickname, provider, provider_id, created_at - **READ** (현재 사용자 정보 조회)
        
        ### '회원탈퇴' 링크 클릭
        
        - `users` - provider, provider_id - **READ** (소셜 계정 연동 해제를 위한 정보 조회)
        
        ### 소셜 계정 연동 해제 확인 팝업 [확인] 클릭
        
        - (OAuth Provider API 호출 - 소셜 계정 연동 해제)
        - `users` - is_active=false, modified_at - **UPDATE** (계정 비활성화)
        - `user_sessions` - session_type='logout', created_at - **UPDATE** (현재 세션 무효화)
        
- **API Endpoints**
    
    ### 1. 인증 (Authentication)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | POST | `/api/auth/login/google` | 구글 OAuth 로그인 | Public |
    | POST | `/api/auth/login/kakao` | 카카오 OAuth 로그인 | Public |
    | POST | `/api/auth/logout` | 로그아웃 | User |
    | DELETE | `/api/auth/withdraw` | 회원탈퇴 (계정 비활성화) | User |
    
    ---
    
    ### 2. 사용자 (Users)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | GET | `/api/users/me` | 내 프로필 조회 | User |
    | PATCH | `/api/users/me/nickname` | 닉네임 수정 | User |
    | GET | `/api/users/check-nickname` | 닉네임 중복 확인 | User |
    
    **Query Parameters:**
    
    - `GET /api/users/check-nickname?nickname={nickname}`
    
    ---
    
    ### 3. 퀴즈팩 (Quizpacks)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | GET | `/api/quizpacks` | 퀴즈팩 목록 조회 (홈 화면용) | User |
    | GET | `/api/quizpacks/{quizpackId}` | 퀴즈팩 상세 조회 | User |
    
    **Response 포함 정보 (`GET /api/quizpacks`):**
    
    - 퀴즈팩 기본 정보 (순서, 난이도 범위, 키워드, 퀴즈 개수)
    - 사용자별 상태 (closed/opened/in_progress/completed)
    - 나의 정답률
    - 친구 정답률 (전체 평균)
    - 평균 선호도
    
    ---
    
    ### 4. 사용자-퀴즈팩 세션 (User Quizpacks)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | POST | `/api/user-quizpacks/{quizpackId}/start` | 퀴즈팩 시작 (새 세션 생성) | User |
    | GET | `/api/user-quizpacks/{userQuizpackId}` | 세션 상태 조회 | User |
    | GET | `/api/user-quizpacks/{userQuizpackId}/resume` | 중단된 퀴즈팩 재개 정보 조회 | User |
    | PATCH | `/api/user-quizpacks/{userQuizpackId}/complete` | 퀴즈팩 완료 처리 | User |
    
    **Response 포함 정보 (`GET .../resume`):**
    
    - 현재 세션 정보
    - 다음에 풀어야 할 퀴즈 순서 (`solved_quiz_count + 1`)
    - 이미 푼 퀴즈들의 정답/오답 상태
    
    ---
    
    ### 5. 퀴즈 (Quizzes)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | GET | `/api/user-quizpacks/{userQuizpackId}/quizzes` | 세션의 퀴즈 목록 조회 (셔플된 순서) | User |
    | GET | `/api/user-quizpacks/{userQuizpackId}/quizzes/{quizOrder}` | 특정 순서의 퀴즈 상세 조회 | User |
    
    **Response 포함 정보:**
    
    - 퀴즈 기본 정보 (질문, 지문, 힌트, 유형)
    - 보기 목록 (셔플된 순서)
    - 난이도
    - 헌법 조문 정보 (장 번호/제목, 조 번호)
    
    ---
    
    ### 6. 퀴즈 답변 (User Quizzes)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | POST | `/api/user-quizpacks/{userQuizpackId}/quizzes/{quizOrder}/answer` | 답변 제출 | User |
    | PATCH | `/api/user-quizpacks/{userQuizpackId}/quizzes/{quizOrder}/confirm` | 정답 확인 완료 (solved_quiz_count 증가) | User |
    | GET | `/api/user-quizpacks/{userQuizpackId}/quizzes/{quizOrder}/result` | 퀴즈 결과 조회 (정답, 해설 포함) | User |
    
    **Request Body (`POST .../answer`):**
    
    ```json
    {
      "selected_answers": [123, 456]  // 또는 {"1": 123, "2": 456}
    }
    
    ```
    
    ---
    
    ### 7. 퀴즈팩 선호도 (Ratings)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | POST | `/api/quizpacks/{quizpackId}/rating` | 선호도 입력 | User |
    | GET | `/api/quizpacks/{quizpackId}/rating` | 내 선호도 조회 | User |
    
    **Request Body (`POST .../rating`):**
    
    ```json
    {
      "rating": 4
    }
    
    ```
    
    ---
    
    ### 8. 공지사항 (Notices)
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | GET | `/api/notices` | 공지사항 목록 조회 | User |
    | GET | `/api/notices/{noticeId}` | 공지사항 상세 조회 (조회수 증가) | User |
    | POST | `/api/notices` | 공지사항 작성 | Admin |
    | PATCH | `/api/notices/{noticeId}` | 공지사항 수정 | Admin |
    | DELETE | `/api/notices/{noticeId}` | 공지사항 삭제 (소프트 딜리트) | Admin |
    
    **Query Parameters (`GET /api/notices`):**
    
    - `page`: 페이지 번호
    - `limit`: 페이지당 개수
    - `search`: 검색어 (제목+내용)
    - `category`: 유형 필터 (general/important)
    
    ---
    
    ### 9. 통계 (Statistics) - 내부/배치용
    
    | Method | Endpoint | 설명 | 권한 |
    | --- | --- | --- | --- |
    | GET | `/api/cron/update-stats` | 퀴즈팩 통계 배치 업데이트 | Cron |
    
    ---
    
    ## API 흐름 요약
    
    ```
    [최초 로그인 플로우]
    POST /api/auth/login/google
      ↓
    PATCH /api/users/me/nickname (온보딩)
      ↓
    GET /api/quizpacks (홈 화면 - 자동으로 user_quizpacks 레코드 생성)
    
    [퀴즈 풀이 플로우]
    POST /api/user-quizpacks/{quizpackId}/start
      ↓
    GET /api/user-quizpacks/{id}/quizzes (퀴즈 목록)
      ↓
    GET /api/user-quizpacks/{id}/quizzes/1 (1번 퀴즈)
      ↓
    POST /api/user-quizpacks/{id}/quizzes/1/answer (답변 제출)
      ↓
    PATCH /api/user-quizpacks/{id}/quizzes/1/confirm (정답 확인)
      ↓
    ... (반복) ...
      ↓
    PATCH /api/user-quizpacks/{id}/complete (퀴즈팩 완료)
      ↓
    POST /api/quizpacks/{quizpackId}/rating (선호도 입력)
    ```
    

---

- **Contents Policy**
    - 2개 이상의 퀴즈를 퀴즈팩(quizpack) 단위로 묶어서 제공한다.
    - 퀴즈팩 Unlock:
        - 레코드 생성 시점:
            - 최초 가입 시: 홈 화면 첫 진입 시점에 모든 활성 퀴즈팩에 대한 레코드를 생성한다.
                - 퀴즈팩 1: opened
                - 나머지 퀴즈팩: closed
            - 신규 퀴즈팩 추가 시: 사용자가 홈 화면 접속할 때 Backend에서 자동으로 누락된 퀴즈팩 레코드를 생성한다.
        - Unlock 조건:
            - N번 퀴즈팩 완료 시 (N+1)번 퀴즈팩의 status를 closed → opened로 변경한다.
            - 완료한 퀴즈팩을 재시작하면 새로운 session_number로 in_progress 상태가 된다.
        - Unlock 불가 조건:
            - 순서를 건너뛰는 것은 불가능하다.
            - 예: 1번 완료 → 3번 시작 불가 (2번을 먼저 완료해야 함)
        - 퀴즈팩 순서 변경 시:
            - quizpack_loadmap.quizpack_order가 변경되어도 이미 생성된 user_quizpacks의 quizpack_order는 변경되지 않는다.
            - 퀴즈팩 순서는 레코드 생성 시점의 quizpack_order 값으로 고정된다.
    - 이미 완료한 퀴즈팩은 퀴즈팩의 순서와 관계 없이 선택해서 다시 할 수 있다.
    - 퀴즈와 보기 순서 랜덤화:
        - 퀴즈팩을 새로 시작할 때마다 퀴즈의 순서가 달라진다.
        - 각 퀴즈의 보기 순서도 랜덤화된다.
        - 같은 세션(`user_quizpack_id`) 내에서는 중단 후 재접속해도 동일한 순서를 유지한다.
        - Seed 값: `user_quizpack_id`를 Seeded Random 알고리즘의 seed로 사용한다.
        - 구현 방식:
            - 퀴즈 순서: `quizzes.quiz_order`로 정렬 후 `user_quizpack_id`를 seed로 셔플
            - 보기 순서: `quiz_choices.choice_order`로 정렬 후 `user_quizpack_id`를 seed로 셔플
    - 퀴즈 중단 및 재개:
        - 중단 조건: 새로고침, 나가기, 브라우저 종료, 네트워크 끊김 등
        - 재개 시점: 정답 확인 완료한 마지막 퀴즈의 다음 퀴즈부터 시작
        - 판단 기준: `user_quizpacks.solved_quiz_count + 1`
        - 예시:
            - 퀴즈 1, 2, 3 정답 확인 완료 (`solved_quiz_count=3`)
            - 퀴즈 4 답변 제출 후 정답 확인 전 중단
            - 재접속 시 퀴즈 4부터 시작 (`solved_quiz_count + 1 = 4`)
        - 업데이트 시점:
            - `solved_quiz_count`: [정답 확인] 버튼 클릭 시 또는 [다음] 버튼 클릭 시 증가
            - 답변 제출만 하고 정답 확인 안 하면 증가하지 않음
    - 퀴즈 답변 JSON 구조:
        - 4지선다 (multiple):
            - 구조: choice_id 배열
            - 예시: `[123, 456]` (2개 선택), `[123]` (1개 선택)
            - 설명: 사용자가 선택한 보기의 `quiz_choices.id` 배열
        - OX (truefalse):
            - 구조: choice_id 배열 (1개)
            - 예시: `[123]`
            - 설명: 4지선다와 동일한 구조 유지
        - 빈칸채우기 (choiceblank):
            - 구조: blank_position을 키로 하는 객체
            - 예시:
                - 빈칸 1개: `{"1": 123}`
                - 빈칸 2개: `{"1": 123, "2": 456}`
                - 빈칸 3개: `{"1": 123, "2": 456, "3": 789}`
            - 설명: 각 빈칸 위치(1, 2, 3)에 대해 선택한 `choice_id` 저장
        - 정답 검증:
            - 4지선다: 선택한 `choice_id` 배열이 정답 `choice_id` 배열과 완전히 일치
            - OX: 선택한 `choice_id`가 정답 `choice_id`와 일치
            - 빈칸채우기: 모든 blank_position에 대해 선택한 `choice_id`가 정답과 일치
    - 빈칸채우기 퀴즈 데이터 규칙:
        - 빈칸 개수 제한: 1개~3개
        - 보기 개수 규칙: 빈칸 개수 + 2개 (오답 보기 2개 고정)
            - 빈칸 1개 → 총 3개 보기
            - 빈칸 2개 → 총 4개 보기
            - 빈칸 3개 → 총 5개 보기
        - quiz_choices 테이블 규칙:
            - `blank_position` NOT NULL: 빈칸 개수만큼 존재 (1, 2, 3, ...)
            - `blank_position` IS NULL: 정확히 2개 존재 (오답 보기)
            - `blank_position`이 있는 보기: is_correct=true
            - `blank_position`이 없는 보기: is_correct=false
        - 예시 (빈칸 2개):
            - `quiz_id=100`, `blank_position=1`, `choice_text="민주공화국"`, `is_correct=true`
            - `quiz_id=100`, `blank_position=2`, `choice_text="국민"`, `is_correct=true`
            - `quiz_id=100`, `blank_position=NULL`, `choice_text="군주국"`, `is_correct=false`
            - `quiz_id=100`, `blank_position=NULL`, `choice_text="대통령"`, `is_correct=false`
        - 검증 시점:
            - 퀴즈 생성 시: Backend에서 규칙 위반 여부 검증
            - 퀴즈 수정 시: Backend에서 규칙 위반 여부 재검증
            - 규칙 위반 시: 에러 발생 및 저장 거부
    - 퀴즈팩 선호도 입력:
        - 입력 조건:
            - 1회차(session_number=1) 완료 시에만 입력 가능
            - 이미 입력한 경우 재입력 불가
        - 입력 시점:
            - 1회차 완료 화면에서 표시
            - 1회차 완료 후 입력하지 않았다면, 2회차 이후 완료 시에도 계속 표시
            - 한 번 입력하면 더 이상 표시하지 않음
        - 판단 로직:
            - `user_quizpacks`에서 `session_number=1`, `completed_at IS NOT NULL` 확인
            - `user_quizpack_ratings`에 해당 퀴즈팩 레코드 없음 확인
    - 서비스 이용 중 새로운 퀴즈팩의 추가:
        - 완료한 퀴즈팩이 0개일 때: 추가된 퀴즈팩의 원래 순서로 제공
        - 완료한 퀴즈팩이 1개 이상이고, 현재 진행 중인 퀴즈팩이 있을 때: 진행 중인 퀴즈팩의 다음 순서로 제공
        - 완료한 퀴즈팩이 1개 이상이고, 현재 진행 중인 퀴즈팩이 없을 때: 완료한 퀴즈팩 중 가장 마지막 순서의 다음 순서로 제공
    - Implemetation Guide
        
        ```tsx
        // Backend API: GET /api/user/quizpacks
        async function getUserQuizpacks(userId: string) {
          // 1. 모든 활성 퀴즈팩 조회
          const allQuizpacks = await db
            .from('quizpacks')
            .leftJoin('quizpack_loadmap')
            .where({ is_active: true, is_deleted: false })
            .orderBy('quizpack_loadmap.quizpack_order');
        
          // 2. 사용자의 기존 레코드 조회
          const userQuizpacks = await db
            .from('user_quizpacks')
            .where({ user_id: userId });
        
          // 3. 없는 레코드 자동 생성 (트랜잭션)
          const existingIds = userQuizpacks.map(q => q.quizpack_id);
          const missingQuizpacks = allQuizpacks.filter(
            q => !existingIds.includes(q.id)
          );
        
          for (const quizpack of missingQuizpacks) {
            const status = determineStatus(userQuizpacks, quizpack.order);
            await createUserQuizpack(userId, quizpack.id, status);
          }
        
          // 4. 최신 상태 반환
          return fetchUserQuizpacks(userId);
        }
        
        // Backend Logic 예시: 새 퀴즈팩 추가 시 Status 결정
        async function determineStatus(userId: string, newQuizpackOrder: number) {
          // 진행중인 퀴즈팩 확인
          const inProgress = await db
            .from('user_quizpacks')
            .where({ user_id: userId, status: 'in_progress' })
            .orderBy('session_number', 'desc')
            .limit(1);
          
          if (inProgress) {
            // 진행중인 퀴즈팩의 다음 순서면 closed, 아니면 closed
            return newQuizpackOrder === inProgress.quizpack_order + 1 ? 'closed' : 'closed';
          }
          
          // 완료한 퀴즈팩 중 가장 높은 순서 확인
          const lastCompleted = await db
            .from('user_quizpacks')
            .where({ user_id: userId, status: 'completed' })
            .orderBy('quizpack_order', 'desc')  // ← JOIN 없이 바로 정렬!
            .limit(1);
          
          if (lastCompleted) {
            return newQuizpackOrder === lastCompleted.quizpack_order + 1 ? 'opened' : 'closed';
          }
          
          // 아무것도 없으면 1번만 opened
          return newQuizpackOrder === 1 ? 'opened' : 'closed';
        }
        
        // 퀴즈팩 완료 화면에서 선호도 입력 영역 표시 여부
        async function shouldShowRatingInput(userId, quizpackId) {
          // 1. 1회차 완료 여부 확인
          const firstSessionCompleted = await db
            .from('user_quizpacks')
            .where({
              user_id: userId,
              quizpack_id: quizpackId,
              session_number: 1
            })
            .whereNotNull('completed_at')
            .first();
        
          if (!firstSessionCompleted) {
            return false; // 1회차 완료 안 함
          }
        
          // 2. 이미 입력했는지 확인
          const ratingExists = await db
            .from('user_quizpack_ratings')
            .where({
              user_id: userId,
              quizpack_id: quizpackId
            })
            .first();
        
          return !ratingExists; // 입력 안 했으면 true
        }
        
        // 퀴즈와 보기 순서 랜덤화: Frontend/Backend
        const quizzes = await fetchQuizzes(quizpackId);
        const userQuizpackId = 12345; // DB에서 조회한 ID
        
        // user_quizpack_id를 seed로 바로 사용
        const shuffledQuizzes = seededShuffle(quizzes, userQuizpackId);
        const shuffledChoices = seededShuffle(choices, userQuizpackId);
        ```
        
        **장점**:
        - ✅ **추가 필드 불필요** - DB 구조 단순 유지
        - ✅ **세션별 고유성 자동 보장** - user_quizpack_id는 이미 세션별로 고유함
        - ✅ **구현 단순** - 별도 seed 생성/저장 로직 불필요
        - ✅ **일관성 유지** - user_quizpack_id를 이미 세션 식별자로 사용 중
        - ✅ **디버깅 용이** - user_quizpack_id만 알면 순서 재현 가능
        
        **동작 예시**:
        ```
        [1회차]
        user_quizpack_id = 100
        → 퀴즈 순서: [3, 1, 4, 2, 5]
        → 중단 후 재접속해도 여전히 [3, 1, 4, 2, 5]
        
        [2회차]
        user_quizpack_id = 200 (새로운 세션)
        → 퀴즈 순서: [2, 5, 1, 3, 4] (다름)
        
        // ⚠️ 주의: JavaScript Math.random()은 시드를 지원하지 않음
        // 반드시 seedrandom 라이브러리 사용 필요
        
        // 설치: npm install seedrandom
        // 타입: npm install --save-dev @types/seedrandom
        
        import seedrandom from 'seedrandom';
        
        function seededShuffle<T>(array: T[], seed: number): T[] {
          const rng = seedrandom(seed.toString());
          const shuffled = [...array];
          
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          
          return shuffled;
        }
        
        // 사용 예시
        const quizzes = await fetchQuizzes(quizpackId);
        const userQuizpackId = 12345; // DB에서 조회한 ID
        
        const shuffledQuizzes = seededShuffle(quizzes, userQuizpackId);
        const shuffledChoices = seededShuffle(choices, userQuizpackId);
        
        // 재접속 시 복구 로직
        async function getResumeQuizOrder(userQuizpackId: number) {
          const session = await db
            .from('user_quizpacks')
            .where({ id: userQuizpackId })
            .first();
          
          // 정답 확인 완료한 퀴즈 수 + 1 = 다음에 풀 퀴즈
          return session.solved_quiz_count + 1;
        }
        
        // 필드 업데이트 시점 정의
        // 1. 퀴즈 답변 제출 시
        async function submitAnswer(userQuizpackId, quizId, answer) {
          // user_quizzes에 INSERT
          await db.from('user_quizzes').insert({
            user_quizpack_id: userQuizpackId,
            quiz_id: quizId,
            quiz_order: currentOrder,
            selected_answers: answer,
            is_correct: checkAnswer(answer),
            answered_at: new Date()
          });
          
          // ⚠️ solved_quiz_count는 아직 증가 안 함!
        }
        
        // 2. [정답 확인] 버튼 클릭 시 (또는 [다음] 버튼 클릭 시)
        async function confirmAnswer(userQuizpackId) {
          await db
            .from('user_quizpacks')
            .where({ id: userQuizpackId })
            .increment('solved_quiz_count', 1);  // ✓ 이 시점에 증가
        }
        ```
        
        ### 시나리오 예시
        ```
        [진행 중]
        퀴즈 1: 답변 제출 → 정답 확인 → solved_quiz_count = 1
        퀴즈 2: 답변 제출 → 정답 확인 → solved_quiz_count = 2
        퀴즈 3: 답변 제출 → 정답 확인 → solved_quiz_count = 3
        퀴즈 4: 답변 제출 → (정답 확인 전 중단!) → solved_quiz_count = 3
        
        [재접속]
        resumeOrder = solved_quiz_count + 1 = 4
        → 퀴즈 4부터 시작 ✓
        ```
        
        ### 장점
        - ✅ **스키마 변경 불필요**
        - ✅ **로직 단순** - 단순 산술 연산
        - ✅ **일관성 보장** - solved_quiz_count는 이미 "풀이한 퀴즈 수"의 의미
        - ✅ **엣지 케이스 자동 처리**
        ```
          답변 안 한 퀴즈: user_quizzes에 레코드 없음
          답변했지만 정답 확인 안 함: solved_quiz_count 증가 안 됨
          → 둘 다 solved_quiz_count + 1로 처리됨
        ```
        
    
- **Login Policy**
    - 인증 방식: Supabase Auth (OAuth 2.0)
        - 지원 Provider: Google, Kakao
        - JWT 토큰 관리는 Supabase가 자동 처리
        - Refresh Token을 통한 세션 자동 갱신
    - 다중 기기 로그인: 허용 (MVP 단계)
        - 동일 계정으로 여러 기기에서 동시 로그인 가능
        - 각 기기는 독립적인 세션 유지
    - 데이터 보안: Supabase RLS (Row Level Security)
        - 모든 테이블에 RLS 정책 적용
        - 사용자는 본인의 데이터만 조회/수정 가능
    - 로그인 이력: `user_login_history` 테이블에 기록
        - 목적: 분석 및 보안 감사용
        - 로그인 시점, 방식(Google/Kakao) 기록
    - 로그아웃 처리:
        - 클라이언트: Supabase Auth signOut() 호출
        - 서버: JWT 토큰 무효화 (Supabase 자동 처리)
    - Phase 2 예정 기능:
        - 단일 세션 정책 (한 번에 하나의 기기에서만 로그인)
        - Supabase Realtime Presence를 활용한 중복 로그인 감지
        - 기존 세션 강제 로그아웃 알림
    - backup_260117
        - 단일 세션 정책: 하나의 계정은 한 번에 하나의 기기/브라우저에서만 로그인 상태를 유지한다.
        - 중복 로그인 처리:
            - 동일 계정으로 새로운 기기 또는 브라우저에서 로그인 시도 시, 기존 로그인 세션을 즉시 무효화하고 새로운 세션을 활성화한다.
            - 예시:
                - PC Chrome에서 로그인 중인 사용자가 Mobile Safari에서 동일 계정으로 로그인 하면,
                - PC Chrome의 세션은 즉시 만료되고, Mobile Safari 세션이 활성화됨
        - 기존 세션 무효화 처리:
            - 새 기기/브라우저에서 로그인 성공 시, 기존 기기/브라우저에 실시간으로 로그아웃 알림을 전송한다.
            - 기존 기기/브라우저는 알림 수신 즉시 로그아웃 처리되고 로그인 화면으로 자동 이동한다.
            - 토스트 팝업 표시: "다른 기기에서 로그인하여 로그아웃되었습니다."
            - 실시간 알림을 받지 못한 경우(네트워크 끊김 등), 다음 API 요청 시 토큰 검증 실패로 로그아웃 처리한다.
        - 세션 토큰 관리:
            - 로그인 시 JWT 세션 토큰을 발급하고 `user_sessions` 테이블에 저장한다.
            - 새 로그인 시 기존 세션의 `session_type`을 `logout`으로 변경하고, 새로운 `login` 레코드를 생성한다.
            - 모든 API 요청은 세션 토큰을 포함해야 하며, 서버는 토큰의 유효성을 검증한다.
        - 로그아웃 처리:
            - 사용자가 직접 로그아웃: 현재 세션의 `session_type`을 `logout`으로 변경
            - 중복 로그인으로 인한 강제 로그아웃: 기존 세션의 `session_type`을 `logout`으로 변경 후 실시간 알림 전송
        - 예외 상황:
            - 브라우저 탭을 여러 개 열어도 같은 브라우저 내에서는 세션 공유 (동일 세션 토큰 사용)
            - 새로고침, 페이지 이동 시에도 세션 유지
        - Implemetation Guide
            
            ```tsx
            // Frontend: SSE 연결
            const eventSource = new EventSource('/api/auth/session-events');
            eventSource.onmessage = (event) => {
              if (event.data === 'SESSION_EXPIRED') {
                // 즉시 로그아웃 처리
                handleForceLogout();
              }
            };
            
            // Backend: 새 로그인 시 기존 세션에 알림 전송
            await sendSessionExpiredEvent(oldSessionId);
            ```
            
- **Statistics Policy**
    - 통계 관리 구조:
        - 퀴즈별 통계: `quiz_statistics` 테이블로 관리
        - 퀴즈팩별 통계: `quizpack_statistics` 테이블로 관리
        - 메인 테이블(`quizzes`, `quizpacks`)에서 통계 필드 제거하여 성능 최적화
    - 퀴즈 통계 (`quiz_statistics`):
        - 관리 항목:
            - `play_count`: 플레이 횟수
            - `correct_count`: 정답 횟수
            - `incorrect_count`: 오답 횟수
            - `correct_rate`: 정답률 (계산값, 0.00~100.00)
        - 업데이트 방식: **실시간 (Trigger)**
        - 업데이트 시점: `user_quizzes` 테이블에 답변 레코드 INSERT 시 자동 업데이트
        - 계산 로직:
            - 답변 제출마다 play_count 증가
            - 정답이면 correct_count 증가, 오답이면 incorrect_count 증가
            - 정답률은 10회 플레이마다 재계산 (성능 최적화)
            - 공식: `correct_rate = (correct_count / play_count) * 100`
        - 동시성 처리: Row-level Locking으로 동시 업데이트 방지
    - 퀴즈팩 통계 (`quizpack_statistics`):
        - 관리 항목:
            - `total_completions`: 완료 횟수 (모든 세션 포함)
            - `total_correct_count`: 전체 정답 수
            - `total_quiz_count`: 전체 풀이 퀴즈 수
            - `average_correct_rate`: 평균 정답률 (계산값, 0.00~100.00)
            - `rating_count`: 선호도 입력 횟수
            - `rating_sum`: 선호도 합계
            - `average_rating`: 평균 선호도 (계산값, 0.00~5.00)
        - 업데이트 방식: 배치 처리 (일 1회)
        - 업데이트 시점: 매일 새벽 3시 자동 실행
        - 계산 로직:
            - 완료된 모든 `user_quizpacks` 레코드를 집계
            - 평균 정답률 공식: `(total_correct_count / total_quiz_count) * 100`
            - 평균 선호도 공식: `rating_sum / rating_count`
        - 데이터 범위: 완료 상태(`status='completed'`)인 세션만 집계
    - 통계 표시 정책:
        - 홈 화면 - 퀴즈팩 카드:
            - "나의 정답률": `user_quizpacks.correct_rate` (실시간)
            - "친구 정답률": `quizpack_statistics.average_correct_rate` (일 1회 갱신)
            - "평균 선호도": `quizpack_statistics.average_rating` (일 1회 갱신)
        - 퀴즈 화면:
            - 퀴즈별 통계는 별도로 표시하지 않음
    - 통계 재계산:
        - 데이터 정합성 문제 발생 시 관리자가 수동으로 통계 재계산 함수 실행 가능
        - 재계산 범위: 특정 퀴즈 또는 전체 퀴즈 선택 가능
    - 확장 전략:
        - MVP 단계 (사용자 ~1만명): 현재 방식 유지
        - 성장 단계 (사용자 1만~10만명):
            - Trigger 로직 최적화
            - 배치 주기 증가 (일 2~3회)
        - 확장 단계 (사용자 10만명 이상):
            - Redis 캐싱 도입
            - 비동기 처리로 DB 부하 최소화
    - Implementation Guide
        
        ```tsx
        // app/api/cron/update-stats/route.ts
        import { NextRequest, NextResponse } from 'next/server';
        import { createClient } from '@supabase/supabase-js';
        
        export const dynamic = 'force-dynamic';
        
        export async function GET(request: NextRequest) {
          try {
            // 1. Cron Secret 검증
            const authHeader = request.headers.get('authorization');
            if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
              return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
              );
            }
        
            // 2. Supabase 클라이언트 생성
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
        
            // 3. 배치 함수 실행
            const { data, error } = await supabase.rpc('batch_update_quizpack_statistics');
        
            if (error) {
              console.error('Batch update failed:', error);
              return NextResponse.json(
                { error: error.message }, 
                { status: 500 }
              );
            }
        
            // 4. 성공 응답
            return NextResponse.json({ 
              success: true, 
              timestamp: new Date().toISOString() 
            });
            
          } catch (error) {
            console.error('Cron job error:', error);
            return NextResponse.json(
              { error: 'Internal server error' }, 
              { status: 500 }
            );
          }
        }
        
        // vercel.json 설정
        {
          "crons": [
            {
              "path": "/api/cron/update-stats",
              "schedule": "0 18 * * *"
            }
          ]
        }
        
        // 환경변수 설정
        # .env.local
        CRON_SECRET=your-random-secret-here
        NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
        
        // 수동 테스트
        # 로컬 테스트
        curl -X GET \
          -H "Authorization: Bearer your-random-secret-here" \
          http://localhost:3000/api/cron/update-stats
        
        # 배포 후 테스트
        curl -X GET \
          -H "Authorization: Bearer your-random-secret-here" \
          https://your-app.vercel.app/api/cron/update-stats
        ```
        
- **Error Handling Policy**
    - 네트워크 에러:
        - 답변 제출 실패 시: 재시도 버튼 표시 + "네트워크 연결을 확인해주세요." 토스트
        - 3회 재시도 실패 시: 로컬 스토리지에 임시 저장 + "연결이 복구되면 자동으로 저장됩니다." 안내
    - 인증 에러:
        - 401 Unauthorized: 로그인 페이지로 이동 + "다시 로그인해주세요." 토스트
        - 403 Forbidden: "접근 권한이 없습니다." 토스트
    - 데이터 정합성:
        - 퀴즈팩 상태 불일치 시: 서버 데이터 기준으로 동기화
        - 클라이언트는 서버의 `solved_quiz_count`를 신뢰
    - 서버 에러:
        - 500 Internal Server Error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 토스트
        - 서비스 점검 중: 점검 안내 페이지로 이동

---

- **회원가입 / 로그인**
    - BI: 스프라이트 애니메이션
    - 슬로건: “퀴즈로 즐기는 재미있는 헌법 상식”
    - 약관동의 안내: “구글 또는 카카오 계정 연동 시 서비스 이용약관 및 개인정보 처리방침에 동의한 것으로 처리됩니다.”
        - “이용약관 및 개인정보 처리방침” 부분의 텍스트 링크 처리 (링크 : https://maperson.notion.site/2d2e387af28e804c94cecdf08c322ef6?source=copy_link)
        - “이용약관 및 개인정보 처리방침” 클릭 시 브라우저 새 탭에서 이용약관 및 개인정보 처리방침 안내 표시
    - [Google 로그인] 버튼: 클릭 시 구글 계정 인증 연동 및 로그인 프로세스 진행
    - [Kakao 로그인] 버튼: 클릭 시 카카오 계정 인증 연동 및 로그인 프로세스 진행
    - 사용자 계정에 따라 공지게시판 사용 권한 분리
        - 사용자(user): 게시물의 조회만 가능
        - 관리자(admin): 게시물의 작성, 조회, 수정, 삭제 가능
    
- **온보딩**
    - 안내 문구: “사용하실 닉네임을 정해주세요.”
    - 닉네임 입력란 표시
    - 닉네임 정합성 조건:
        - 최소 4글자 이상, 최대 20자 이내
        - 다른 사용자와 중복 불가
    - 유의사항 안내 문구: “※ 4~20자 및 한글, 영어, 숫자만 사용 가능”
    - 닉네임 입력 시 중복 자동 조회 및 안내 문구 표시: “이미 사용 중인 닉네임이에요. 창의력을 발휘해 보세요.”
    - [확정] 버튼: 닉네임 확정 조건을 충족할 때 버튼 활성화
    - 활성화된 [확정] 버튼을 클릭하면:
        - 닉네임 DB 저장
        - 닉네임 입력란은 입력된 닉네임을 표시한 상태로 비활성화
        - 닉네임 확정 안내 문구 표시:
            - “멋진 닉네임이에요!”
            - “닉네임은 프로필에서 언제든 수정할 수 있어요.”
            - “이제 헌법의 세계로 들어가 볼까요?”
        - 3초 카운트 후 홈 화면으로 자동 이동
    
- **헤더: 홈, 퀴즈, 마이페이지, 고객센터 공통**
    - BI
        - PNG 파일
        - BI 클릭 시 홈으로 이동
    - 프로필 아이콘:
        - Lucide 라이브러리 사용
        - 프로필 아이콘 클릭 시 마이페이지로 이동
    
- **홈**
    - 퀴즈팩 카드 UI/UX
        - 여러개의 퀴즈팩을 모서리가 둥근 카드 모양으로 표현
        - 마우스를 호버하면 위로 떠오르면서 살짝 확대되는 느낌의 부드러운 애니메이션과 함께 그림자 추가
        - 마우스를 클릭하면 살짝 눌렸다가 튕겨오르는 느낌의 부드러운 애니메이션 사용
        - 콘텐트 영역의 위에서부터 아래로 퀴즈팩 오름차순 정렬
        - 마우스를 드래그하면 퀴즈팩이 위아래로 스크롤됨
        - 퀴즈팩 카드 클릭 동작:
    - 퀴즈팩 카드 표시 정보
        - 퀴즈팩의 순서를 나타내는 숫자: 예) 001, 002, …
        - 퀴즈팩에 포함된 퀴즈의 난이도 범위:
            - 난이도 1개: 예) 난이도 중하
            - 난이도 2개: 예) 난이도 중 - 중상
            - 난이도가 3개 이상일 때는 최하 난이도와 최상 난이도 표시: 예) 난이도 중하 - 중상
        - 퀴즈팩 태그 (keywords):
            - 용도: 홈 화면의 퀴즈팩 카드에 태그 형태로 표시
            - 저장 형식: 쉼표(,)로 구분된 텍스트
                - 예: "제1장 총강, 기본원칙, 민주공화국"
            - 입력 규칙:
                - 태그 개수: 1개~3개
                - 태그 길이: 각 2~10자
                - 사용 가능 문자: 한글, 영문, 숫자, 공백
                - 특수문자 사용 불가 (#, @, !, 등)
            - 표시 방법:
                - 홈 화면 퀴즈팩 카드에 '#태그' 형태로 표시
                - 최대 3개까지 표시
                - 태그 스타일: 보라색 테두리, 반투명 배경
            - 예시:
                - 퀴즈팩 001
                - 난이도: 중하 - 중상
                - 퀴즈 10개
                - #제1장 총강 #기본원칙 #민주공화국
                - 나의 정답률: 아직 풀지 않았어요.
                - 친구 정답률: 56.2%
        - 퀴즈팩에서 제공하는 퀴즈의 개수: 예) 퀴즈 10개
        - 퀴즈팩의 상태: 열림, 진행 중, 완료, 닫힘
            - 닫힘: 새로운 퀴즈팩을 시작할 수 없는 상태 → 클릭하면, 토스트 팝업 표시: 예) 순서대로 진행해 주세요.
            - 열림: 새로운 퀴즈팩을 시작할 수 있는 상태 → 클릭하면, 퀴즈팩을 시작하고 1번 퀴즈 표시
            - 진행 중: 퀴즈팩을 시작한 후 마지막 퀴즈의 정오답 결과를 확인하지 않고 중단한 상태 → 클릭하면, 중단된 퀴즈부터 재개
            - 완료: 퀴즈팩을 시작한 후 마지막 퀴즈의 정오답 결과를 확인한 상태 → 클릭하면, 퀴즈팩을 시작하고 1번 퀴즈 표시 (퀴즈 순서 랜덤)
        - 사용자의 최종 정답률:
            - 완료 상태일 때 사용자의 정답률 기록 중 가장 마지막으로 기록된 정답률 표시: 예) 나의 정답률 65.8%
            - 이외의 상태는 “아직 풀지 않았어요.” 표시
        - 전체 사용자의 평균 정답률:
            - 완료한 사용자가 1명 이상일 때, 완료한 모든 사용자의 최종 정답률 평균 표시: 예) 친구 정답률 56.2%
            - 완료한 사용자가 0명일 때는 “아직 아무도 안했어요.” 표시
        - 전체 사용자의 평균 선호도: 예) ★★★★☆
            - 완료한 사용자가 1명 이상일 때:
                - 선호도 1점 = 별 1개
                - 선호도 점수 범위 = 0점 ~ 5점
                - 선호도 점수의 소수점 이하는 반올림 처리
            - 완료한 사용자가 0명일 때는 “가장 먼저 도전하고 별점을 주세요.” 표시
    - 모든 퀴즈팩 완료 팝업
        - 화면의 중앙 상단에 트로피 스타일의 아이콘 표시
        - 안내문구:
            - “축하합니다!”
            - “대한민국의 헌법을 마스터한 #{닉네임}님을 대법관으로 임명합니다.”
            - “앞으로도 우리나라의 헌법 수호를 위해 최선을 다해주세요.”
        - [확인] 버튼: 클릭하면 팝업 종료
    
- **퀴즈팩 시작 및 완료**
    - 퀴즈 유형
        - 4지선다: 질문에 맞는 답을 4개의 보기에서 고르는 유형 (정답 개수 1~2개)
        - OX: 질문에 맞는 답을 '맞아요', '틀려요' 중에서 선택하는 유형
        - 빈칸채우기: 지문의 빈칸에 들어갈 답을 보기에서 선택하는 유형 (빈칸 개수 1~3개, 보기 개수는 빈칸 개수 + 2개)
    - 퀴즈 화면 표시 정보
        - 퀴즈팩 [나가기] 버튼:
            - 정오답이 확인되지 않은 퀴즈가 0개일 때 : 홈 화면으로 이동
            - 정오답이 확인되지 않은 퀴즈가 1개 이상일 때 : 퀴즈 중단 안내 팝업 표시
        - 퀴즈의 순서를 숫자로 표시한 네비게이션: 예) ① ② … ⑨ ⑩
            - 각 숫자의 상태: 현재, 예정, 정답, 오답 → 컬러로 구분
            - 현재 퀴즈를 클릭하면 변화 없음
            - 예정 퀴즈를 클릭하면, 토스트 팝업 표시: 예) 순서대로 진행해 주세요.
            - 정답 또는 오답 퀴즈를 클릭하면 해당 퀴즈 화면으로 이동하고, 퀴즈의 정오답 결과 표시
            - 숫자는 최대 10개까지 표시
            - 숫자가 10개를 초과하면, 네비게이션의 영역 좌우 끝에 “<”, “>”를 표시하고 클릭하면 좌우에 숨겨져 있는 숫자가 나타나도록 동작
        - 퀴즈의 내용에 해당하는 장(chapter)의 번호와 제목, 조(article)의 번호: 예) 제1장 총강 - 제1조
        - 퀴즈의 난이도: 예) 난이도 중하
        - 질문 영역: 예) 다음 지문을 읽고 맞는 답을 골라주세요.
        - 지문 영역: 예) 헌법은 대한민국의 법체계 중 가장 상위의 법이다.
        - 보기 영역: 예) 맞아요 / 틀려요
        - 힌트 영역: 예) 헌법이 가장 중요하다. → 힌트가 없는 경우는 “없음” 표시
        - 정오답 효과:
            - 정답일 때:
                - correct.wav 파일 플레이
                - 정답 이미지를 화면에 오버레이로 표시 후 자동으로 사라짐
            - 오답일 때:
                - incorrect.wav 파일 플레이
                - 오답 이미지를 화면에 오버레이로 표시 후 자동으로 사라짐
        - 정오답 결과 표시:
            - 내가 선택한 답이 정답일 때: 선택한 답에 정답을 표시
            - 내가 선택한 답이 오답일 때: 선택한 답에 오답을 표시하고, 다른 보기에 정답을 표시
        - 해설: 예) 헌법은 대한민국의 법체계 중 가장 상위에 있는 법입니다.
        - [정답 확인] 버튼:
            - 활성화 조건:
                - 4지선다, OX 유형: 1개 이상의 답을 선택했을 때
                - 빈칸채우기: 모든 빈칸에 답을 선택했을 때
            - 정오답 결과 확인 후 [다음] 버튼으로 변경하고, [다음] 버튼을 클릭하면 다음 순서의 퀴즈 표시
            - 마지막 퀴즈의 정오답 결과 확인 후 [완료] 버튼으로 변경하고, [완료] 버튼을 클릭하면 퀴즈팩 완료 화면 표시
        - [이전] 버튼:
            - 2번 퀴즈 이후부터 정오답 결과 확인 후 표시
            - 클릭하면 현재 퀴즈의 바로 직전 순서의 퀴즈 표시
        - 퀴즈 중단 안내 팝업 표시 정보
            - 안내: “아직 풀지 않은 퀴즈가 남아있어요. 그래도 중단할까요?”
            - 버튼: [네] / [아니오]
                - [네] 버튼을 클릭하면, 홈 화면으로 이동
                - [아니오] 버튼을 클릭하면, 팝업 종료
    - 퀴즈팩 완료 화면 표시 정보
        - 제목: “수고하셨습니다!”
        - 안내: “#{퀴즈팩번호} 퀴즈팩을 완료했어요.”
        - 퀴즈팩에 포함된 퀴즈의 난이도 범위:
            - 난이도 1개: 예) 난이도 중하
            - 난이도 2개: 예) 난이도 중 - 중상
            - 난이도가 3개 이상일 때는 최하 난이도와 최상 난이도 표시: 예) 난이도 중하 - 중상
        - 정답률: 예) 70%
        - 정답수와 문제수: 예) 7 / 10
        - 오답 퀴즈 번호: 예) ① ④ ⑨ → 오답이 없는 경우 “완벽해요!” 표시
        - 퀴즈팩을 시작하고 완료할 때까지 걸린 시간: 예) “4분 25초 걸렸어요.”
        - 퀴즈팩 선호도 선택:
            - 정책:
                - 1회차 완료 시에만 선택할 수 있음
                - 선호도 입력은 선택사항 (필수 아님)
                - 입력하지 않고 [다음 퀴즈팩 시작] 또는 [나가기] 클릭 가능
                - 2회차 이후부터는 1회차에서 입력한 선호도 점수 표시 (입력한 경우)
                - 1회차에서 입력하지 않은 경우, 2회차 이후에도 선호도 입력 영역 표시
            - 안내:
                - “이번 퀴즈가 유익하고 재미있었나요?”
                - “※ 선호도는 최초 1회만 입력할 수 있어요.”
            - 선호도 입력 영역을 ‘별’로 표시: 예) ☆☆☆☆☆
                - 왼쪽 끝부터 오른쪽으로 1점, 2점, 3점, 4점, 5점을 의미함
                - 예를 들어 3점을 선택하면 1점~3점까지의 ‘별’이 자동으로 채워짐
                - 입력 전 상태에서는 모든 별이 비어있음 (☆☆☆☆☆)
        - 버튼: [나가기] [다음 퀴즈팩 시작]
            - [나가기] 버튼을 클릭하면, 홈 화면으로 이동
            - [다음 퀴즈팩 시작] 버튼 클릭:
                - 다음 퀴즈팩이 있으면: 퀴즈 결과 및 퀴즈팩 선호도 정보를 백엔드에 저장하고, 다음 퀴즈팩의 1번 퀴즈 화면으로 이동
                - 다음 퀴즈팩이 없으면: 퀴즈 결과 및 퀴즈팩 선호도 정보를 백엔드에 저장하고, 홈 화면으로 이동 + 모든 퀴즈팩 완료 팝업 표시
    
- **마이페이지**
    - 프로필 아이콘: lucide library
    - 사용자 닉네임: 예) 발전하는밍구리
    - 닉네임 수정 아이콘: lucide library
    - 닉네임 수정 아이콘을 클릭하면, 닉네임 영역을 수정 가능한 상태로 변경하고, [확정] 버튼 표시
        - 유의사항 안내 문구: “※ 4~20자 및 한글, 영어, 숫자만 사용 가능”
        - 닉네임 입력 시 중복 자동 조회 및 안내 문구 표시: “이미 사용 중인 닉네임이에요. 창의력을 발휘해 보세요.”
        - 닉네임 확정 조건을 충족할 때 [확정] 버튼 활성화
        - 활성화된 [확정] 버튼을 클릭하면, 수정된 닉네임을 화면에서 표시하고 닉네임 DB 업데이트
    - 계정 종류: 구글 또는 카카오
    - id: 소셜 계정 연동 이메일 표시
    - [로그아웃] 버튼: 클릭 시 로그아웃 처리 후 로그인 화면으로 이동
    - 회원탈퇴:
        - 작은 텍스트에 링크 처리
        - 텍스트 클릭 시 소셜 계정 연동 해제 프로세스 진행
    
- **고객센터**
    - 공지게시판
        - 검색 기능: 제목+내용 검색
        - 게시물 목록 표시 정보
            - 공지 유형: 일반, 중요
            - 제목: 예) “모두의 헌법 v0.5가 오픈됐습니다.”
            - 조회수:
                - 예) 15회
                - 조회수 증가 조건: 게시물 상세 팝업을 열 때마다 (사용자 중복 허용)
            - 작성 일시: 예) 2025.12.23 19:16 → 게시물의 업데이트 일시를 표시
            - 게시물을 클릭하면 게시물 상세 팝업 표시
        - 페이지 네비게이션: 일반적인 유형 사용
        - 게시물 상세 팝업 표시 정보
            - 구분: 일반, 중요
            - 작성 일시: 예) 2025.12.23 19:16 → 게시물의 업데이트 일시를 표시
            - 조회수: 예) 15회
            - 제목: 예) “모두의 헌법 v0.5가 오픈됐습니다.”
            - 내용: 예) “안녕하세요. 코그니티입니다. 퀴즈로 즐기는 재미있는 헌법 상식, 모두의 헌법이 베타 서비스를 시작했습니다.”
            - [닫기] 버튼: 클릭 하면 팝업 종료
        - 사용자 계정에 따라 공지게시판 사용 권한 분리
            - 사용자(user): 게시물의 조회만 가능
            - 관리자(admin): 게시물의 작성, 조회, 수정, 삭제 가능
        
    - 문의메일 안내
        
        안내 문구 표시: “문의사항은 cognityhelp@gmail.com으로 접수해 주세요.”