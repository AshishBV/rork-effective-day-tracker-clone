import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

const DEVICE_ID_KEY = 'effective_day_tracker_device_id';
const SYNC_TIMESTAMPS_KEY = 'effective_day_tracker_sync_timestamps';

const SYNC_DEBOUNCE_MS = 2000;

function generateDeviceId(): string {
  return 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 12);
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch (e) {
    console.log('[Supabase] Error reading device ID:', e);
  }

  const newId = generateDeviceId();
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  } catch (e) {
    console.log('[Supabase] Error saving device ID:', e);
  }
  cachedDeviceId = newId;
  return newId;
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

async function getEffectiveUserId(): Promise<string> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
    } catch (e) {
      console.log('[Supabase] Could not get auth user, falling back to device ID:', e);
    }
  }
  return getDeviceId();
}

export async function getLocalSyncTimestamp(dataType: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_TIMESTAMPS_KEY);
    const timestamps = raw ? JSON.parse(raw) as Record<string, string> : {};
    return timestamps[dataType] || null;
  } catch {
    return null;
  }
}

export async function setLocalSyncTimestamp(dataType: string, timestamp: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_TIMESTAMPS_KEY);
    const timestamps = raw ? JSON.parse(raw) as Record<string, string> : {};
    timestamps[dataType] = timestamp;
    await AsyncStorage.setItem(SYNC_TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch (e) {
    console.log('[Supabase] Error saving sync timestamp:', e);
  }
}

export async function upsertAppData(dataType: string, data: unknown): Promise<boolean> {
  if (!supabase) {
    console.log('[Supabase] Not configured, skipping cloud sync');
    return false;
  }

  try {
    const userId = await getEffectiveUserId();
    const now = new Date().toISOString();
    console.log(`[Supabase] Upserting ${dataType} for user ${userId}`);

    const { error } = await supabase
      .from('app_data')
      .upsert(
        {
          device_id: userId,
          data_type: dataType,
          data: data,
          updated_at: now,
        },
        { onConflict: 'device_id,data_type' }
      );

    if (error) {
      console.log(`[Supabase] Error upserting ${dataType}:`, error.message);
      return false;
    }

    await setLocalSyncTimestamp(dataType, now);
    console.log(`[Supabase] Successfully synced ${dataType} at ${now}`);
    return true;
  } catch (e) {
    console.log(`[Supabase] Exception upserting ${dataType}:`, e);
    return false;
  }
}

export interface FetchResult<T> {
  data: T | null;
  updatedAt: string | null;
}

export async function fetchAppData<T>(dataType: string): Promise<FetchResult<T>> {
  if (!supabase) {
    console.log('[Supabase] Not configured, skipping cloud fetch');
    return { data: null, updatedAt: null };
  }

  try {
    const userId = await getEffectiveUserId();
    console.log(`[Supabase] Fetching ${dataType} for user ${userId}`);

    const { data, error } = await supabase
      .from('app_data')
      .select('data, updated_at')
      .eq('device_id', userId)
      .eq('data_type', dataType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[Supabase] No ${dataType} found in cloud`);
        return { data: null, updatedAt: null };
      }
      console.log(`[Supabase] Error fetching ${dataType}:`, error.message);
      return { data: null, updatedAt: null };
    }

    console.log(`[Supabase] Successfully fetched ${dataType}, updated_at: ${data?.updated_at}`);
    return {
      data: (data?.data as T) ?? null,
      updatedAt: data?.updated_at ?? null,
    };
  } catch (e) {
    console.log(`[Supabase] Exception fetching ${dataType}:`, e);
    return { data: null, updatedAt: null };
  }
}

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function debouncedUpsert(dataType: string, data: unknown): void {
  if (!isSupabaseConfigured()) return;

  if (debounceTimers[dataType]) {
    clearTimeout(debounceTimers[dataType]);
  }

  debounceTimers[dataType] = setTimeout(() => {
    console.log(`[Supabase] Debounced sync firing for ${dataType}`);
    upsertAppData(dataType, data).catch(e =>
      console.log(`[Supabase] Background ${dataType} sync failed:`, e)
    );
  }, SYNC_DEBOUNCE_MS);
}
