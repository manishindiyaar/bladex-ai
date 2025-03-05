import { createClient } from '@supabase/supabase-js';

// Use the same credentials from the original project
const SUPABASE_URL = "https://ddoytxtbjzoihucejywh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb3l0eHRianpvaWh1Y2VqeXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzA5NzYsImV4cCI6MjA1MDUwNjk3Nn0.WljUWKZRrbgYPVegm1ZYit8OhmgHamzWEVu7rawukt8";

export type Database = {
  public: {
    tables: {
      contacts: {
        Row: {
          id: string;
          name: string;
          contact_info: string;
          last_contact: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_info: string;
          last_contact?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_info?: string;
          last_contact?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          contact_id: string;
          content: string;
          timestamp: string;
          direction: 'incoming' | 'outgoing';
          is_ai_response: boolean;
          is_from_customer: boolean;
          is_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          content: string;
          timestamp?: string;
          direction: 'incoming' | 'outgoing';
          is_ai_response?: boolean;
          is_from_customer: boolean;
          is_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          content?: string;
          timestamp?: string;
          direction?: 'incoming' | 'outgoing';
          is_ai_response?: boolean;
          is_from_customer?: boolean;
          is_sent?: boolean;
          created_at?: string;
        };
      };
    };
    functions: {
      get_customers_by_message_keyword: {
        Args: { keyword: string };
        Returns: { id: string; name: string; contact_info: string }[];
      };
      get_customers_by_message_keyword_and_date_range: {
        Args: { keyword: string; start_date: string; end_date: string };
        Returns: { id: string; name: string; contact_info: string }[];
      };
    };
  };
};

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);