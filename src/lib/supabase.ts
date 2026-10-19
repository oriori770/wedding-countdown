import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CountdownDay } from '../types/countdown';
import { MOCK_DAYS, INITIAL_PENDING_SUBMISSIONS } from '../config/constants';

const LOCAL_STORAGE_DATA_KEY = 'wedding_countdown_all_items';

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

// ---------------- LOCAL FALLBACK STORE ----------------
function getLocalFallbackStore(): CountdownDay[] {
  if (typeof window === 'undefined') {
    return [...MOCK_DAYS, ...INITIAL_PENDING_SUBMISSIONS];
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read local items store:', err);
  }

  // Initial seed
  const initialData: CountdownDay[] = [
    ...MOCK_DAYS.map((d) => ({ ...d, is_approved: true })),
    ...INITIAL_PENDING_SUBMISSIONS,
  ];
  saveLocalFallbackStore(initialData);
  return initialData;
}

function saveLocalFallbackStore(items: CountdownDay[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save local items store:', err);
  }
}

// ---------------- API FUNCTIONS ----------------

/**
 * 1. fetchApprovedDays:
 * Fetches rows where is_approved = true AND day_number IS NOT NULL, ordered by day_number ASC.
 * Used by the Bride's main view.
 */
export async function fetchApprovedDays(): Promise<CountdownDay[]> {
  if (!supabase) {
    const local = getLocalFallbackStore();
    return local
      .filter((item) => item.is_approved && item.day_number !== null)
      .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
  }

  try {
    const { data, error } = await supabase
      .from('countdown_days')
      .select('*')
      .eq('is_approved', true)
      .not('day_number', 'is', null)
      .order('day_number', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase fetchApprovedDays error:', error.message);
      const local = getLocalFallbackStore();
      return local
        .filter((item) => item.is_approved && item.day_number !== null)
        .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    }

    return data as CountdownDay[];
  } catch (err) {
    console.warn('Error fetching approved days, using fallback:', err);
    const local = getLocalFallbackStore();
    return local
      .filter((item) => item.is_approved && item.day_number !== null)
      .sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
  }
}

/**
 * Backward compatibility alias
 */
export const fetchCountdownDays = fetchApprovedDays;

/**
 * 2. fetchAllSubmissions:
 * Fetches ALL rows ordered by day_number ASC NULLS FIRST, id DESC.
 * Used by the Admin view.
 */
export async function fetchAllSubmissions(): Promise<CountdownDay[]> {
  if (!supabase) {
    const local = getLocalFallbackStore();
    return local.sort((a, b) => {
      if (a.day_number === null && b.day_number !== null) return -1;
      if (a.day_number !== null && b.day_number === null) return 1;
      if (a.day_number !== null && b.day_number !== null) {
        return a.day_number - b.day_number;
      }
      return b.id - a.id;
    });
  }

  try {
    const { data, error } = await supabase
      .from('countdown_days')
      .select('*')
      .order('day_number', { ascending: true, nullsFirst: true })
      .order('id', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase fetchAllSubmissions error:', error.message);
      return getLocalFallbackStore();
    }

    return data as CountdownDay[];
  } catch (err) {
    console.warn('Error fetching all submissions, using fallback:', err);
    return getLocalFallbackStore();
  }
}

/**
 * 3. uploadMediaFile:
 * Uploads an image or video to Supabase Storage bucket 'media' with a unique filename.
 * Fallback: converts file to a Base64 data URL so it works offline/without credentials.
 */
export async function uploadMediaFile(file: File): Promise<string> {
  if (supabase) {
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFilename = `${Date.now()}_${cleanName}.${ext}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(uniqueFilename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('media')
          .getPublicUrl(data.path);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to Data URL:', err);
    }
  }

  // Fallback: Read file as Base64 Data URL for instant offline preview & persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 4. createSubmission:
 * Inserts a new row into countdown_days.
 */
export async function createSubmission(
  payload: Partial<CountdownDay>
): Promise<CountdownDay> {
  const newItem: CountdownDay = {
    id: payload.id || Date.now(),
    day_number: payload.day_number ?? null,
    unlock_date: payload.unlock_date ?? null,
    title: payload.title || 'הפתעה חדשה לכלה',
    type: payload.type || 'letter',
    content: payload.content || '',
    sender_name: payload.sender_name || 'אורח אוהב',
    media_url: payload.media_url,
    quiz_data: payload.quiz_data,
    coupon_code: payload.coupon_code,
    is_approved: payload.is_approved ?? false,
    created_at: payload.created_at || new Date().toISOString(),
    hebrew_date: payload.hebrew_date,
    civil_date: payload.civil_date,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('countdown_days')
        .insert(newItem)
        .select()
        .single();

      if (!error && data) {
        // Also sync local store
        const local = getLocalFallbackStore();
        saveLocalFallbackStore([data as CountdownDay, ...local]);
        return data as CountdownDay;
      }
      if (error) {
        console.warn('Supabase createSubmission error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase createSubmission failed, saving locally:', err);
    }
  }

  // Local fallback
  const local = getLocalFallbackStore();
  const updated = [newItem, ...local];
  saveLocalFallbackStore(updated);
  return newItem;
}

/**
 * 5. updateDayItem:
 * Updates a row in countdown_days (used by Admin).
 */
export async function updateDayItem(
  id: number,
  updates: Partial<CountdownDay>
): Promise<CountdownDay> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('countdown_days')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const local = getLocalFallbackStore();
        const updatedLocal = local.map((item) =>
          item.id === id ? { ...item, ...data } : item
        );
        saveLocalFallbackStore(updatedLocal);
        return data as CountdownDay;
      }
      if (error) {
        console.warn('Supabase updateDayItem error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase updateDayItem failed, updating locally:', err);
    }
  }

  // Local fallback
  const local = getLocalFallbackStore();
  let updatedItem: CountdownDay = {
    id,
    day_number: null,
    unlock_date: null,
    title: '',
    type: 'letter',
    content: '',
  };

  const updatedList = local.map((item) => {
    if (item.id === id) {
      updatedItem = { ...item, ...updates };
      return updatedItem;
    }
    return item;
  });

  saveLocalFallbackStore(updatedList);
  return updatedItem;
}

/**
 * 6. deleteDayItem:
 * Deletes a row from countdown_days.
 */
export async function deleteDayItem(id: number): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('countdown_days')
        .delete()
        .eq('id', id);

      if (!error) {
        const local = getLocalFallbackStore();
        saveLocalFallbackStore(local.filter((i) => i.id !== id));
        return true;
      }
      if (error) {
        console.warn('Supabase deleteDayItem error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase deleteDayItem failed, deleting locally:', err);
    }
  }

  // Local fallback
  const local = getLocalFallbackStore();
  const filtered = local.filter((i) => i.id !== id);
  saveLocalFallbackStore(filtered);
  return true;
}
