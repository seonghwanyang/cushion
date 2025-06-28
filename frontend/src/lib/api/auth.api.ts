import apiClient from './client';
import { User } from '@/lib/stores/auth.store';

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
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('[authApi.login] Request data:', data);
    const response = await apiClient.post('/auth/login', data);
    console.log('[authApi.login] Response:', response.data);
    
    // API는 { success: true, data: {...} } 형식으로 응답
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return response.data;
  },
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('[authApi.register] Request data:', data);
    console.log('[authApi.register] API URL:', apiClient.defaults.baseURL + '/auth/register');
    
    try {
      const response = await apiClient.post('/auth/register', data);
      console.log('[authApi.register] Response status:', response.status);
      console.log('[authApi.register] Response data:', response.data);
      
      // API는 { success: true, data: {...} } 형식으로 응답
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // 혹시 다른 형식으로 온 경우를 위한 fallback
      return response.data;
    } catch (error: any) {
      console.error('[authApi.register] Error:', error);
      console.error('[authApi.register] Error response:', error.response?.data);
      console.error('[authApi.register] Error status:', error.response?.status);
      throw error;
    }
  },
  
  async logout(): Promise<void> {
    console.log('[authApi.logout] Logging out...');
    await apiClient.post('/auth/logout');
  },
  
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('[authApi.refreshToken] Refreshing token...');
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};