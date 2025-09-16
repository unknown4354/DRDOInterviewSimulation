import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Auth helpers
export const auth = supabase.auth

// Database helpers
export const db = supabase

// Storage helpers
export const storage = supabase.storage

// Real-time helpers
export const realtime = supabase.realtime

// Types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          password_hash?: string
          full_name: string
          role: 'administrator' | 'selector' | 'candidate' | 'observer'
          department?: string
          designation?: string
          expertise?: string[]
          security_clearance: 'public' | 'restricted' | 'confidential' | 'secret'
          phone?: string
          avatar_url?: string
          bio?: string
          experience_years?: number
          education?: any
          certifications?: any
          skills?: any
          languages?: any
          preferences?: any
          mfa_enabled?: boolean
          mfa_secret?: string
          last_login?: string
          login_count?: number
          is_active: boolean
          email_verified?: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      interviews: {
        Row: {
          id: string
          title: string
          description?: string
          job_position_id: string
          interviewer_id: string
          candidate_id?: string
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          interview_type: 'technical' | 'behavioral' | 'panel' | 'group' | 'stress' | 'case_study'
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          room_id?: string
          recording_url?: string
          notes?: string
          overall_score?: number
          feedback?: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['interviews']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['interviews']['Insert']>
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']