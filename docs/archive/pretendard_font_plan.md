# Pretendard 전역 폰트 적용 계획서

## 1. 개요
* 변경 기능: '모두의 헌법' 애플리케이션의 기본 서비스 폰트를 `Pretendard Variable`로 지정
* 관련 PRD: `docs/pretendard_font_prd.md`

## 2. 작업 폴더 구조
* 대상 파일: `src/app/globals.css`
* 문서 보관: `docs/` 폴더 산하에 계획 및 PRD 위치 (기존 구조 준수)
* 별도 패키지 `npm install`이나 `next/font/local`의 로컬 구조 변경 없이 단일 파일 수정으로 가장 빠르고 안정적인 방법을 목표합니다.

## 3. 구현 단계
1. `src/app/globals.css` 파일 접근
2. `@import "tailwindcss";` 등의 최상단 import 아래에 CDN 로드 코드 추가.
   ```css
   @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");
   ```
3. `body` CSS Rule 에서 `font-family` 최우선 값을 `'Pretendard Variable', Pretendard`로 적용.
   ```css
   body {
     ...
     font-family: 'Pretendard Variable', Pretendard, var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     ...
   }
   ```
4. 저장 후 핫릴로드 된 UI 검증.
