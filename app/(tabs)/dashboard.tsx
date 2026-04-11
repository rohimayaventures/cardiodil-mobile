import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { getTodayHealthData } from '../../src/lib/healthkit';
import { ExerciseType, StressLevel, SleepQuality, HealthKitReading } from '../../src/types';

// Dashboard + Quick Log — CardioDil AI
// Biometrics auto-read from HealthKit and Circul ring on mount
// Every field has manual override
// Supabase save and real auth wired in a later prompt
// Log All awards 120 Dil XP (persisted in later prompt)

const EXERCISE_TYPES: { key: ExerciseType; label: string }[] = [
  { key: 'walk',  label: 'Walk'  },
  { key: 'run',   label: 'Run'   },
  { key: 'cycle', label: 'Cycle' },
  { key: 'swim',  label: 'Swim'  },
  { key: 'gym',   label: 'Gym'   },
  { key: 'other', label: 'Other' },
];

const SLEEP_OPTIONS: { key: SleepQuality; label: string }[] = [
  { key: 'poor',  label: 'Poor'  },
  { key: 'fair',  label: 'Fair'  },
  { key: 'good',  label: 'Good'  },
  { key: 'great', label: 'Great' },
];

interface QuickLogState {
  exerciseType: ExerciseType;
  exerciseMinutes: string;
  exerciseIntensity: number;
  stressLevel: StressLevel;
  systolic: string;
  diastolic: string;
  heartRate: string;
  sleepQuality: SleepQuality;
  stepsConfirmed: boolean;
}

function SourceBadge({ source }: { source: string }) {
  const isAuto = source === 'healthkit' || source === 'circul';
  return (
    <Text style={{ color: isAuto ? COLORS.emeraldText : COLORS.silver, fontSize: 9, fontStyle: 'italic', marginTop: 2 }}>
      {isAuto ? '\u21bb auto' : 'manual'}
    </Text>
  );
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const [bpm, setBpm] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [spo2, setSpo2] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [hrv, setHrv] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [sleepHours, setSleepHours] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [steps, setSteps] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [systolicAuto, setSystolicAuto] = useState<HealthKitReading>({ value: 0, source: 'manual' });
  const [diastolicAuto, setDiastolicAuto] = useState<HealthKitReading>({ value: 0, source: 'manual' });

  const [quickLog, setQuickLog] = useState<QuickLogState>({
    exerciseType: 'walk',
    exerciseMinutes: '30',
    exerciseIntensity: 3,
    stressLevel: 3,
    systolic: '',
    diastolic: '',
    heartRate: '',
    sleepQuality: 'good',
    stepsConfirmed: false,
  });

  // Mock dashboard values — replaced by real Supabase queries in later prompt
  const heartScore = 78;
  const weeklyMealAvg = 79;
  const ldl = 142;
  const dilXP = 2340;
  const dilXPMax = 3000;
  const phoenixDay = 18;
  const streakDays = 18;
  const dilMessage =
    'Your HRV climbed this morning. The salmon you logged Wednesday may be part of the story. What are you having for breakfast?';

  const loadHealthData = useCallback(async () => {
    try {
      const data = await getTodayHealthData();
      setBpm(data.bpm);
      setSpo2(data.spo2);
      setHrv(data.hrv);
      setSleepHours(data.sleepHours);
      setSteps(data.steps);
      setSystolicAuto(data.systolic);
      setDiastolicAuto(data.diastolic);
      setQuickLog((prev) => ({
        ...prev,
        systolic: data.systolic.value > 0 ? String(data.systolic.value) : prev.systolic,
        diastolic: data.diastolic.value > 0 ? String(data.diastolic.value) : prev.diastolic,
        heartRate: data.bpm.value > 0 ? String(data.bpm.value) : prev.heartRate,
      }));
    } catch (e) {
      console.warn('[Dashboard] Health data load failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHealthData(); }, [loadHealthData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHealthData();
  }, [loadHealthData]);

  function handleLogAll() {
    // Supabase save wired in auth prompt
    Alert.alert(
      'Logged',
      '+120 Dil XP earned. Phoenix Cycle Day ' + (phoenixDay + 1) + '.',
      [{ text: 'OK' }]
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.emerald} />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Dashboard</Text>
          <Text style={s.headerDate}>{today}</Text>
        </View>
        <TouchableOpacity
          style={s.infoBtn}
          onPress={() => router.push('/explanations')}
        >
          <Text style={s.infoBtnText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Heart Score Hero */}
      <View style={s.card}>
        <Text style={s.cardLabel}>HEART SCORE TODAY</Text>
        <View style={s.scoreRow}>
          <Text style={s.scoreNumber}>{heartScore}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.scoreTrend}>Good, trending up ↑</Text>
            <Text style={s.scoreStreak}>
              Day streak: <Text style={{ color: COLORS.emeraldText }}>{streakDays}</Text>
            </Text>
          </View>
          <View style={s.phoenixBadge}>
            <Text style={s.phoenixText}>Day {phoenixDay}</Text>
          </View>
        </View>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${heartScore}%` as any }]} />
        </View>
      </View>

      {/* 4-Metric Grid */}
      <View style={s.grid}>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>LDL</Text>
          <Text style={[s.metricVal, { color: COLORS.crimson }]}>{ldl}</Text>
          <Text style={s.metricUnit}>mg/dL</Text>
          <Text style={[s.metricNote, { color: COLORS.crimson }]}>Above target</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>BLOOD PRESSURE</Text>
          <Text style={s.metricVal}>
            {systolicAuto.value > 0 ? `${systolicAuto.value}/${diastolicAuto.value}` : '--/--'}
          </Text>
          <SourceBadge source={systolicAuto.source} />
          <Text style={[s.metricNote, { color: COLORS.emeraldText }]}>Normal</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>HRV (SDNN)</Text>
          <Text style={s.metricVal}>{hrv.value > 0 ? hrv.value : '--'}</Text>
          <Text style={s.metricUnit}>ms</Text>
          <SourceBadge source={hrv.source} />
        </View>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>7-DAY MEAL AVG</Text>
          <Text style={[s.metricVal, { color: COLORS.gold }]}>{weeklyMealAvg}</Text>
          <Text style={s.metricUnit}>/100</Text>
          <Text style={[s.metricNote, { color: COLORS.silver }]}>4 meals logged</Text>
        </View>
      </View>

      {/* Dil Message */}
      <View style={s.dilCard}>
        <View style={s.dilHeader}>
          <View style={s.dilDot} />
          <Text style={s.dilName}>DIL</Text>
        </View>
        <Text style={s.dilText}>{dilMessage}</Text>
        <Text style={s.cite}>Rohimaya Health AI · {today}</Text>
      </View>

      {/* Dil XP */}
      <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardLabel}>DIL XP</Text>
          <Text style={{ color: COLORS.emeraldText, fontSize: 13, marginBottom: 6 }}>
            {dilXP.toLocaleString()} / {dilXPMax.toLocaleString()}
          </Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${Math.round((dilXP / dilXPMax) * 100)}%` as any, backgroundColor: COLORS.emerald }]} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 12 }}>
          <Text style={{ color: COLORS.silver, fontSize: 9, fontStyle: 'italic' }}>Phoenix Cycle</Text>
          <Text style={{ color: COLORS.gold, fontSize: 13, marginTop: 2 }}>Day {phoenixDay} of 30</Text>
          <Text style={{ color: 'rgba(201,168,76,0.5)', fontSize: 7.5, letterSpacing: 1, marginTop: 1 }}>Ascending</Text>
        </View>
      </View>

      {/* Quick Log Divider */}
      <View style={s.dividerRow}>
        <Text style={s.dividerLabel}>QUICK LOG</Text>
        <View style={s.dividerLine} />
        <Text style={{ color: COLORS.emeraldText, fontSize: 8, letterSpacing: 1 }}>Today</Text>
      </View>

      {/* Exercise */}
      <View style={s.card}>
        <Text style={s.cardLabel}>EXERCISE</Text>
        <View style={s.chipRow}>
          {EXERCISE_TYPES.map((ex) => (
            <TouchableOpacity
              key={ex.key}
              style={[s.chip, quickLog.exerciseType === ex.key && s.chipOn]}
              onPress={() => setQuickLog((p) => ({ ...p, exerciseType: ex.key }))}
            >
              <Text style={[s.chipText, quickLog.exerciseType === ex.key && s.chipTextOn]}>
                {ex.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>DURATION</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.inputNum}
                value={quickLog.exerciseMinutes}
                onChangeText={(v) => setQuickLog((p) => ({ ...p, exerciseMinutes: v }))}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor={COLORS.silver}
              />
              <Text style={s.inputUnit}>min</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>INTENSITY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4, height: 32 }}>
              {[1, 2, 3, 4, 5].map((lv) => (
                <TouchableOpacity
                  key={lv}
                  style={{ flex: 1 }}
                  onPress={() => setQuickLog((p) => ({ ...p, exerciseIntensity: lv }))}
                >
                  <View style={[
                    { height: 8 + lv * 4, borderRadius: 3 },
                    lv <= quickLog.exerciseIntensity
                      ? { backgroundColor: COLORS.emerald }
                      : { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border },
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: COLORS.silver, fontSize: 9, fontStyle: 'italic', marginTop: 3, textAlign: 'center' }}>
              {quickLog.exerciseIntensity <= 2 ? 'Light' : quickLog.exerciseIntensity === 3 ? 'Moderate' : 'Hard'}
            </Text>
          </View>
        </View>
      </View>

      {/* Steps */}
      <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={s.cardLabel}>STEPS TODAY</Text>
          <Text style={{ color: COLORS.emeraldText, fontSize: 22 }}>
            {steps.value > 0 ? steps.value.toLocaleString() : '0'}
          </Text>
          <Text style={{ color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic', marginTop: 2 }}>
            {steps.source !== 'manual' ? 'Apple Health · auto-read' : 'Manual entry'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.chip, quickLog.stepsConfirmed && s.chipOn]}
          onPress={() => setQuickLog((p) => ({ ...p, stepsConfirmed: true }))}
        >
          <Text style={[s.chipText, quickLog.stepsConfirmed && s.chipTextOn]}>
            {quickLog.stepsConfirmed ? 'Confirmed \u2713' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stress Level */}
      <View style={s.card}>
        <Text style={s.cardLabel}>STRESS LEVEL</Text>
        <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
          {([1, 2, 3, 4, 5] as StressLevel[]).map((lv) => (
            <TouchableOpacity
              key={lv}
              style={[s.stressBtn, quickLog.stressLevel === lv && s.chipOn]}
              onPress={() => setQuickLog((p) => ({ ...p, stressLevel: lv }))}
            >
              <Text style={[{ color: COLORS.silver, fontSize: 15 }, quickLog.stressLevel === lv && { color: COLORS.emeraldText }]}>
                {lv}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic' }}>Calm</Text>
          <Text style={{ color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic' }}>High</Text>
        </View>
      </View>

      {/* BP + HR */}
      <View style={s.grid}>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>BLOOD PRESSURE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
            <TextInput
              style={s.bpInput}
              value={quickLog.systolic}
              onChangeText={(v) => setQuickLog((p) => ({ ...p, systolic: v }))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="120"
              placeholderTextColor={COLORS.silver}
            />
            <Text style={{ color: COLORS.silver, fontSize: 14 }}>/</Text>
            <TextInput
              style={s.bpInput}
              value={quickLog.diastolic}
              onChangeText={(v) => setQuickLog((p) => ({ ...p, diastolic: v }))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="80"
              placeholderTextColor={COLORS.silver}
            />
          </View>
          {systolicAuto.source !== 'manual' && (
            <Text style={{ color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic', marginTop: 3 }}>
              Auto-read · override above
            </Text>
          )}
        </View>
        <View style={s.metricCard}>
          <Text style={s.cardLabel}>HEART RATE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 5 }}>
            <TextInput
              style={s.hrInput}
              value={quickLog.heartRate}
              onChangeText={(v) => setQuickLog((p) => ({ ...p, heartRate: v }))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="68"
              placeholderTextColor={COLORS.silver}
            />
            <Text style={{ color: COLORS.silver, fontSize: 9, letterSpacing: 1 }}>bpm</Text>
          </View>
          {bpm.source !== 'manual' && (
            <Text style={{ color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic', marginTop: 3 }}>
              Auto-read · override above
            </Text>
          )}
        </View>
      </View>

      {/* Sleep Quality Override */}
      <View style={s.card}>
        <Text style={s.cardLabel}>SLEEP QUALITY OVERRIDE</Text>
        <Text style={{ color: 'rgba(148,163,184,0.55)', fontSize: 11, fontStyle: 'italic', marginBottom: 9 }}>
          Circul ring logged {sleepHours.value > 0 ? sleepHours.value : '--'}h. How did you actually feel?
        </Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {SLEEP_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[s.sleepChip, quickLog.sleepQuality === opt.key && s.chipOn]}
              onPress={() => setQuickLog((p) => ({ ...p, sleepQuality: opt.key }))}
            >
              <Text style={[s.chipText, quickLog.sleepQuality === opt.key && s.chipTextOn]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Log All */}
      <TouchableOpacity style={s.logBtn} onPress={handleLogAll}>
        <Text style={s.logBtnText}>Log All · +120 Dil XP</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2 },
  headerDate: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic' },

  card: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10 },
  cardLabel: { color: COLORS.silver, fontSize: 7.5, letterSpacing: 1.8, marginBottom: 4 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  scoreNumber: { color: COLORS.gold, fontSize: 54, fontWeight: '500', lineHeight: 58 },
  scoreTrend: { color: COLORS.emeraldText, fontSize: 12, fontStyle: 'italic' },
  scoreStreak: { color: COLORS.silver, fontSize: 11, marginTop: 2 },
  phoenixBadge: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  phoenixText: { color: COLORS.gold, fontSize: 8, letterSpacing: 1 },
  barTrack: { height: 4, backgroundColor: COLORS.elevated, borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.emeraldDeep, borderRadius: 100 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 11 },
  metricVal: { color: COLORS.emeraldText, fontSize: 22, lineHeight: 26 },
  metricUnit: { color: COLORS.silver, fontSize: 10, marginTop: 1 },
  metricNote: { fontSize: 10, fontStyle: 'italic', marginTop: 2 },

  dilCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.emerald, borderRadius: RADIUS.md, padding: 13, marginBottom: 10 },
  dilHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dilDot: { width: 5, height: 5, backgroundColor: COLORS.emerald, borderRadius: 3 },
  dilName: { color: COLORS.emeraldText, fontSize: 8, letterSpacing: 2 },
  dilText: { color: COLORS.silver, fontSize: 12.5, lineHeight: 20, fontStyle: 'italic' },
  cite: { color: 'rgba(148,163,184,0.4)', fontSize: 8, marginTop: 5, letterSpacing: 0.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  dividerLabel: { color: COLORS.silver, fontSize: 8.5, letterSpacing: 1.8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 },
  chip: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5 },
  chipOn: { borderColor: COLORS.emerald, backgroundColor: 'rgba(34,197,94,0.08)' },
  chipText: { color: COLORS.silver, fontSize: 7.5, letterSpacing: 1 },
  chipTextOn: { color: COLORS.emeraldText },

  inputBox: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  inputNum: { color: COLORS.emeraldText, fontSize: 18, flex: 1 },
  inputUnit: { color: COLORS.silver, fontSize: 9, letterSpacing: 1 },

  stressBtn: { flex: 1, backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: 'center' },

  bpInput: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: 5, color: COLORS.emeraldText, fontSize: 16, textAlign: 'center', width: 52 },
  hrInput: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: 5, color: COLORS.emeraldText, fontSize: 20, textAlign: 'center', width: 70 },

  sleepChip: { flex: 1, backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: 'center' },

  logBtn: { backgroundColor: COLORS.emeraldDeep, borderWidth: 1, borderColor: COLORS.emerald, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  logBtnText: { color: COLORS.emeraldText, fontSize: 10, letterSpacing: 1.5 },
  infoBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    color: COLORS.silver,
    fontSize: 13,
    lineHeight: 16,
  },
});
