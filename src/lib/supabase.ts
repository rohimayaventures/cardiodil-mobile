// Supabase Client — CardioDil AI
// Single source of truth for all database operations
// RLS enforced at the database level — users see only their own data
// Founder tier (prasad.pagade@gmail.com) seeded at migration level

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── USER PROFILE ──────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertUserProfile(
  userId: string,
  updates: Partial<import('../types').UserProfile>
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ── DIL XP ───────────────────────────────────────────────
// Adds XP and increments streak — called after every Quick Log submission

export async function addDilXP(userId: string, xpAmount: number): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;

  const newXP = (profile.dil_xp ?? 0) + xpAmount;
  const newPhoenixDay = Math.min((profile.phoenix_cycle_day ?? 1) + 1, 30);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      dil_xp: newXP,
      phoenix_cycle_day: newPhoenixDay,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
}

// ── BIOMETRIC LOG ─────────────────────────────────────────
// Stores one record per day. Merges HealthKit auto-read with manual overrides.
// input_method = 'mixed' when both sources contributed

export async function saveBiometricLog(
  userId: string,
  data: Omit<import('../types').BiometricLog, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('biometrics').insert({
    ...data,
    user_id: userId,
    recorded_at: data.recorded_at ?? new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getTodayBiometrics(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('biometrics')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', today.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBiometricHistory(userId: string, days: number = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('biometrics')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── MEAL LOGS ─────────────────────────────────────────────

export async function saveMealLog(
  userId: string,
  data: Omit<import('../types').MealLog, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('meals').insert({
    ...data,
    user_id: userId,
  });
  if (error) throw error;
}

export async function getTodayMeals(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWeeklyMealAverage(userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from('meals')
    .select('meal_score')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  const avg = data.reduce((sum, m) => sum + (m.meal_score ?? 0), 0) / data.length;
  return Math.round(avg);
}

// ── LAB RESULTS ───────────────────────────────────────────

export async function saveLabResult(
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('lab_results')
    .insert({ user_id: userId, ...data });
  if (error) throw error;
}

export async function getRecentLabs(userId: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', userId)
    .order('drawn_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ── WEEKLY INSIGHTS ───────────────────────────────────────

export async function saveWeeklyInsight(
  userId: string,
  weekStart: string,
  narrative: string,
  focusArea: string
): Promise<void> {
  const { error } = await supabase.from('weekly_insights').upsert({
    user_id: userId,
    week_start: weekStart,
    narrative,
    focus_area: focusArea,
    generated_by: 'claude-sonnet-4-5',
  });
  if (error) throw error;
}

export async function getLatestInsight(userId: string) {
  const { data, error } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
