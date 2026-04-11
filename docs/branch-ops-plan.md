# beta/v1.0-personal 브랜치 설정 작업 구현 계획

> 작성일: 2026-04-11  
> 작업 브랜치: `beta/v1.0-personal`  
> 작업 상태: ✅ 완료

---

## 작업 개요

`main` 브랜치를 기준으로 Git 브랜치 2개를 생성하고,
`beta/v1.0-personal` 브랜치에 COGNITY 제거, 운영자 정보(저작권·링크·계좌·이메일) 변경을 적용합니다.

---

## 브랜치 운영 전략

```
main (beta v1.0 기준)
├── beta/v1.0-personal  ← 개인 운영 버전, Vercel 자동 배포 대상
└── release/v1.0        ← 향후 정식 론칭용 (현재 생성만)

로컬 작업
    ↓
beta/v1.0-personal 또는 release/v1.0에 직접 push
    ↓
Vercel이 beta/v1.0-personal 브랜치 감지 → 자동 배포
    ↓
정식 론칭 시점에 release/v1.0을 main에 merge → 배포 전환
```

> ⚠️ **운영 주의사항**: `beta/v1.0-personal`에 적용되는 개인 정보(계좌, 이메일, 저작권)는 `release/v1.0`에는 적용되지 않습니다. 이후 버그 수정·기능 개선 시에는 양쪽 브랜치에 각각 동일하게 적용(cherry-pick)해야 합니다.

---

## 변경 범위

| 파일 | 변경 항목 |
|---|---|
| `src/app/login/page.tsx` | 이용약관 링크 URL, COGNITY CI 로고 제거, 저작권 수정 |
| `src/app/profile/page.tsx` | 문의 이메일, 이용약관 링크 URL, COGNITY CI 로고 제거, 저작권 수정 |
| `src/components/quiz/SponsorDialog.tsx` | 후원 계좌 정보 (은행명, 계좌번호, 예금주) |
| `src/app/admin/layout.tsx` | **변경 없음** (내부 전용, COGNITY CI 유지) |

> **앱 버전 표시** (`beta v1.0`)는 이미 정확히 표기되어 있어 변경 불필요합니다.

---

## 1단계: Git 브랜치 생성

```bash
# 1. main 최신화
git checkout main
git pull origin main

# 2. beta/v1.0-personal 브랜치 생성 및 push
git checkout -b beta/v1.0-personal
git push origin beta/v1.0-personal

# 3. release/v1.0 브랜치 생성 및 push (main 기준)
git checkout main
git checkout -b release/v1.0
git push origin release/v1.0

# 4. 작업 브랜치로 이동
git checkout beta/v1.0-personal
```

---

## 2단계: 코드 변경사항

### 파일 1 — `src/app/login/page.tsx`

**변경 1 — 이용약관 링크 URL 교체**
```diff
- href="https://maperson.notion.site/2d2e387af28e804c94cecdf08c322ef6?source=copy_link"
+ href="https://maperson.notion.site/beta-33fe387af28e80e884e2cf82092f51bd"
```

**변경 2 — COGNITY CI 로고 블록 제거 + 저작권 수정**
```diff
- <a href="https://cognity.framer.website/" ...>
-     <Image src="/ci_cognity.svg" alt="COGNITY" ... />
- </a>
- <p ...>ⓒ 2025 COGNITY. All rights reserved.</p>
+ <p ...>ⓒ 2026 Jihoon Han. All rights reserved.</p>
```

---

### 파일 2 — `src/app/profile/page.tsx`

**변경 1 — 이용 문의 이메일 수정**
```diff
- 이용 문의: cognityhelp@gmail.com
+ 이용 문의: hanjihoon73@gmail.com
```

**변경 2 — 이용약관 링크 URL 교체**
```diff
- href="https://maperson.notion.site/2d2e387af28e804c94cecdf08c322ef6?source=copy_link"
+ href="https://maperson.notion.site/beta-33fe387af28e80e884e2cf82092f51bd"
```

**변경 3 — COGNITY CI 로고 블록 제거 + 저작권 수정**
```diff
- <a href="https://cognity.framer.website/" ...>
-     <img src="/ci_cognity.svg" alt="COGNITY" ... />
- </a>
- <p ...>ⓒ 2025 COGNITY. All rights reserved.</p>
+ <p ...>ⓒ 2026 Jihoon Han. All rights reserved.</p>
```

---

### 파일 3 — `src/components/quiz/SponsorDialog.tsx`

**변경 1 — 클립보드 복사 텍스트 수정**
```diff
- await navigator.clipboard.writeText('KB 839837-01-011166 코그니티');
+ await navigator.clipboard.writeText('우리은행 1002-856-209329 한지훈');
```

**변경 2 — 후원계좌 표시 텍스트 수정**
```diff
- KB 839837-01-011166 코그니티
+ 우리은행 1002-856-209329 한지훈
```

---

## 3단계: 최종 확인 목록

| 항목 | 확인 방법 | 완료 |
|---|---|---|
| COGNITY/코그니티 문자열 잔존 여부 | `src/` 전체 grep 재탐색 | ✅ |
| 후원계좌 (우리은행 / 한지훈) | SponsorDialog 팝업 직접 확인 | - |
| 이용약관 링크 작동 | 로그인 + 마이페이지에서 링크 클릭 | - |
| 저작권 표시 | 로그인 + 마이페이지 하단 텍스트 | - |
| 문의 이메일 | 마이페이지 '서비스 문의' 영역 | - |
| 앱 버전 표시 (`beta v1.0`) | 로그인/마이페이지 우상단 (변경 없음) | ✅ |
| 브랜치 2개 생성 여부 | `git branch -a`로 확인 | ✅ |
