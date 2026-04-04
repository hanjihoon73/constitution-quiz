# OAuth 설정 가이드

> **프로젝트**: 모두의 헌법 (Constitution Quiz v0.5)  
> **작성일**: 2026-02-01  
> **Supabase Project ID**: oawyhlmquuutqfuewaoc

이 문서는 Google OAuth와 Kakao OAuth를 Supabase에 연동하는 방법을 단계별로 설명합니다.

---

## 📋 미리 알아두세요

OAuth 설정에는 3곳의 콘솔을 사용합니다:

| 콘솔 | 용도 | URL |
|------|------|-----|
| **Supabase** | OAuth Provider 활성화 | https://supabase.com/dashboard |
| **Google Cloud** | Google 로그인 앱 등록 | https://console.cloud.google.com |
| **Kakao Developers** | 카카오 로그인 앱 등록 | https://developers.kakao.com |

**중요한 URL** (복사해 두세요):
- **Supabase Callback URL**: `https://oawyhlmquuutqfuewaoc.supabase.co/auth/v1/callback`

---

## 🔵 Part 1: Google OAuth 설정

### Step 1: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. **[새 프로젝트]** 클릭
4. 프로젝트 이름 입력: `모두의헌법` (또는 원하는 이름)
5. **[만들기]** 클릭

### Step 2: OAuth 동의 화면 설정

1. 좌측 메뉴에서 **[API 및 서비스]** → **[OAuth 동의 화면]** 클릭
2. User Type 선택:
   - 테스트용: **외부(External)** 선택
   - **[만들기]** 클릭
3. 앱 정보 입력:
   - **앱 이름**: `모두의 헌법`
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **개발자 연락처 정보**: 본인 이메일 입력
4. **[저장 후 계속]** 클릭
5. 범위(Scopes) 페이지: 그대로 **[저장 후 계속]** 클릭
6. 테스트 사용자 페이지: 그대로 **[저장 후 계속]** 클릭
7. 요약 페이지: **[대시보드로 돌아가기]** 클릭

### Step 3: OAuth 클라이언트 ID 생성

1. 좌측 메뉴에서 **[API 및 서비스]** → **[사용자 인증 정보]** 클릭
2. 상단의 **[+ 사용자 인증 정보 만들기]** → **[OAuth 클라이언트 ID]** 클릭
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `모두의헌법 웹` (또는 원하는 이름)
5. **승인된 리디렉션 URI** 섹션에서 **[+ URI 추가]** 클릭:
   ```
   https://oawyhlmquuutqfuewaoc.supabase.co/auth/v1/callback
   6. **[만들기]** 클릭
7. 팝업에서 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사해 둡니다
   ```
   ID: <YOUR_GOOGLE_CLIENT_ID>
   PW: <YOUR_GOOGLE_CLIENT_SECRET>
   ```
> ⚠️ **중요**: 클라이언트 보안 비밀번호는 다시 볼 수 없으니 안전한 곳에 저장하세요!

### Step 4: Supabase에 Google Provider 설정

1. [Supabase Dashboard](https://supabase.com/dashboard/project/oawyhlmquuutqfuewaoc/auth/providers) 접속
2. **Authentication** → **Providers** 메뉴 클릭
3. **Google** 항목을 찾아 클릭하여 펼침
4. **Enable Sign in with Google** 토글 ON
5. 아래 정보 입력:
   - **Client ID**: Google에서 복사한 클라이언트 ID
   - **Client Secret**: Google에서 복사한 클라이언트 보안 비밀번호
6. **[Save]** 클릭

✅ **Google OAuth 설정 완료!**

---

## 🟡 Part 2: Kakao OAuth 설정

### Step 1: Kakao Developers 앱 생성

1. [Kakao Developers](https://developers.kakao.com) 접속 및 로그인
2. 상단 메뉴에서 **[앱]** 클릭
3. **[+앱 생성]** 클릭
4. 앱 정보 입력:
   - **앱 이름**: `모두의헌법` (또는 원하는 이름)
   - **사업자명**: 본인 이름 또는 회사명
   - **카테고리**: 앱의 성격에 맞는 카테고리 선택
5. **[저장]** 클릭

### Step 2: 카카오 로그인 활성화

1. 생성된 앱 클릭하여 상세 페이지 진입
2. 좌측 메뉴에서 **[카카오 로그인]** 클릭
3. **활성화 설정** 항목에서 **ON** 으로 변경
4. **[저장]** 클릭

### Step 3: Redirect URI 등록

1. 좌측 메뉴에서 **[앱 키]** 클릭
2. **REST API 키** 섹션에서 **[설정]** 또는 **[편집]** 버튼 클릭
3. **"카카오 로그인 리다이렉트 URI"** 입력란에 아래 URL 입력:
   ```
   https://oawyhlmquuutqfuewaoc.supabase.co/auth/v1/callback
   ```
4. 오른쪽 **[+]** 버튼 클릭하여 추가
5. 페이지 하단 **[저장]** 클릭

> 💡 **참고**: 개발용으로 `http://localhost:3000/auth/callback` 도 추가할 수 있습니다.

### Step 4: 동의항목 설정

1. 좌측 메뉴에서 **[카카오 로그인]** → **[동의항목]** 클릭
2. 아래 항목들의 동의 수준 설정:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의 (선택사항)
   - **카카오계정(이메일)**: 필수 동의
3. 각 항목별로 **[저장]** 클릭

### Step 5: 앱 키 복사

1. 좌측 메뉴에서 **[앱 키]** 클릭
2. **REST API 키** 를 복사해 둡니다 (32자리 영숫자)
   ```
   key: 97fdea2acd0b8d7d8325f4261dd0ff1d
   ```

### Step 6: Client Secret 생성

1. 좌측 메뉴에서 **[카카오 로그인]** → **[보안]** 클릭
2. **Client Secret** 섹션에서 **[코드 생성]** 클릭
3. 생성된 **Client Secret 코드**를 복사
4. **활성화 상태**를 **사용함**으로 변경
5. **[저장]** 클릭
   ```
   secret: RHAnSdK8XfiMNwo5Ith4LbX107A8k7tV
   ```

### Step 7: Supabase에 Kakao Provider 설정

1. [Supabase Dashboard](https://supabase.com/dashboard/project/oawyhlmquuutqfuewaoc/auth/providers) 접속
2. **Authentication** → **Providers** 메뉴 클릭
3. **Kakao** 항목을 찾아 클릭하여 펼침
4. **Enable Sign in with Kakao** 토글 ON
5. 아래 정보 입력:
   - **Client ID**: Kakao에서 복사한 **REST API 키**
   - **Client Secret**: Kakao에서 복사한 **Client Secret 코드**
6. **[Save]** 클릭

✅ **Kakao OAuth 설정 완료!**

---

## 🧪 테스트 방법

설정이 완료되면 아래와 같이 테스트합니다:

1. 터미널에서 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 http://localhost:3000 접속

3. 로그인 페이지에서:
   - **[Google로 계속하기]** 버튼 클릭 → Google 계정으로 로그인
   - **[카카오로 계속하기]** 버튼 클릭 → 카카오 계정으로 로그인

4. 로그인 성공 시:
   - 신규 사용자 → 온보딩 페이지(`/onboarding`)로 이동
   - 기존 사용자 → 홈 페이지(`/`)로 이동

---

## ❓ 문제 해결

### "Invalid redirect URI" 에러
- Google/Kakao 콘솔에서 Redirect URI가 정확히 입력되었는지 확인
- URL 끝에 `/`가 있거나 없거나 차이로 에러가 날 수 있음

### "앱이 검증되지 않음" 경고 (Google)
- 테스트 단계에서는 정상입니다
- **[고급]** → **[안전하지 않음으로 이동]** 클릭하여 진행 가능
- 프로덕션 배포 전에 앱 인증을 받으면 경고가 사라집니다

### 카카오 로그인 시 "동의 항목이 없습니다" 에러
- Step 4(동의항목 설정)에서 최소 하나 이상의 항목을 설정했는지 확인

### 카카오 로그인 시 "KOE205 invalid_scope" 에러

**에러 메시지**: `설정하지 않은 동의 항목: profile_image`

**원인**: Supabase가 `profile_image` 스코프를 요청하는데, Kakao 앱에서 **프로필 사진** 동의항목이 "사용 안 함" 상태일 때 발생

**해결 방법**:
1. Kakao Developers 콘솔 → **[카카오 로그인]** → **[동의항목]** 이동
2. **프로필 사진** 항목의 **[설정]** 버튼 클릭
3. **선택 동의** 또는 **필수 동의**로 변경
4. **[저장]** 클릭

**필수 동의항목 설정**:
| 항목 | ID | 권장 설정 |
|------|-----|----------|
| 닉네임 | profile_nickname | 필수 동의 |
| 프로필 사진 | profile_image | **선택 동의** (필수!) |
| 카카오계정(이메일) | account_email | 필수 동의 |

> ⚠️ **중요**: 프로필 사진을 "사용 안 함"으로 두면 Supabase 카카오 로그인이 작동하지 않습니다!

---

## 📝 설정 완료 후 체크리스트

- [x] Google Cloud에서 OAuth 클라이언트 ID 생성 완료
- [x] Supabase에서 Google Provider 활성화 완료
- [x] Kakao Developers에서 앱 생성 및 카카오 로그인 활성화 완료
- [x] Supabase에서 Kakao Provider 활성화 완료
- [x] 테스트: Google 로그인 성공
- [x] 테스트: Kakao 로그인 성공

