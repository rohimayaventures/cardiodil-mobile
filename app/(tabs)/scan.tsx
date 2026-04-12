import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { calculateMealScore, getMealScoreTier, getMealScoreColor } from '../../src/lib/mealScore';
import { saveMealLog } from '../../src/lib/supabase';
import { getMealResponse } from '../../src/lib/dilPersonality';
import { speakAfterDelay } from '../../src/lib/elevenlabs';
import type { MealNutrition } from '../../src/types';

// Meal Vision / Scan Screen — CardioDil AI
// Flow: capture or pick image -> Claude vision identifies meal components
// -> Brand Intelligence chain (Open Food Facts, USDA, Nutritionix)
// -> Prasad V1 meal scoring algorithm
// -> Dil feedback response spoken via ElevenLabs
// -> Save to Supabase meals table

// SECURITY NOTE: API key on client for Phase 1 single-user.
// Phase 2: proxy via Supabase Edge Function.

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!;

type ScanStep = 'capture' | 'preview' | 'analyzing' | 'result';

interface MealResult {
  description: string;
  components: string[];
  heartScore: number;
  tier: string;
  dilFeedback: string;
  nutrition: {
    sat_fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
    calories?: number;
    protein_g?: number;
  };
  brandWarning?: string;
}

function visionNutritionToMealNutrition(
  vision: Record<string, unknown>,
  cookingMethod: string
): MealNutrition {
  const n = (k: string): number | undefined => {
    const v = vision[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const p = parseFloat(v);
      return Number.isNaN(p) ? undefined : p;
    }
    return undefined;
  };
  return {
    saturatedFat: n('sat_fat_g') ?? 0,
    fiber: n('fiber_g') ?? 0,
    sodium: n('sodium_mg') ?? 0,
    calories: n('calories') ?? 0,
    protein: n('protein_g') ?? 0,
    isFried: cookingMethod.toLowerCase() === 'fried',
  };
}

function mealNutritionToDisplay(n: MealNutrition): MealResult['nutrition'] {
  return {
    sat_fat_g: n.saturatedFat,
    fiber_g: n.fiber,
    sodium_mg: n.sodium,
    calories: n.calories,
    protein_g: n.protein,
  };
}

// Convert local image URI to base64 for Claude API
async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ScanScreen() {
  const { userId, signedIn } = useAuth();
  const cameraRef = useRef<InstanceType<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep]           = useState<ScanStep>('capture');
  const [imageUri, setImageUri]   = useState<string | null>(null);
  const [result, setResult]       = useState<MealResult | null>(null);
  const [facing, setFacing]       = useState<CameraType>('back');
  const [saved, setSaved]         = useState(false);

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setStep('preview');
      }
    } catch (e) {
      console.error('[Scan] Camera capture failed:', e);
      Alert.alert('Camera error', 'Could not capture photo. Try again.');
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setStep('preview');
    }
  }

  async function analyzeMeal() {
    if (!imageUri) return;
    setStep('analyzing');

    try {
      const base64 = await uriToBase64(imageUri);

      // CLAUDE VISION PROMPT
      // Two-pass: first identify components, then score
      const visionPrompt = `You are Dil, a cardiac health AI agent analyzing a meal image.

Analyze this meal image and respond ONLY with valid JSON in this exact structure:

{
  "description": "Brief meal description in 6-10 words",
  "components": ["ingredient 1", "ingredient 2", "ingredient 3"],
  "has_branded_products": false,
  "branded_product_names": [],
  "estimated_nutrition": {
    "sat_fat_g": 0,
    "fiber_g": 0,
    "sodium_mg": 0,
    "calories": 0,
    "protein_g": 0
  },
  "cooking_method": "grilled",
  "is_restaurant_meal": false,
  "cuisine_type": "American",
  "dil_observation": "One sentence clinical observation about this meal from Dil's perspective."
}

CRITICAL RULES:
- If you see any branded or packaged food product, set has_branded_products to true and list the brand names
- For branded products, set all nutrition values to 0 and flag for manual entry
- For whole foods, estimate nutrition values as accurately as possible
- sat_fat_g and sodium_mg are the most important values for cardiac scoring
- cooking_method options: grilled, fried, baked, steamed, raw, sauteed, boiled, other
- Do not include any text outside the JSON object`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: visionPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude vision API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const rawText = data.content?.[0]?.text ?? '{}';

      let parsed: Record<string, unknown> = {};
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as Record<string, unknown>) : {};
      } catch {
        throw new Error('Could not parse Claude vision response');
      }

      const nutritionRaw =
        parsed.estimated_nutrition && typeof parsed.estimated_nutrition === 'object'
          ? (parsed.estimated_nutrition as Record<string, unknown>)
          : {};
      const hasBrandedProduct = parsed.has_branded_products === true;
      const cookingMethod = String(parsed.cooking_method ?? 'other');

      const mealNutrition = visionNutritionToMealNutrition(nutritionRaw, cookingMethod);

      // Calculate heart score using Prasad V1 algorithm
      const heartScore = hasBrandedProduct
        ? 50 // Neutral score when we cannot confirm branded nutrition
        : calculateMealScore(mealNutrition).score;

      const tierInfo = getMealScoreTier(heartScore);
      const tier = tierInfo.label;

      // Get Dil's personality response for this score
      const personalityLine = getMealResponse(heartScore);

      // Build Dil's full feedback combining vision observation and personality
      const dilObservation = typeof parsed.dil_observation === 'string' ? parsed.dil_observation : '';
      const dilFeedback = [dilObservation, personalityLine].filter(Boolean).join(' ');

      const names = parsed.branded_product_names;
      const brandList = Array.isArray(names)
        ? names.filter((x): x is string => typeof x === 'string').join(', ')
        : '';

      const mealResult: MealResult = {
        description: typeof parsed.description === 'string' ? parsed.description : 'Meal analyzed',
        components: Array.isArray(parsed.components)
          ? parsed.components.filter((c): c is string => typeof c === 'string')
          : [],
        heartScore,
        tier,
        dilFeedback,
        nutrition: mealNutritionToDisplay(mealNutrition),
        brandWarning: hasBrandedProduct
          ? `Branded product detected: ${brandList}. Nutrition estimated at neutral. Confirm the label for an accurate score.`
          : undefined,
      };

      setResult(mealResult);
      setStep('result');
      setSaved(false);

      // Dil speaks the feedback after result renders
      speakAfterDelay(dilFeedback, 500);

    } catch (error) {
      console.error('[Scan] Analysis failed:', error);
      setStep('preview');
      Alert.alert(
        'Analysis failed',
        'Could not analyze the meal. Check your connection and try again.'
      );
    }
  }

  async function handleSave() {
    if (!result || !userId || !signedIn || saved) return;
    try {
      const mealNutrition = visionNutritionToMealNutrition(
        {
          sat_fat_g: result.nutrition.sat_fat_g,
          fiber_g: result.nutrition.fiber_g,
          sodium_mg: result.nutrition.sodium_mg,
          calories: result.nutrition.calories,
          protein_g: result.nutrition.protein_g,
        },
        'other'
      );

      await saveMealLog(userId, {
        user_id:             userId,
        description:       result.description,
        detected_components: { components: result.components },
        heart_score:       result.heartScore,
        heart_score_tier:  result.tier,
        ldl_impact:        result.heartScore >= 70 ? 'Favorable' : result.heartScore >= 50 ? 'Neutral' : 'Unfavorable',
        sat_fat_flag:      (result.nutrition.sat_fat_g ?? 0) > 10,
        sodium_flag:       (result.nutrition.sodium_mg ?? 0) > 400,
        nutrition:         mealNutrition,
        dil_feedback:      result.dilFeedback,
        image_url:         imageUri ?? undefined,
      });
      setSaved(true);
      Alert.alert('Meal logged', 'This meal has been added to your history.');
    } catch (e) {
      console.error('[Scan] Save failed:', e);
      Alert.alert('Save failed', 'Could not save the meal. Try again.');
    }
  }

  function resetScan() {
    setImageUri(null);
    setResult(null);
    setStep('capture');
    setSaved(false);
  }

  const scoreColor = result ? getMealScoreColor(result.heartScore) : COLORS.silver;

  // Camera not yet granted
  if (!permission) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={s.centeredText}>Checking camera access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={s.centeredTitle}>Camera Access</Text>
          <Text style={s.centeredText}>
            Meal Vision needs camera access to analyze your food.
          </Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Meal Vision</Text>
        <Text style={s.headerSub}>
          {step === 'capture'   && 'Point at your meal and capture.'}
          {step === 'preview'   && 'Review before analyzing.'}
          {step === 'analyzing' && 'Dil is reading your meal...'}
          {step === 'result'    && result?.description}
        </Text>
      </View>

      {/* CAPTURE STEP */}
      {(step === 'capture') && (
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
          >
            {/* Meal framing guide */}
            <View style={s.frameGuide} />

            {/* Camera controls */}
            <View style={s.cameraControls}>
              <TouchableOpacity style={s.libBtn} onPress={pickFromLibrary}>
                <Text style={s.libBtnText}>Library</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.captureBtn} onPress={takePicture}>
                <View style={s.captureBtnInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.flipBtn}
                onPress={() => setFacing((f) => f === 'back' ? 'front' : 'back')}
              >
                <Text style={s.flipBtnText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </CameraView>

          <View style={s.tipBar}>
            <Text style={s.tipText}>
              Include the full plate. Natural light gives the best results.
            </Text>
          </View>
        </View>
      )}

      {/* PREVIEW STEP */}
      {step === 'preview' && imageUri && (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
          <View style={s.previewControls}>
            <TouchableOpacity style={s.retakeBtn} onPress={resetScan}>
              <Text style={s.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.analyzeBtn} onPress={analyzeMeal}>
              <Text style={s.analyzeBtnText}>Analyze Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ANALYZING STEP */}
      {step === 'analyzing' && (
        <View style={s.analyzingState}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={s.analyzingThumb}
              resizeMode="cover"
            />
          )}
          <ActivityIndicator size="large" color={COLORS.emerald} style={{ marginTop: 28 }} />
          <Text style={s.analyzingTitle}>Analyzing your meal</Text>
          <Text style={s.analyzingText}>
            Dil is identifying components and calculating cardiac impact.
          </Text>
        </View>
      )}

      {/* RESULT STEP */}
      {step === 'result' && result && (
        <ScrollView contentContainerStyle={s.resultContent}>
          {/* Score hero */}
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>HEART SCORE</Text>
            <Text style={[s.scoreNumber, { color: scoreColor }]}>
              {result.heartScore}
            </Text>
            <Text style={[s.scoreTier, { color: scoreColor }]}>
              {result.tier}
            </Text>
            <View style={s.barTrack}>
              <View style={[
                s.barFill,
                {
                  width: `${result.heartScore}%` as `${number}%`,
                  backgroundColor: scoreColor,
                },
              ]} />
            </View>
          </View>

          {/* Brand warning */}
          {result.brandWarning && (
            <View style={s.warningCard}>
              <Text style={s.warningText}>{result.brandWarning}</Text>
            </View>
          )}

          {/* Dil feedback */}
          <View style={s.dilCard}>
            <View style={s.dilHeader}>
              <View style={s.dilDot} />
              <Text style={s.dilName}>DIL</Text>
            </View>
            <Text style={s.dilText}>{result.dilFeedback}</Text>
          </View>

          {/* Components detected */}
          {result.components.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardLabel}>DETECTED COMPONENTS</Text>
              {result.components.map((c, i) => (
                <Text key={i} style={s.componentLine}>
                  {'\u25E6'} {c}
                </Text>
              ))}
            </View>
          )}

          {/* Nutrition breakdown */}
          {!result.brandWarning && (
            <View style={s.card}>
              <Text style={s.cardLabel}>ESTIMATED NUTRITION</Text>
              <View style={s.nutriGrid}>
                <View style={s.nutriItem}>
                  <Text style={s.nutriVal}>{result.nutrition.calories ?? '--'}</Text>
                  <Text style={s.nutriLabel}>cal</Text>
                </View>
                <View style={s.nutriItem}>
                  <Text style={[s.nutriVal, { color: (result.nutrition.sat_fat_g ?? 0) > 10 ? COLORS.crimson : COLORS.silver }]}>
                    {result.nutrition.sat_fat_g ?? '--'}g
                  </Text>
                  <Text style={s.nutriLabel}>sat fat</Text>
                </View>
                <View style={s.nutriItem}>
                  <Text style={[s.nutriVal, { color: (result.nutrition.fiber_g ?? 0) >= 5 ? COLORS.emeraldText : COLORS.silver }]}>
                    {result.nutrition.fiber_g ?? '--'}g
                  </Text>
                  <Text style={s.nutriLabel}>fiber</Text>
                </View>
                <View style={s.nutriItem}>
                  <Text style={[s.nutriVal, { color: (result.nutrition.sodium_mg ?? 0) > 400 ? COLORS.crimson : COLORS.silver }]}>
                    {result.nutrition.sodium_mg ?? '--'}
                  </Text>
                  <Text style={s.nutriLabel}>sodium mg</Text>
                </View>
                <View style={s.nutriItem}>
                  <Text style={s.nutriVal}>{result.nutrition.protein_g ?? '--'}g</Text>
                  <Text style={s.nutriLabel}>protein</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.scanAgainBtn} onPress={resetScan}>
              <Text style={s.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saved && s.saveBtnDone]}
              onPress={handleSave}
              disabled={saved}
            >
              <Text style={s.saveBtnText}>
                {saved ? 'Logged' : 'Log This Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    padding: 16, paddingTop: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 15, letterSpacing: 2 },
  headerSub:   { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', marginTop: 2 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centeredTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 1.5, marginBottom: 8 },
  centeredText:  { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  permBtn: {
    marginTop: 20, borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.full, paddingHorizontal: 24, paddingVertical: 10,
  },
  permBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  frameGuide: {
    position: 'absolute', top: '15%', left: '10%',
    right: '10%', bottom: '25%',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: 12,
  },
  cameraControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 24, paddingHorizontal: 20,
    backgroundColor: 'rgba(7,9,10,0.65)',
  },
  libBtn:      { padding: 10 },
  libBtnText:  { color: COLORS.silver, fontSize: 11, letterSpacing: 1 },
  captureBtn: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 3, borderColor: COLORS.emerald,
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.emerald, opacity: 0.9,
  },
  flipBtn:     { padding: 10 },
  flipBtnText: { color: COLORS.silver, fontSize: 11, letterSpacing: 1 },

  tipBar: {
    backgroundColor: COLORS.surface, borderTopWidth: 1,
    borderTopColor: COLORS.border, padding: 10, alignItems: 'center',
  },
  tipText: { color: 'rgba(148,163,184,0.5)', fontSize: 10, fontStyle: 'italic' },

  previewImage: { flex: 1, width: '100%' },
  previewControls: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  retakeBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 13, alignItems: 'center',
    backgroundColor: COLORS.elevated,
  },
  retakeBtnText: { color: COLORS.silver, fontSize: 11, letterSpacing: 1 },
  analyzeBtn: {
    flex: 2, backgroundColor: COLORS.emeraldDeep,
    borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.md, padding: 13, alignItems: 'center',
  },
  analyzeBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  analyzingState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  analyzingThumb: {
    width: 140, height: 140, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  analyzingTitle: {
    color: COLORS.emeraldText, fontSize: 15, letterSpacing: 1,
    marginTop: 20, marginBottom: 8,
  },
  analyzingText: {
    color: COLORS.silver, fontSize: 12, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 20,
  },

  resultContent: { padding: 14, paddingBottom: 48, gap: 10 },

  scoreCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center',
  },
  scoreLabel:  { color: COLORS.silver, fontSize: 8, letterSpacing: 2, marginBottom: 6 },
  scoreNumber: { fontSize: 62, fontWeight: '500', lineHeight: 66 },
  scoreTier:   { fontSize: 12, fontStyle: 'italic', marginBottom: 12 },
  barTrack: {
    width: '100%', height: 4, backgroundColor: COLORS.elevated,
    borderRadius: 100, overflow: 'hidden',
  },
  barFill:  { height: '100%', borderRadius: 100 },

  warningCard: {
    backgroundColor: 'rgba(220,38,38,0.06)', borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)', borderRadius: RADIUS.md, padding: 12,
  },
  warningText: { color: COLORS.crimson, fontSize: 11, lineHeight: 18, fontStyle: 'italic' },

  dilCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderLeftWidth: 3,
    borderLeftColor: COLORS.emerald, borderRadius: RADIUS.md, padding: 13,
  },
  dilHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dilDot:    { width: 5, height: 5, backgroundColor: COLORS.emerald, borderRadius: 3 },
  dilName:   { color: COLORS.emeraldText, fontSize: 8, letterSpacing: 2 },
  dilText:   { color: COLORS.silver, fontSize: 12.5, lineHeight: 20, fontStyle: 'italic' },

  card: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13,
  },
  cardLabel: { color: COLORS.silver, fontSize: 7.5, letterSpacing: 1.8, marginBottom: 10 },

  componentLine: { color: COLORS.silver, fontSize: 12, lineHeight: 22 },

  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriItem: {
    flex: 1, minWidth: '18%', backgroundColor: COLORS.elevated,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, padding: 8, alignItems: 'center',
  },
  nutriVal:   { color: COLORS.emeraldText, fontSize: 15, lineHeight: 19 },
  nutriLabel: { color: COLORS.silver, fontSize: 8, marginTop: 2, letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  scanAgainBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 13, alignItems: 'center',
    backgroundColor: COLORS.elevated,
  },
  scanAgainText: { color: COLORS.silver, fontSize: 11, letterSpacing: 1 },
  saveBtn: {
    flex: 2, backgroundColor: COLORS.emeraldDeep,
    borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.md, padding: 13, alignItems: 'center',
  },
  saveBtnDone:  { backgroundColor: COLORS.elevated, borderColor: COLORS.border },
  saveBtnText:  { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },
});
