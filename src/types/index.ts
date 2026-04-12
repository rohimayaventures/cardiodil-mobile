export interface BiometricLog {
  id?: string;
  user_id: string;
  recorded_at: string;
  systolic?: number;
  diastolic?: number;
  resting_hr?: number;
  exercise_type?: string;
  exercise_minutes?: number;
  exercise_intensity?: 1 | 2 | 3 | 4 | 5;
  stress_level?: 1 | 2 | 3 | 4 | 5;
  sleep_hours?: number;
  sleep_quality_override?: 'poor' | 'fair' | 'good' | 'great';
  steps?: number;
  spo2_avg?: number;
  spo2_low?: number;
  spo2_low_timestamp?: string;
  hrv_sdnn?: number;
  skin_temp_baseline?: number;
  sleep_rem_minutes?: number;
  sleep_deep_minutes?: number;
  sleep_light_minutes?: number;
  sleep_awake_minutes?: number;
  sleep_total_minutes?: number;
  input_method?: 'healthkit' | 'manual' | 'circul' | 'mixed';
  data_source?: string;
  created_at?: string;
}

export interface MealNutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  omega3?: number;
  potassium?: number;
  isRedMeat?: boolean;
  isFried?: boolean;
  isProcessed?: boolean;
  isWholeFoods?: boolean;
  isLegumes?: boolean;
  isVegetables?: boolean;
  dataSource?: 'usda' | 'open_food_facts' | 'nutritionix' | 'user_provided' | 'estimated';
}

export interface HeartScoreResult {
  score: number;
  tier: 'excellent' | 'good' | 'moderate' | 'poor' | 'very_poor';
  tierLabel: string;
  ldlImpact: 'positive' | 'neutral' | 'negative' | 'high_risk';
  fiberScore: number;
  breakdown: {
    baseScore: number;
    saturatedFatPenalty: number;
    sodiumPenalty: number;
    transFatPenalty: number;
    fiberBonus: number;
    omega3Bonus: number;
    processingPenalty: number;
    wholeFoodBonus: number;
    redMeatPenalty: number;
    friedPenalty: number;
    legumesBonus: number;
  };
  flags: {
    satFatFlag: boolean;
    sodiumFlag: boolean;
    transFatFlag: boolean;
    lowFiber: boolean;
    redMeatWarning: boolean;
    friedWarning: boolean;
  };
  summary: string;
}

export interface MealLog {
  id?: string;
  user_id: string;
  image_url?: string;
  description: string;
  detected_components?: Record<string, unknown>;
  meal_score: number;
  meal_score_tier: string;
  ldl_impact: string;
  fiber_score?: number;
  sat_fat_flag?: boolean;
  sodium_flag?: boolean;
  nutrition?: MealNutrition;
  source_citations?: Record<string, unknown>;
  dil_feedback?: string;
  created_at?: string;
}

export interface LabResult {
  id?: string;
  user_id: string;
  drawn_at: string;
  ldl?: number;
  hdl?: number;
  total_cholesterol?: number;
  triglycerides?: number;
  apob?: number;
  hscrp?: number;
  glucose?: number;
  source?: string;
  pdf_url?: string;
  claude_interpretation?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  tier: 'free' | 'pro' | 'family' | 'clinical' | 'founder';
  dil_xp: number;
  streak_days: number;
  phoenix_cycle_day: number;
}

export interface HealthKitReading {
  value: number;
  source: 'healthkit' | 'manual' | 'circul';
  timestamp?: string;
  confirmed?: boolean;
}

export interface DashboardState {
  bpm: HealthKitReading;
  spo2: HealthKitReading;
  hrv: HealthKitReading;
  sleepHours: HealthKitReading;
  sleepDeepMinutes: HealthKitReading;
  steps: HealthKitReading;
  systolic: HealthKitReading;
  diastolic: HealthKitReading;
  heartScore: number;
  weeklyMealAvg: number;
  dilMessage: string;
  isLoading: boolean;
}

export type ExerciseType = 'walk' | 'run' | 'cycle' | 'swim' | 'gym' | 'other';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 'poor' | 'fair' | 'good' | 'great';
