# Walkthrough: Git Commit 히스토리 문서화

제이슨, 요청하신 프로젝트의 전체 Git commit 히스토리를 마크다운 문서로 생성하였습니다.

## 작업 내용
- **문서 생성**: 전체 커밋 히스토리를 비개발자도 읽기 쉬운 마크다운 형식으로 추출하였습니다.
- **위치**: [git-history-v1.0.md](file:///d:/SynologyDrive/dev_projects/constitution-quiz/docs/git-history-v1.0.md)
- **포맷**: 
  - 커밋 메시지 (제목)
  - 작성자, 날짜, 해시 정보
  - 상세 설명 (본문 내용 포함)

## 직접 업데이트하는 방법
나중에 히스토리가 더 쌓였을 때, 터미널(PowerShell)에서 아래 명령어를 실행하면 최신 히스토리 문서로 직접 업데이트할 수 있습니다.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $history = git log --pretty=format:"### %s%n- 작성자: %an%n- 날짜: %ad%n- 해시: %h%n%b" --date=short; $date = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; $header = "# Git Commit History`n`n- 생성일: $date`n- 프로젝트: constitution-quiz`n`n---`n"; $content = $header + $history; [System.IO.File]::WriteAllText("docs/git-history-v1.0.md", $content, [System.Text.Encoding]::UTF8)
```

위 명령어가 너무 길다면, 아래와 같이 간단한 버전으로도 가능합니다 (일부 환경에서 한글 깨짐이 있을 수 있습니다).
```bash
git log --pretty=format:"### %s%n- 작성자: %an%n- 날짜: %ad%n- 해시: %h%n%b" --date=short > docs/git-history-latest.md
```

이상입니다. 확인 부탁드려요!
