# TASK_015: 401 인증 오류 해결

## 현재 문제
- 백엔드는 실행되었지만 401 Unauthorized 오류 발생
- 일기 작성 시 인증 실패

## 문제 원인 분석

### 1. Supabase Admin 클라이언트 문제
- 환경 변수가 제대로 로드되지 않았을 가능성
- SERVICE_ROLE_KEY 검증 필요

### 2. 사용자 DB 동기화 문제
- Supabase Auth 사용자가 로컬 DB에 없음
- validateUser 실패

## 해결 방안

### 방안 1: 디버깅 로그 추가 (권장)

**파일**: `backend/src/lib/supabase-admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Supabase Admin] URL configured:', !!supabaseUrl);
console.log('[Supabase Admin] Service Key configured:', !!supabaseServiceKey);

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseAdmin) {
  console.error('[Supabase Admin] NOT CONFIGURED - Auth will fail!');
}
```

**파일**: `backend/src/api/middleware/auth.middleware.supabase.ts`
```typescript
export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[Auth] Headers:', req.headers.authorization?.substring(0, 20) + '...');
    
    if (!supabaseAdmin) {
      console.error('[Auth] Supabase Admin is null!');
      throw new UnauthorizedError('Supabase is not configured');
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Auth] No bearer token found');
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    console.log('[Auth] Verifying token...');
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('[Auth] Supabase error:', error.message);
      throw new UnauthorizedError('Invalid token');
    }
    
    if (!user) {
      console.error('[Auth] No user found from token');
      throw new UnauthorizedError('Invalid token');
    }
    
    console.log('[Auth] User verified:', user.id);
    
    // 임시로 DB 검증 스킵
    req.user = {
      id: user.id,
      email: user.email!,
      role: 'USER',
    };
    
    console.log('[Auth] Auth successful for:', user.email);
    next();
  } catch (error) {
    console.error('[Auth] Error:', error);
    next(error);
  }
};
```

### 방안 2: 환경 변수 확인

**파일**: `backend/src/server.ts` 또는 app 초기화 부분에 추가
```typescript
// 환경 변수 디버깅
console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('USE_SUPABASE_AUTH:', process.env.USE_SUPABASE_AUTH);
console.log('================================');
```

### 방안 3: 임시 해결책 (빠른 테스트)

만약 위 방법으로도 해결이 안 되면, 임시로 Mock Auth로 전환:

**파일**: `backend/.env.local`
```env
USE_SUPABASE_AUTH=false
USE_MOCK_AUTH=true
```

그리고 Mock 로그인을 사용하여 테스트

## 작업 순서

1. **디버깅 로그 추가**
   - [ ] supabase-admin.ts에 로그 추가
   - [ ] auth.middleware.supabase.ts에 로그 추가
   - [ ] 서버 재시작 후 로그 확인

2. **로그 분석**
   - [ ] Supabase Admin 클라이언트가 생성되었는지
   - [ ] 토큰이 제대로 전달되는지
   - [ ] Supabase에서 사용자 정보를 가져오는지

3. **문제 해결**
   - [ ] 환경 변수 문제면 .env.local 확인
   - [ ] 토큰 문제면 Frontend 확인
   - [ ] DB 동기화 문제면 사용자 생성 로직 추가

## 예상되는 로그 출력

정상적인 경우:
```
[Supabase Admin] URL configured: true
[Supabase Admin] Service Key configured: true
[Auth] Headers: Bearer eyJhbGciOiJ...
[Auth] Verifying token...
[Auth] User verified: 123e4567-e89b-12d3-a456-426614174000
[Auth] Auth successful for: user@example.com
```

## 추가 확인사항

1. **Frontend 콘솔**
   - `[API Client] Added Supabase auth token` 로그가 있는지
   - 토큰이 실제로 전송되는지

2. **Network 탭**
   - Authorization 헤더 확인
   - Bearer 토큰이 있는지

3. **Supabase Dashboard**
   - Authentication > Users에서 로그인한 사용자 확인
   - Logs에서 인증 관련 로그 확인

---

**작성일**: 2025-01-29
**우선순위**: 높음
**예상 소요시간**: 15분