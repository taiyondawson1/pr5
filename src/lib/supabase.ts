
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://qzbwxtegqsusmfwjauwh.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ynd4dGVncXN1c21md2phdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTgwMzMsImV4cCI6MjA1MzIzNDAzM30.N3vIgRtWmaEVkaNEWDo_ywfzOu-gSupjCQywKQA8kz8';

// Create supabase client with consistent options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: false,
  }
});
