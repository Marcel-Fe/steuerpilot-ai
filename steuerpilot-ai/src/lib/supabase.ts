// Supabase-Client — nur aktiv, wenn URL + Anon-Key als Env gesetzt sind.
// Der Anon-Key ist öffentlich (Row Level Security schützt die Daten serverseitig).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey && url.startsWith('http') ? createClient(url, anonKey) : null;

export function cloudConfigured(): boolean {
  return supabase !== null;
}

// Tabelle, in der der komplette App-Zustand je Nutzer als JSON liegt.
export const STATE_TABLE = 'app_state';
