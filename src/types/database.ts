export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ibadah_types: {
        Row: {
          id: string
          name: string
          description: string | null
          tracking_type: 'checklist' | 'count'
          frequency: 'daily' | 'weekly' | 'monthly'
          is_default: boolean
          is_ramadhan_only: boolean
          unit: string | null
          schedule_type: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto'
          start_date: string | null
          end_date: string | null
          specific_dates: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          tracking_type: 'checklist' | 'count'
          frequency?: 'daily' | 'weekly' | 'monthly'
          is_default?: boolean
          is_ramadhan_only?: boolean
          unit?: string | null
          schedule_type?: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto'
          start_date?: string | null
          end_date?: string | null
          specific_dates?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          tracking_type?: 'checklist' | 'count'
          frequency?: 'daily' | 'weekly' | 'monthly'
          is_default?: boolean
          is_ramadhan_only?: boolean
          unit?: string | null
          schedule_type?: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto'
          start_date?: string | null
          end_date?: string | null
          specific_dates?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_ibadah: {
        Row: {
          id: string
          user_id: string
          ibadah_type_id: string
          is_active: boolean
          target_count: number | null
          unit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ibadah_type_id: string
          is_active?: boolean
          target_count?: number | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ibadah_type_id?: string
          is_active?: boolean
          target_count?: number | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ibadah_records: {
        Row: {
          id: string
          user_id: string
          ibadah_type_id: string
          date: string
          is_completed: boolean
          count_value: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ibadah_type_id: string
          date: string
          is_completed?: boolean
          count_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ibadah_type_id?: string
          date?: string
          is_completed?: boolean
          count_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ramadhan_content: {
        Row: {
          id: string
          date: string
          ayat: string | null
          hadis: string | null
          tips: string | null
          doa: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          ayat?: string | null
          hadis?: string | null
          tips?: string | null
          doa?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          ayat?: string | null
          hadis?: string | null
          tips?: string | null
          doa?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      muhasabah_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          good_things: string
          improvements: string
          prayers_hopes: string
          mood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          good_things: string
          improvements: string
          prayers_hopes: string
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          good_things?: string
          improvements?: string
          prayers_hopes?: string
          mood?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      support_messages: {
        Row: {
          id: string
          user_id: string
          subject: string
          message: string
          status: 'open' | 'in_progress' | 'closed'
          admin_reply: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          message: string
          status?: 'open' | 'in_progress' | 'closed'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          message?: string
          status?: 'open' | 'in_progress' | 'closed'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
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
