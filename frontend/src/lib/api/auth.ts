import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: SupabaseUser | null;
  session: Session | null;
  error: Error | null;
}

export const authApi = {
  // 이메일 회원가입
  async register({ email, password, name }: RegisterRequest): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return { user: null, session: null, error: new Error('Supabase is not configured') };
    }
    
    console.log('[authApi.register] Signing up with Supabase:', { email, name });
    
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: { 
          name: name || email.split('@')[0], // 이름이 없으면 이메일 앞부분 사용
        }
      }
    });
    
    if (error) {
      console.error('[authApi.register] Supabase error:', error);
      return { user: null, session: null, error };
    }
    
    console.log('[authApi.register] Success:', data);
    return { user: data.user, session: data.session, error: null };
  },

  // 이메일 로그인
  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return { user: null, session: null, error: new Error('Supabase is not configured') };
    }
    
    console.log('[authApi.login] Signing in with Supabase:', { email });
    
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('[authApi.login] Supabase error:', error);
      return { user: null, session: null, error };
    }
    
    console.log('[authApi.login] Success:', data);
    return { user: data.user, session: data.session, error: null };
  },

  // Google 로그인
  async loginWithGoogle(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') };
    }
    
    console.log('[authApi.loginWithGoogle] Starting Google OAuth...');
    
    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      console.error('[authApi.loginWithGoogle] Supabase error:', error);
      return { error };
    }
    
    console.log('[authApi.loginWithGoogle] Redirect URL:', data.url);
    return { error: null };
  },

  // 로그아웃
  async logout(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') };
    }
    
    console.log('[authApi.logout] Signing out...');
    
    const { error } = await supabase!.auth.signOut();
    
    if (error) {
      console.error('[authApi.logout] Supabase error:', error);
      return { error };
    }
    
    console.log('[authApi.logout] Success');
    return { error: null };
  },

  // 현재 사용자 가져오기
  async getCurrentUser(): Promise<SupabaseUser | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data: { user }, error } = await supabase!.auth.getUser();
    
    if (error) {
      console.error('[authApi.getCurrentUser] Error:', error);
      return null;
    }
    
    return user;
  },

  // 세션 가져오기
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const { data: { session }, error } = await supabase!.auth.getSession();
    
    if (error) {
      console.error('[authApi.getSession] Error:', error);
      return null;
    }
    
    return session;
  },

  // 세션 새로고침
  async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { session: null, error: new Error('Supabase is not configured') };
    }
    
    console.log('[authApi.refreshSession] Refreshing session...');
    
    const { data, error } = await supabase!.auth.refreshSession();
    
    if (error) {
      console.error('[authApi.refreshSession] Error:', error);
      return { session: null, error };
    }
    
    return { session: data.session, error: null };
  },

  // 비밀번호 재설정 이메일 보내기
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') };
    }
    
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      console.error('[authApi.resetPassword] Error:', error);
      return { error };
    }
    
    return { error: null };
  },

  // 비밀번호 업데이트
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') };
    }
    
    const { error } = await supabase!.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('[authApi.updatePassword] Error:', error);
      return { error };
    }
    
    return { error: null };
  }
};