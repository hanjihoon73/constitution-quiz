# 커스텀 로컬 웹폰트 개발 계획 (Plan)

## 1. 개요
* 변경 기능: 로컬 TTF 파일을 Next.js의 `next/font/local`로 로드하여 프로젝트 기본 폰트로 적용.
* 관련 문서: `docs/custom_font_prd.md`

## 2. 작업 내역 및 대상 파일
* `src/app/fonts`: TTF 파일명 식별
* `src/app/layout.tsx`: `localFont` 임포트 및 설정 구문 추가. (기존 Geist 폰트 걷어내기)
* `src/app/globals.css`: 글로벌 폰트 속성에 타겟 로컬 폰트 변수를 매핑하고, CDN 로딩 코드 삭제.

## 3. 단계별 상세 계획
1. `list_dir`로 사용자가 추가한 폰트 파일의 정확한 이름 확인.
2. `src/app/layout.tsx`에서 
   ```typescript
   import localFont from 'next/font/local';
   const customFont = localFont({ src: './fonts/파일이름.ttf', variable: '--font-custom', display: 'swap' });
   ```
   형태로 추가하되 기존 `Geist` 설정 부분은 지우거나 유지하면서 `body className`에 조합.
3. `src/app/globals.css`에서 맨 위의 `@import url('...pretendard...')` 삭제.
4. `globals.css`의 `@theme inline` 속성 안의 `--font-sans`를 방금 지정한 `var(--font-custom)`으로 변경.
