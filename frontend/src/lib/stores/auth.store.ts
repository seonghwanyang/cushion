import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setSession: (session) => set({ session, isAuthenticated: !!session }),
      
      login: (user, accessToken, refreshToken) => {
        // For backward compatibility with the auth callback
        set({
          user,
          session: { access_token: accessToken, refresh_token: refreshToken } as any,
          isAuthenticated: true,
        });
      },
      
      logout: async () => {
        if (isSupabaseConfigured()) {
          await supabase!.auth.signOut();
        }
        set({
          user: null,
          session: null,
          isAuthenticated: false,
        });
      },
      
      syncWithSupabase: async () => {
        set({ isLoading: true });
        
        try {
          if (!isSupabaseConfigured()) {
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
            return;
          }
          
          const { data: { session }, error } = await supabase!.auth.getSession();
          
          if (error) {
            console.error('Error syncing with Supabase:', error);
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
            return;
          }
          
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
              profileImage: session.user.user_metadata?.avatar_url || null,
              role: 'USER',
              status: 'ACTIVE',
            };
            
            set({ user, session, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error('Error syncing auth state:', error);
          set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user info, not the session
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);