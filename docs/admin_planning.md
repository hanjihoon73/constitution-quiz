# Admin Planning

category: 모두의 헌법
assign: Jason
status: Not Started
Created: 2025년 5월 28일 오후 11:44

1. **어드민 계정 정책**
    1. URL: `/admin`
    2. 접속 권한: `users.role = admin`
    3. 어드민 권한 사용자는 서비스와 어드민 모두 사용 가능
2. **대시보드:**
    1. Active User: 해당 기간 중 퀴즈팩을 시작한 사용자
    2. Timezone: KST(한국 표준시)
    3. DAU
    4. WAU
    5. MAU
    6. Stickness = (DAU ÷ MAU) x 100
3. **콘텐츠 관리:**
    1. 퀴즈팩에 속하는 퀴즈들을 표시하는 방식 (토글)
    2. 퀴즈팩 목록 표시 정보:
        1. id → `quizpacks.id`
        2. 현재 퀴즈수 → `quizpakcs.quiz_count_all`
        3. 최대 퀴즈수 → `quizpacks.quiz_max`
        4. 키워드 → `quizpacks.keywords`
        5. 상태:  true=”On” / false=”Off” → quizpacks.is_active
        6. [수정] 버튼 → 클릭 → 수정 모드 전환
            1. 퀴즈수, 최대 퀴즈수, 키워드, 상태 수정 가능 / id는 수정 불가
            2. [취소] 버튼 → 클릭 → 조회 모드 전환
            3. [저장] 버튼 → not null 조건 및 데이터 정합성 체크 → DB 업데이트
    3. 퀴즈 목록 표시 정보:
        1. id → `quizzes.id`
        2. 순서 → `quizzes.quiz_order`
        3. 난이도: 상 / 중상 / 중 / 중하 / 하 → `quizzes.difficulty_id`
        4. 유형: 선다형 / OX / 빈칸채우기 → `quizzes.quiz_type`
        5. 문제 → `quizzes.question` 
        6. 상태: true=”On” / false=”Off” → `quizzes.is_active`
        7. [미리보기] 버튼 → 클릭 → 퀴즈 화면 모달 표시 → 힌트, 퀴즈 정오답 선택, 정오답 체크, 정오답 결과 표시 기능 적용
        8. [상세] 버튼 → 클릭 → 퀴즈 상세 팝업 표시
        9. 퀴즈 상세 팝업: 퀴즈 유형(3가지)별로 문제, 지문, 보기, 정답, 힌트, 해설을 조회하고 수정할 수 있어야 함
4. **사용자 관리:**
    1. 검색: id / 닉네임 → 실시간 조회 방식
    2. 필터: 계정 종류(google, kakao) / 권한(user, admin) / 상태(true, false) / 테스트 계정(true, false) → 필터 간 중복 적용 가능
    3. 정렬: id(default 오름차순) / 가입 일시
    4. 사용자 목록 표시 정보:
        1. id → `users.id`
        2. 계정 종류 → `users.rovider`
        3. 닉네임 → `users.nickname`
        4. 권한 → `users.role`
        5. 상태: true=”On” / false = “Off” → `users.is_active`
        6. 가입 일시 → `users.created_at`
        7. 테스트 계정: true=”Y” / false=”N” → `users.is_test`
        8. [수정] 버튼 → 클릭 → 사용자 정보 팝업 표시
        9. 사용자 정보 팝업
            1. id / 계정 종류 / 가입 일시 수정 불가
            2. 닉네임 / 타이틀 / 권한 / 상태 / 테스트 계정 수정 가능
                1. 닉네임 수정 시 중복 실시간 조회 및 안내
                2. 타이틀, 권한은 드롭다운 메뉴에서 선택
                3. 상태, 테스트 계정은 토글 버튼으로 선택
            3. [취소] 버튼 → 클릭 → 팝업 종료
            4. [저장] 버튼 → 클릭 → not null 조건 및 데이터 정합성 체크 → DB 업데이트
5. **활동 관리:**
    1. 검색: id / 닉네임 → 실시간 조회 방식
    2. 정렬: id / 누적 XP(default 내림차순) / 주간 XP / 주간 랭킹
    3. 사용자 목록 표시 정보:
        1. id → `users.id`
        2. 닉네임 → `users.nickname`
        3. 타이틀 → `users.title`
        4. 누적 XP → `users.total_xp`
        5. 주간 XP → `users.weekly_xp`
        6. 주간 랭킹 → 실시간 조회
        7. 퀴즈 개수 → `users.total_quiz_attempts`
        8. 정답 개수 → `users.total_correct_answers`
        9. 평균 정답률 → `users.quizpack_avrg_correct`
        10. 주간 퀴즈팩 완료 개수 → `users.weekly_unique_packs_count`
        11. 주간 퀴즈팩 완료 횟수 → `users.weekly_total_packs_count`
        12. 마지막 로그인 → `user_login_history`
6. **리그 테스트:**
    1. /test-league.html 기능을 모두 옮겨올 것