// Meal Score Engine — CardioDil AI
// Scores a single meal 0-100 based on LDL cholesterol impact
// This is NOT the Heart Score. This is meal-level nutrition scoring only.
// Based on Prasad's V1 Advanced Adaptive Prompt.
//
// SEPARATE FROM:
// src/lib/heartScore.ts — composite daily Heart Score (built later)
// which combines meal scores + biometrics + labs + lifestyle
//
// Priority order: Saturated fat → Trans fat → Fiber → Sodium → Processing level

import { MealNutrition, HeartScoreResult } from '../types';
import {
  HEART_SCORE_TIERS,
  SODIUM_LIMITS,
  SAT_FAT_LIMITS,
  FIBER_TARGETS,
} from '../constants/theme';

export function calculateMealScore(nutrition: MealNutrition): HeartScoreResult {
  const breakdown = {
    baseScore: 70,
    saturatedFatPenalty: 0,
    sodiumPenalty: 0,
    transFatPenalty: 0,
    fiberBonus: 0,
    omega3Bonus: 0,
    processingPenalty: 0,
    wholeFoodBonus: 0,
    redMeatPenalty: 0,
    friedPenalty: 0,
    legumesBonus: 0,
  };

  // SATURATED FAT — highest LDL impact, primary penalty
  if (nutrition.saturatedFat !== undefined) {
    if (nutrition.saturatedFat > 15)
      breakdown.saturatedFatPenalty = -30;
    else if (nutrition.saturatedFat > 10)
      breakdown.saturatedFatPenalty = -20;
    else if (nutrition.saturatedFat > SAT_FAT_LIMITS.perMealDanger)
      breakdown.saturatedFatPenalty = -12;
    else if (nutrition.saturatedFat > SAT_FAT_LIMITS.perMealWarning)
      breakdown.saturatedFatPenalty = -5;
    else if (nutrition.saturatedFat <= SAT_FAT_LIMITS.perMealGood)
      breakdown.saturatedFatPenalty = +3;
  }

  // TRANS FAT — critical penalty, no acceptable level
  if (nutrition.transFat && nutrition.transFat > 0) {
    if (nutrition.transFat > 2)        breakdown.transFatPenalty = -25;
    else if (nutrition.transFat > 0.5) breakdown.transFatPenalty = -15;
    else                               breakdown.transFatPenalty = -8;
  }

  // FIBER — primary LDL reduction mechanism
  // Soluble fiber binds cholesterol in the gut before absorption
  if (nutrition.fiber !== undefined) {
    if (nutrition.fiber >= FIBER_TARGETS.perMealExcellent)    breakdown.fiberBonus = +20;
    else if (nutrition.fiber >= 7)                            breakdown.fiberBonus = +14;
    else if (nutrition.fiber >= FIBER_TARGETS.perMealGood)    breakdown.fiberBonus = +10;
    else if (nutrition.fiber >= 3)                            breakdown.fiberBonus = +5;
    else if (nutrition.fiber >= FIBER_TARGETS.perMealMinimum) breakdown.fiberBonus = +2;
    else                                                      breakdown.fiberBonus = -5;
  } else {
    breakdown.fiberBonus = -3; // unknown — conservative assumption
  }

  // SODIUM — cardiac recovery protocol
  // Flag any single meal over 400mg. Daily max 1500mg.
  if (nutrition.sodium !== undefined) {
    if (nutrition.sodium > 1500)
      breakdown.sodiumPenalty = -20;
    else if (nutrition.sodium > 1000)
      breakdown.sodiumPenalty = -14;
    else if (nutrition.sodium > SODIUM_LIMITS.perMealDanger)
      breakdown.sodiumPenalty = -8;
    else if (nutrition.sodium > SODIUM_LIMITS.perMealWarning)
      breakdown.sodiumPenalty = -3;
    else if (nutrition.sodium <= 200)
      breakdown.sodiumPenalty = +3;
  }

  // OMEGA-3 — LDL protective and anti-inflammatory
  if (nutrition.omega3 !== undefined) {
    if (nutrition.omega3 >= 2000)      breakdown.omega3Bonus = +12;
    else if (nutrition.omega3 >= 1000) breakdown.omega3Bonus = +8;
    else if (nutrition.omega3 >= 500)  breakdown.omega3Bonus = +4;
  }

  // RED MEAT — strong LDL penalty
  if (nutrition.isRedMeat) breakdown.redMeatPenalty = -12;

  // FRIED — oxidized fats and hidden saturated fat
  if (nutrition.isFried) breakdown.friedPenalty = -15;

  // PROCESSED — hidden sodium, trans fats, low fiber
  if (nutrition.isProcessed) breakdown.processingPenalty = -8;

  // WHOLE FOODS — reward
  if (nutrition.isWholeFoods) breakdown.wholeFoodBonus += 8;

  // VEGETABLES — reward
  if (nutrition.isVegetables) breakdown.wholeFoodBonus += 5;

  // LEGUMES — strong LDL benefit (soluble fiber + plant protein)
  if (nutrition.isLegumes) breakdown.legumesBonus = +12;

  // FINAL SCORE
  const raw = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  // TIER
  let tier: HeartScoreResult['tier'];
  if (score >= HEART_SCORE_TIERS.excellent.min)     tier = 'excellent';
  else if (score >= HEART_SCORE_TIERS.good.min)     tier = 'good';
  else if (score >= HEART_SCORE_TIERS.moderate.min) tier = 'moderate';
  else if (score >= HEART_SCORE_TIERS.poor.min)     tier = 'poor';
  else tier = 'very_poor';

  const tierLabel = HEART_SCORE_TIERS[tier].label;

  // LDL IMPACT CLASSIFICATION
  const satFat = nutrition.saturatedFat ?? 5;
  const fiber = nutrition.fiber ?? 0;
  let ldlImpact: HeartScoreResult['ldlImpact'];
  if (satFat <= 3 && fiber >= 5)
    ldlImpact = 'positive';
  else if (satFat > 10 || (nutrition.transFat && nutrition.transFat > 0.5))
    ldlImpact = 'high_risk';
  else if (satFat > 6)
    ldlImpact = 'negative';
  else
    ldlImpact = 'neutral';

  // FIBER SUB-SCORE (0-100)
  const fiberScore = nutrition.fiber !== undefined
    ? Math.min(100, Math.round((nutrition.fiber / FIBER_TARGETS.perMealExcellent) * 100))
    : 0;

  // FLAGS
  const flags: HeartScoreResult['flags'] = {
    satFatFlag:     (nutrition.saturatedFat ?? 0) > SAT_FAT_LIMITS.perMealWarning,
    sodiumFlag:     (nutrition.sodium ?? 0) > SODIUM_LIMITS.perMealWarning,
    transFatFlag:   (nutrition.transFat ?? 0) > 0,
    lowFiber:       (nutrition.fiber ?? 0) < FIBER_TARGETS.perMealMinimum,
    redMeatWarning: nutrition.isRedMeat ?? false,
    friedWarning:   nutrition.isFried ?? false,
  };

  // SUMMARY — Dil one-line practical read per Prasad's prompt spec
  const summary = buildMealSummary(tier, flags);

  return { score, tier, tierLabel, ldlImpact, fiberScore, breakdown, flags, summary };
}

function buildMealSummary(
  tier: HeartScoreResult['tier'],
  flags: HeartScoreResult['flags']
): string {
  if (tier === 'excellent') {
    return 'Strong cardiac meal. This one is doing real work on your LDL.';
  }
  if (tier === 'good') {
    if (flags.lowFiber)   return 'Good meal overall. Adding fiber would push this higher.';
    if (flags.sodiumFlag) return 'Good nutritional profile. Watch the sodium to protect your daily total.';
    return 'Solid cardiac meal. Consistent choices like this compound over time.';
  }
  if (tier === 'moderate') {
    if (flags.satFatFlag) return 'Mixed meal. The saturated fat is the main drag on your LDL.';
    if (flags.sodiumFlag) return 'Reasonable meal but sodium is elevated. Worth tracking your daily total.';
    return 'This meal has tradeoffs. Small swaps could move it into good territory.';
  }
  if (tier === 'poor') {
    if (flags.redMeatWarning) return 'Red meat is the primary LDL risk here. Frequency matters more than any single meal.';
    if (flags.friedWarning)   return 'Frying adds significant saturated fat. Same ingredients cooked differently scores much higher.';
    return 'This meal works against your LDL goals. Not a problem once, but the pattern matters.';
  }
  return 'High cardiovascular risk meal. Occasional is manageable. Regular is not.';
}

// Meal score color — enforces Dil Vital color rules
// Gold only for excellent (milestone). Crimson only for danger states.
export function getMealScoreColor(score: number): string {
  if (score >= 90) return '#C9A84C'; // Gold — milestone only
  if (score >= 70) return '#22C55E'; // Emerald — good
  if (score >= 50) return '#94A3B8'; // Silver — moderate
  if (score >= 30) return '#DC2626'; // Crimson — poor
  return '#7F1D1D';                  // Blood — very poor
}

export function getMealScoreTier(score: number) {
  if (score >= 90) return { tier: 'excellent', label: 'Excellent', color: '#C9A84C' };
  if (score >= 70) return { tier: 'good',      label: 'Good',      color: '#22C55E' };
  if (score >= 50) return { tier: 'moderate',  label: 'Moderate',  color: '#94A3B8' };
  if (score >= 30) return { tier: 'poor',      label: 'Poor',      color: '#DC2626' };
  return              { tier: 'very_poor',  label: 'Very Poor', color: '#7F1D1D' };
}
