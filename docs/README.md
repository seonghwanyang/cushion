# Cushion 문서 구조

## 📁 폴더 구조

### 📚 기술 문서 (루트)
프로젝트의 아키텍처, 가이드, 사양 등 영구적인 기술 문서들입니다.

- `cushion-ai-langgraph.md` - AI/LangGraph 통합 가이드
- `cushion-api-spec.md` - API 명세서
- `cushion-architecture.md` - 시스템 아키텍처
- `cushion-checklist.md` - 개발 체크리스트
- `cushion-cicd.md` - CI/CD 파이프라인
- `cushion-cloud-native.md` - 클라우드 네이티브 가이드
- `cushion-code-quality.md` - 코드 품질 가이드
- `cushion-dev-guide.md` - 개발자 가이드
- `cushion-langgraph-routing.md` - LangGraph 라우팅 패턴
- `cushion-langsmith-guide.md` - LangSmith 모니터링
- `cushion-project-context.md` - 프로젝트 컨텍스트
- `cushion-readme.md` - 프로젝트 README
- `cushion-security-guide.md` - 보안 가이드

### 📋 작업 명세서 (/tasks)
Claude Code나 개발자가 수행해야 할 구체적인 작업 지시서들입니다.

- `001-initial-setup.md` - 프로젝트 초기 설정
- (추후 추가될 작업들...)

## 🔍 사용 방법

### 기술 문서
- 프로젝트의 전반적인 이해가 필요할 때 참조
- 아키텍처 결정이나 기술 선택 시 가이드라인으로 활용
- 영구적으로 유지되며 지속적으로 업데이트

### 작업 명세서
- 특정 작업을 수행해야 할 때 참조
- 단계별 지시사항과 완료 조건이 명시됨
- 작업 완료 후에도 히스토리로 보관
- 파일명은 `XXX-작업명.md` 형식 (예: 001-initial-setup.md)

## 📝 명명 규칙

- **기술 문서**: `cushion-[주제].md`
- **작업 명세서**: `[번호]-[작업명].md`
