/**
 * Supabase Database Types
 * 
 * To generate types from your Supabase project, run:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 * 
 * Or use the Supabase Dashboard:
 * 1. Go to your project settings
 * 2. Navigate to API section
 * 3. Click "Generate types" and copy the TypeScript types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          avatar_url: string | null
          plan: string | null
          video_credits: number | null
          genie_edits: number | null
          custom_avatars_used: number | null
          custom_avatars_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          avatar_url?: string | null
          plan?: string | null
          video_credits?: number | null
          genie_edits?: number | null
          custom_avatars_used?: number | null
          custom_avatars_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image?: string | null
          avatar_url?: string | null
          plan?: string | null
          video_credits?: number | null
          genie_edits?: number | null
          custom_avatars_used?: number | null
          custom_avatars_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          credits: number | null
          plan: string | null
          avatar_url: string | null
          created_at: string
          last_active_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          credits?: number | null
          plan?: string | null
          avatar_url?: string | null
          created_at?: string
          last_active_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          credits?: number | null
          plan?: string | null
          avatar_url?: string | null
          created_at?: string
          last_active_at?: string | null
        }
      }
      avatars: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          provider_avatar_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          provider_avatar_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          provider_avatar_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      generated_videos: {
        Row: {
          id: string
          user_id: string
          script_id: string | null
          generated_video_id: string
          video_provider: string
          video_status: string
          video_progress: number | null
          generated_video_url: string | null
          thumbnail_url: string | null
          duration: number | null
          video_error: string | null
          project_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          script_id?: string | null
          generated_video_id: string
          video_provider: string
          video_status?: string
          video_progress?: number | null
          generated_video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          video_error?: string | null
          project_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          script_id?: string | null
          generated_video_id?: string
          video_provider?: string
          video_status?: string
          video_progress?: number | null
          generated_video_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          video_error?: string | null
          project_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          filename: string
          url: string
          duration: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          url: string
          duration?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          url?: string
          duration?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      scripts: {
        Row: {
          id: string
          user_id: string
          video_id: string | null
          topic: string
          platform: string
          tone: string
          length: number
          content: string
          status: string
          video_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id?: string | null
          topic: string
          platform: string
          tone: string
          length: number
          content: string
          status?: string
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string | null
          topic?: string
          platform?: string
          tone?: string
          length?: number
          content?: string
          status?: string
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type User = Tables<'users'>
export type Profile = Tables<'profiles'>
export type Video = Tables<'videos'>
export type Script = Tables<'scripts'>
export type Subscription = Tables<'subscriptions'>
