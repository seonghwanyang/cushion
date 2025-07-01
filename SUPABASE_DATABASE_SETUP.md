# Supabase 데이터베이스 설정 가이드

## 1. Supabase 대시보드에서 연결 정보 확인

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (hfhqctnrcesbulljsbwt)
3. 왼쪽 메뉴에서 **Settings** 클릭
4. **Database** 탭 선택

## 2. Connection String 복사

### Connection string 섹션에서:
1. **Connection string** 드롭다운에서 **URI** 선택
2. 비밀번호가 포함된 전체 URL 복사

예시 형식:
```
postgresql://postgres:[YOUR-PASSWORD]@db.hfhqctnrcesbulljsbwt.supabase.co:5432/postgres
```

## 3. .env.local 파일 업데이트

backend/.env.local 파일에서:
```env
DATABASE_URL=postgresql://postgres:[복사한-비밀번호]@db.hfhqctnrcesbulljsbwt.supabase.co:5432/postgres
```

## 4. 비밀번호 확인 방법

만약 비밀번호를 모른다면:
1. Supabase Dashboard → Settings → Database
2. **Database Password** 섹션
3. **Reset Database Password** 클릭
4. 새 비밀번호 설정

## 5. 임시 해결책 (로컬 개발)

Supabase 연결이 어려운 경우:
```env
USE_MOCK_DATABASE=true
```
로 변경하여 Mock 데이터베이스 사용

## 6. 연결 테스트

```bash
cd backend
npm run prisma:db:push
```

성공하면:
```
🚀 Your database is now in sync with your schema.
```

## 주의사항

- 비밀번호에 특수문자가 있으면 URL 인코딩 필요
- 예: `@` → `%40`, `#` → `%23`
- Supabase 무료 플랜은 1주일 비활성 시 일시정지됨