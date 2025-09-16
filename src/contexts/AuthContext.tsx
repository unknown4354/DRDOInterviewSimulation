import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Tables } from '../lib/supabase'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  userProfile: Tables<'users'> | null
  session: Session | null
  loading: boolean
  error: string | null
  retryAuth: () => void
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData: Partial<Tables<'users'>>) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Tables<'users'>>) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>
  checkEmailVerification: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Tables<'users'> | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...')
      setError(null)
      setLoading(true)

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
      })

      const authPromise = supabase.auth.getSession()

      const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any
      
      console.log('Auth session retrieved:', !!session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
      
      setLoading(false)
    } catch (error: any) {
      console.error('Auth initialization failed:', error)
      setError(error.message || 'Failed to initialize authentication')
      setLoading(false)
      toast.error('Authentication service unavailable. You can continue in offline mode.')
    }
  }

  const retryAuth = () => {
    setRetryCount(prev => prev + 1)
    initializeAuth()
  }

  useEffect(() => {
    initializeAuth()

    // Listen for auth changes with error handling
    let subscription: any
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, !!session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      })
      subscription = authSubscription
    } catch (error) {
      console.error('Failed to set up auth listener:', error)
      setError('Failed to set up authentication listener')
      setLoading(false)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [retryCount])

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    const maxRetries = 3
    const timeoutDuration = 10000 // Increased to 10 seconds
    
    try {
      console.log(`Fetching user profile for: ${userId} (attempt ${retryCount + 1})`)
      
      // Add timeout for profile fetch with increased duration
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutDuration)
      })

      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // Retry logic for network errors
        if (retryCount < maxRetries && (error.message?.includes('timeout') || error.message?.includes('network'))) {
          console.log(`Retrying profile fetch in ${(retryCount + 1) * 1000}ms...`)
          setTimeout(() => fetchUserProfile(userId, retryCount + 1), (retryCount + 1) * 1000)
          return
        }
        
        // Don't block auth flow if profile fetch fails after retries
        toast.error('Failed to load user profile, but you can still continue')
        return
      }

      console.log('User profile loaded successfully')
      setUserProfile(data)
    } catch (error: any) {
      console.error('Error fetching user profile:', error)
      
      // Retry logic for timeout errors
      if (retryCount < maxRetries && error.message?.includes('timeout')) {
        console.log(`Retrying profile fetch after timeout (attempt ${retryCount + 2})...`)
        setTimeout(() => fetchUserProfile(userId, retryCount + 1), (retryCount + 1) * 1000)
        return
      }
      
      toast.error('Profile unavailable - please refresh the page')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Sign in failed: ' + error.message)
      } else {
        toast.success('Successfully signed in!')
      }

      return { error }
    } catch (error) {
      const authError = error as AuthError
      toast.error('Sign in failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<Tables<'users'>>) => {
    try {
      setLoading(true)
      
      // First, create the auth user with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      })

      if (authError) {
        toast.error('Sign up failed: ' + authError.message)
        return { error: authError }
      }

      // If auth user created successfully, create user profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            username: userData.username || authData.user.email!.split('@')[0],
            full_name: userData.full_name || '',
            role: userData.role || 'candidate',
            security_clearance: userData.security_clearance || 'public',
            department: userData.department || null,
            phone: userData.phone || null,
            is_active: true,
            email_verified: false
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          toast.error('Failed to create user profile')
        } else {
          toast.success('Account created successfully! Please check your email to verify your account.')
        }
      }

      return { error: authError }
    } catch (error) {
      const authError = error as AuthError
      toast.error('Sign up failed: ' + authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error('Sign out failed: ' + error.message)
      } else {
        toast.success('Successfully signed out!')
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Tables<'users'>>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') }
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        toast.error('Failed to update profile: ' + error.message)
        return { error: new Error(error.message) }
      }

      // Refresh user profile
      await fetchUserProfile(user.id)
      toast.success('Profile updated successfully!')
      return { error: null }
    } catch (error) {
      const err = error as Error
      toast.error('Failed to update profile: ' + err.message)
      return { error: err }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error('Password reset failed: ' + error.message)
      } else {
        toast.success('Password reset email sent! Check your inbox.')
      }

      return { error }
    } catch (error) {
      const authError = error as AuthError
      toast.error('Password reset failed: ' + authError.message)
      return { error: authError }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      })

      if (error) {
        toast.error('Failed to resend verification email: ' + error.message)
      } else {
        toast.success('Verification email sent! Please check your inbox.')
      }

      return { error }
    } catch (error) {
      const authError = error as AuthError
      toast.error('Failed to resend verification email: ' + authError.message)
      return { error: authError }
    }
  }

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      if (!user) return false
      
      // Check if email is confirmed in Supabase auth
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser?.email_confirmed_at) {
        // Update user profile to mark email as verified
        await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('id', currentUser.id)
        
        // Refresh user profile
        await fetchUserProfile(currentUser.id)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error checking email verification:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    error,
    retryAuth,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    resendVerificationEmail,
    checkEmailVerification,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}