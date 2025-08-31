import { createClient } from '@supabase/supabase-js';

// Environment variables should be set in your environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types based on our schema
export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          plan: 'basic' | 'pro' | 'enterprise';
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: 'basic' | 'pro' | 'enterprise';
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: 'basic' | 'pro' | 'enterprise';
          settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          role: 'contractor' | 'staff' | 'sub' | 'homeowner' | 'admin';
          profile: any;
          auth_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          role: 'contractor' | 'staff' | 'sub' | 'homeowner' | 'admin';
          profile: any;
          auth_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          role?: 'contractor' | 'staff' | 'sub' | 'homeowner' | 'admin';
          profile?: any;
          auth_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address: string;
          status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
          client_user_id: string;
          budget: number | null;
          start_date: string | null;
          end_date: string | null;
          progress_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          address: string;
          status?: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
          client_user_id: string;
          budget?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          progress_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          address?: string;
          status?: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
          client_user_id?: string;
          budget?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          progress_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          starts_at: string;
          ends_at: string | null;
          type: 'consultation' | 'progress_review' | 'change_order' | 'walkthrough' | 'inspection';
          participants: string[];
          external_provider: 'zoom' | 'meet' | 'jitsi' | null;
          recording_url: string | null;
          consent_given: boolean;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          starts_at: string;
          ends_at?: string | null;
          type: 'consultation' | 'progress_review' | 'change_order' | 'walkthrough' | 'inspection';
          participants: string[];
          external_provider?: 'zoom' | 'meet' | 'jitsi' | null;
          recording_url?: string | null;
          consent_given?: boolean;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          starts_at?: string;
          ends_at?: string | null;
          type?: 'consultation' | 'progress_review' | 'change_order' | 'walkthrough' | 'inspection';
          participants?: string[];
          external_provider?: 'zoom' | 'meet' | 'jitsi' | null;
          recording_url?: string | null;
          consent_given?: boolean;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add more tables as needed...
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Typed Supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);