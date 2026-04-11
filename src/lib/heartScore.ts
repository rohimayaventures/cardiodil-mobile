// Heart Score Engine — CardioDil AI
// Composite DAILY score shown on the Dashboard in gold
// This is NOT the Meal Score (src/lib/mealScore.ts)
//
// Meal Score  = single meal LDL impact, 0-100, shown on Meal Vision screen
// Heart Score = composite daily cardiac health, 0-100, shown on Dashboard
//
// Formula:
//   Meal component       30% — average of all meal scores logged today
//   Biometric component  30% — HRV, SpO2, resting HR, blood pressure
//   Lab component        20% — LDL, HDL, ApoB, hsCRP trends
//   Lifestyle component  20% — exercise, steps, stress level, sleep quality

import { BiometricLog, LabResult, MealLog } from '../types';
import { HEART_SCORE_TIERS } from '../constants/theme';

// ── COMPONENT WEIGHTS ────────────────────────────────────
const WEIGHTS = {
  meals:      0.30,
  biometrics: 0.30,
  labs:       0.20,
  lifestyle:  0.20,
} as const;

// ── MEAL COMPONENT ────────────────────────────────────────
// Average of all meal scores logged today
// If no meals logged: returns 50 (neutral, does not punish missing data)

export function scoreMealComponent(meals: MealLog[]): number {
  if (!meals || meals.length === 0) return 50;
  const avg = meals.reduce((sum, m) => sum + (m.heart_score ?? 50), 0) / meals.length;
  return Math.round(Math.min(100, Math.max(0, avg)));
}

// ── BIOMETRIC COMPONENT ───────────────────────────────────
// Scores today's Circul ring and Apple Health readings
// Each metric scored 0-100, then weighted equally within component

export function scoreBiometricComponent(bio: Partial<BiometricLog>): number {
  const scores: number[] = [];

  // HRV (SDNN in ms) — higher is better
  if (bio.hrv_sdnn !== undefined) {
    if      (bio.hrv_sdnn >= 60) scores.push(100);
    else if (bio.hrv_sdnn >= 45) scores.push(85);
    else if (bio.hrv_sdnn >= 30) scores.push(65);
    else if (bio.hrv_sdnn >= 20) scores.push(45);
    else                         scores.push(25);
  }

  // SpO2 (%) — must stay above 95% during sleep
  if (bio.spo2_avg !== undefined) {
    if      (bio.spo2_avg >= 97) scores.push(100);
    else if (bio.spo2_avg >= 95) scores.push(80);
    else if (bio.spo2_avg >= 92) scores.push(50);
    else if (bio.spo2_avg >= 90) scores.push(25);
    else                         scores.push(0);
  }

  // Resting HR (BPM) — lower is generally better during recovery
  if (bio.resting_hr !== undefined) {
    if      (bio.resting_hr <= 60) scores.push(100);
    else if (bio.resting_hr <= 70) scores.push(85);
    else if (bio.resting_hr <= 80) scores.push(65);
    else if (bio.resting_hr <= 90) scores.push(40);
    else                           scores.push(20);
  }

  // Blood pressure (systolic)
  if (bio.systolic !== undefined) {
    if      (bio.systolic < 120)  scores.push(100);
    else if (bio.systolic < 130)  scores.push(80);
    else if (bio.systolic < 140)  scores.push(55);
    else if (bio.systolic < 160)  scores.push(25);
    else                          scores.push(0);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── LAB COMPONENT ─────────────────────────────────────────
// Scores based on most recent lab values and trend direction
// Uses last 3 draws to detect trends
// Rising LDL across 3 consecutive draws triggers significant penalty

export function scoreLabComponent(labs: LabResult[]): number {
  if (!labs || labs.length === 0) return 50;

  const latest = labs[0];
  const scores: number[] = [];

  // LDL — primary target, cardiac recovery goal is below 70
  if (latest.ldl !== undefined) {
    if      (latest.ldl < 70)  scores.push(100);
    else if (latest.ldl < 100) scores.push(80);
    else if (latest.ldl < 130) scores.push(55);
    else if (latest.ldl < 160) scores.push(30);
    else                       scores.push(10);

    // Trend penalty: LDL rising across 3 draws drops score significantly
    if (labs.length >= 3) {
      const ldlValues = labs.slice(0, 3).map((l) => l.ldl ?? 0);
      const risingTrend = ldlValues[0] > ldlValues[1] && ldlValues[1] > ldlValues[2];
      if (risingTrend) {
        scores[scores.length - 1] = Math.max(0, scores[scores.length - 1] - 20);
      }
    }
  }

  // HDL — higher is protective
  if (latest.hdl !== undefined) {
    if      (latest.hdl >= 60) scores.push(100);
    else if (latest.hdl >= 50) scores.push(75);
    else if (latest.hdl >= 40) scores.push(50);
    else                       scores.push(25);
  }

  // hsCRP — inflammation marker, lower is better
  if (latest.hscrp !== undefined) {
    if      (latest.hscrp < 1.0) scores.push(100);
    else if (latest.hscrp < 2.0) scores.push(75);
    else if (latest.hscrp < 3.0) scores.push(50);
    else                         scores.push(20);
  }

  // ApoB — particle count, lower is better
  if (latest.apob !== undefined) {
    if      (latest.apob < 80)  scores.push(100);
    else if (latest.apob < 90)  scores.push(75);
    else if (latest.apob < 100) scores.push(50);
    else                        scores.push(25);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── LIFESTYLE COMPONENT ───────────────────────────────────
// Scores exercise, steps, stress, and sleep quality from Quick Log

export function scoreLifestyleComponent(bio: Partial<BiometricLog>): number {
  const scores: number[] = [];

  // Exercise minutes
  if (bio.exercise_minutes !== undefined) {
    if      (bio.exercise_minutes >= 45) scores.push(100);
    else if (bio.exercise_minutes >= 30) scores.push(80);
    else if (bio.exercise_minutes >= 15) scores.push(55);
    else if (bio.exercise_minutes > 0)   scores.push(30);
    else                                 scores.push(0);
  }

  // Steps
  if (bio.steps !== undefined) {
    if      (bio.steps >= 10000) scores.push(100);
    else if (bio.steps >= 7500)  scores.push(80);
    else if (bio.steps >= 5000)  scores.push(60);
    else if (bio.steps >= 2500)  scores.push(35);
    else                         scores.push(15);
  }

  // Stress level (1=calm, 5=high) — inverted for scoring
  if (bio.stress_level !== undefined) {
    const stressScore = Math.round(((5 - bio.stress_level) / 4) * 100);
    scores.push(stressScore);
  }

  // Sleep hours
  if (bio.sleep_hours !== undefined) {
    if      (bio.sleep_hours >= 7.5) scores.push(100);
    else if (bio.sleep_hours >= 7.0) scores.push(85);
    else if (bio.sleep_hours >= 6.0) scores.push(60);
    else if (bio.sleep_hours >= 5.0) scores.push(35);
    else                             scores.push(15);
  }

  // Sleep quality override (subjective — user knows best)
  if (bio.sleep_quality_override !== undefined) {
    const qualityMap = { great: 100, good: 75, fair: 45, poor: 15 };
    scores.push(qualityMap[bio.sleep_quality_override]);
  }

  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── COMPOSITE HEART SCORE ─────────────────────────────────
// Combines all four components using defined weights
// Returns full breakdown so Dashboard can show which component to focus on

export interface HeartScoreComposite {
  score: number;
  tier: keyof typeof HEART_SCORE_TIERS;
  tierLabel: string;
  tierColor: string;
  components: {
    meals:      { score: number; weight: number; weighted: number };
    biometrics: { score: number; weight: number; weighted: number };
    labs:       { score: number; weight: number; weighted: number };
    lifestyle:  { score: number; weight: number; weighted: number };
  };
  weakestComponent: string;
  dilSummary: string;
}

export function calculateHeartScore(
  meals:     MealLog[],
  biometrics: Partial<BiometricLog>,
  labs:       LabResult[]
): HeartScoreComposite {
  const mealScore      = scoreMealComponent(meals);
  const biometricScore = scoreBiometricComponent(biometrics);
  const labScore       = scoreLabComponent(labs);
  const lifestyleScore = scoreLifestyleComponent(biometrics);

  const weighted = {
    meals:      mealScore      * WEIGHTS.meals,
    biometrics: biometricScore * WEIGHTS.biometrics,
    labs:       labScore       * WEIGHTS.labs,
    lifestyle:  lifestyleScore * WEIGHTS.lifestyle,
  };

  const score = Math.round(
    weighted.meals + weighted.biometrics + weighted.labs + weighted.lifestyle
  );

  // Tier
  let tier: keyof typeof HEART_SCORE_TIERS;
  if      (score >= HEART_SCORE_TIERS.excellent.min) tier = 'excellent';
  else if (score >= HEART_SCORE_TIERS.good.min)      tier = 'good';
  else if (score >= HEART_SCORE_TIERS.moderate.min)  tier = 'moderate';
  else if (score >= HEART_SCORE_TIERS.poor.min)      tier = 'poor';
  else                                               tier = 'very_poor';

  const tierLabel = HEART_SCORE_TIERS[tier].label;
  const tierColor = HEART_SCORE_TIERS[tier].color;

  // Find weakest component to surface in Dashboard
  const componentScores = {
    'Meals':      mealScore,
    'Biometrics': biometricScore,
    'Labs':       labScore,
    'Lifestyle':  lifestyleScore,
  };
  const weakestComponent = Object.entries(componentScores)
    .sort(([, a], [, b]) => a - b)[0][0];

  const dilSummary = buildHeartScoreSummary(
    tier,
    weakestComponent,
    mealScore,
    biometricScore,
    labScore,
    lifestyleScore
  );

  return {
    score,
    tier,
    tierLabel,
    tierColor,
    components: {
      meals:      { score: mealScore,      weight: WEIGHTS.meals,      weighted: weighted.meals },
      biometrics: { score: biometricScore, weight: WEIGHTS.biometrics, weighted: weighted.biometrics },
      labs:       { score: labScore,       weight: WEIGHTS.labs,       weighted: weighted.labs },
      lifestyle:  { score: lifestyleScore, weight: WEIGHTS.lifestyle,  weighted: weighted.lifestyle },
    },
    weakestComponent,
    dilSummary,
  };
}

function buildHeartScoreSummary(
  tier: keyof typeof HEART_SCORE_TIERS,
  weakest: string,
  meals: number,
  biometrics: number,
  labs: number,
  lifestyle: number
): string {
  if (tier === 'excellent') {
    return 'Outstanding cardiac day. Everything is aligned. This is what recovery looks like.';
  }
  if (tier === 'good') {
    return `Strong day. Your ${weakest.toLowerCase()} score has the most room to improve.`;
  }
  if (tier === 'moderate') {
    if (weakest === 'Meals')      return 'Your meals are pulling the score down today. Focus there first.';
    if (weakest === 'Biometrics') return 'Your biometrics need attention. Check HRV and blood pressure.';
    if (weakest === 'Labs')       return 'Your lab trends are the weak point. Consistent meals will move them.';
    return 'Your lifestyle inputs are dragging the score. Sleep and stress are the fastest levers.';
  }
  if (tier === 'poor') {
    return `Multiple areas need attention. Start with ${weakest.toLowerCase()} — that is your biggest gap today.`;
  }
  return 'Difficult cardiac day across several inputs. This is information, not a verdict. Dil is watching the trend.';
}
