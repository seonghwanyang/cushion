'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth.store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const syncWithSupabase = useAuthStore((state) => state.syncWithSupabase)
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    // Initial sync
    syncWithSupabase()

    // Listen to auth state changes
    if (!isSupabaseConfigured()) {
      return
    }
    
    const { data: authListener } = supabase!.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
            profileImage: session.user.user_metadata?.avatar_url || null,
            role: 'USER' as const,
            status: 'ACTIVE' as const,
          }
          setUser(user)
          setSession(session)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSession(null)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [syncWithSupabase, setSession, setUser])

  return <>{children}</>
}