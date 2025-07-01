import axios, { AxiosError } from 'axios';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

console.log('[API Client] Base URL:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add Supabase auth token
apiClient.interceptors.request.use(
  async (config) => {
    console.log('[API Client] Request:', config.method?.toUpperCase(), config.url);
    console.log('[API Client] Request data:', config.data);
    
    // Get current Supabase session
    if (isSupabaseConfigured()) {
      const { data: { session }, error } = await supabase!.auth.getSession();
    
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('[API Client] Added Supabase auth token');
      } else if (error) {
        console.error('[API Client] Error getting session:', error);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Client] Response:', response.config.method?.toUpperCase(), response.config.url);
    console.log('[API Client] Response status:', response.status);
    console.log('[API Client] Response data:', response.data);
    if (response.data?.meta) {
      console.log('[API Client] Response meta:', response.data.meta);
    }
    return response;
  },
  async (error: AxiosError) => {
    console.error('[API Client] Response error:', error.response?.status, error.config?.url);
    console.error('[API Client] Error details:', error.response?.data);
    
    const originalRequest = error.config as any;
    
    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API Client] 401 error, attempting to refresh session...');
      originalRequest._retry = true;
      
      try {
        // Try to refresh the Supabase session
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not configured');
        }
        
        const { data, error: refreshError } = await supabase!.auth.refreshSession();
        
        if (refreshError || !data.session) {
          throw new Error('Session refresh failed');
        }
        
        console.log('[API Client] Session refreshed successfully');
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('[API Client] Session refresh failed:', refreshError);
        
        // Sign out and redirect to login
        if (isSupabaseConfigured()) {
          await supabase!.auth.signOut();
        }
        window.location.href = '/auth/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;