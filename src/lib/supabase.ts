import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CountdownDay } from '../types/countdown';
import { MOCK_DAYS } from '../config/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Gracefully initialize Supabase only if valid environment variables exist
if (
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().startsWith('http') &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 0
) {
  try {
    supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabase = null;
  }
}

export { supabase };

/**
 * Fetches countdown days ordered by day_number ASC.
 * Gracefully falls back to MOCK_DAYS if Supabase is unconfigured or fetch fails.
 */
export async function fetchCountdownDays(): Promise<CountdownDay[]> {
  if (!supabase) {
    return MOCK_DAYS;
  }

  try {
    const { data, error } = await supabase
      .from('countdown_days')
      .select('*')
      .order('day_number', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('Supabase fetch error, falling back to mock data:', error.message);
      }
      return MOCK_DAYS;
    }

    return data as CountdownDay[];
  } catch (err) {
    console.warn('Error fetching countdown days, falling back to mock data:', err);
    return MOCK_DAYS;
  }
}
