# Supabase 연결 가이드

## 연결 모드

### 1. Transaction Mode (포트 6543)
- 빠른 연결
- prepared statement 지원 안함
- PgBouncer 사용 시 설정 필요:
```
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&statement_cache_size=0
```

### 2. Session Mode (포트 5432)
- 전체 기능 지원
- prepared statement 지원
- 개발에 권장:
```
DATABASE_URL=postgresql://...@pooler.supabase.com:5432/postgres?pgbouncer=true
```

### 3. Direct Connection
- 마이그레이션에만 사용
- 프로덕션에서는 사용하지 말 것:
```
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
```

## 현재 설정 변경 방법

1. `.env` 파일 수정
2. Transaction mode (6543) → Session mode (5432) 변경
3. 백엔드 재시작

## 에러 해결

### "prepared statement does not exist" 에러
- Transaction mode에서 발생
- Session mode로 변경하거나
- `statement_cache_size=0` 추가