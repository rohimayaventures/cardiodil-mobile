import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { getRecentLabs, getLatestInsight } from '../../src/lib/supabase';
import { LAB_EXPLANATIONS } from '../../src/constants/scoreExplanations';

// Lab Vault / Trends Screen — CardioDil AI
// LDL trend chart built with react-native-svg
// All lab data from Supabase lab_results table
// Weekly insight narrative from Dil via weekly_insights table
// ? button opens score explanations modal at Labs section

const CHART_WIDTH  = 320;
const CHART_HEIGHT = 110;
const CHART_PAD    = { top: 12, right: 20, bottom: 28, left: 42 };

interface LabPoint {
  date: string;
  ldl: number;
  hdl?: number;
  apob?: number;
  hscrp?: number;
  triglycerides?: number;
}

function ldlColor(value: number): string {
  if (value < 70)  return COLORS.emerald;
  if (value < 100) return COLORS.emeraldText;
  if (value < 130) return COLORS.silver;
  if (value < 160) return COLORS.crimson;
  return COLORS.blood;
}

function hscrpColor(value: number): string {
  if (value < 1.0) return COLORS.emerald;
  if (value < 3.0) return COLORS.silver;
  return COLORS.crimson;
}

function LDLChart({ points }: { points: LabPoint[] }) {
  if (points.length < 2) {
    return (
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: COLORS.silver, fontSize: 12, fontStyle: 'italic' }}>
          Log at least 2 lab draws to see your trend.
        </Text>
      </View>
    );
  }

  const ldlValues = points.map((p) => p.ldl);
  const minVal = Math.min(...ldlValues) - 10;
  const maxVal = Math.max(...ldlValues) + 10;
  const innerW  = CHART_WIDTH  - CHART_PAD.left - CHART_PAD.right;
  const innerH  = CHART_HEIGHT - CHART_PAD.top  - CHART_PAD.bottom;

  function xPos(i: number): number {
    return CHART_PAD.left + (i / (points.length - 1)) * innerW;
  }

  function yPos(val: number): number {
    return CHART_PAD.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.ldl)}`)
    .join(' ');

  const areaD =
    pathD +
    ` L ${xPos(points.length - 1)} ${CHART_PAD.top + innerH}` +
    ` L ${xPos(0)} ${CHART_PAD.top + innerH} Z`;

  const trendUp = points[points.length - 1].ldl > points[0].ldl;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="ldlArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={trendUp ? COLORS.crimson : COLORS.emerald} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={trendUp ? COLORS.crimson : COLORS.emerald} stopOpacity={0}    />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {[0, 0.33, 0.66, 1].map((t, i) => {
        const y = CHART_PAD.top + innerH * t;
        const val = Math.round(maxVal - t * (maxVal - minVal));
        return (
          <React.Fragment key={i}>
            <Line
              x1={CHART_PAD.left} y1={y}
              x2={CHART_PAD.left + innerW} y2={y}
              stroke={COLORS.border} strokeWidth={0.8}
            />
            <SvgText
              x={CHART_PAD.left - 6} y={y + 4}
              fontSize={8} fill={COLORS.silver}
              textAnchor="end"
            >
              {val}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Area fill */}
      <Path d={areaD} fill="url(#ldlArea)" />

      {/* Trend line */}
      <Path
        d={pathD}
        fill="none"
        stroke={trendUp ? COLORS.crimson : COLORS.emerald}
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle
            cx={xPos(i)} cy={yPos(p.ldl)}
            r={4}
            fill={ldlColor(p.ldl)}
          />
          <SvgText
            x={xPos(i)} y={CHART_PAD.top + innerH + 16}
            fontSize={7.5} fill={COLORS.silver}
            textAnchor="middle"
          >
            {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

function LabValueCard({
  label, value, unit, color, note,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  note?: string;
}) {
  return (
    <View style={s.labCard}>
      <Text style={s.labCardLabel}>{label}</Text>
      <Text style={[s.labCardValue, { color }]}>{value}</Text>
      <Text style={s.labCardUnit}>{unit}</Text>
      {note && <Text style={[s.labCardNote, { color }]}>{note}</Text>}
    </View>
  );
}

export default function LabsScreen() {
  const { userId, signedIn } = useAuth();
  const [refreshing, setRefreshing]   = useState(false);
  const [chartPoints, setChartPoints] = useState<LabPoint[]>([]);
  const [latestLab, setLatestLab]     = useState<any>(null);
  const [insight, setInsight]         = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [labs, weeklyInsight] = await Promise.all([
        getRecentLabs(userId, 5),
        getLatestInsight(userId),
      ]);

      if (labs.length > 0) {
        setLatestLab(labs[0]);
        setChartPoints(
          [...labs]
            .reverse()
            .filter((l: any) => l.ldl !== null)
            .map((l: any) => ({
              date: l.drawn_at,
              ldl:  l.ldl,
              hdl:  l.hdl ?? undefined,
              apob: l.apob ?? undefined,
              hscrp: l.hscrp ?? undefined,
              triglycerides: l.triglycerides ?? undefined,
            }))
        );
      }

      setInsight(weeklyInsight);
    } catch (e) {
      console.warn('[Labs] Load failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (!signedIn) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centeredState}>
          <Text style={s.centeredTitle}>Lab Vault</Text>
          <Text style={s.centeredText}>Sign in to view your lab results.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ldl  = latestLab?.ldl;
  const hdl  = latestLab?.hdl;
  const apob = latestLab?.apob;
  const hscrp = latestLab?.hscrp;
  const trig = latestLab?.triglycerides;
  const drawnAt = latestLab?.drawn_at
    ? new Date(latestLab.drawn_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  // Detect LDL trend label
  let trendLabel = '';
  let trendColor: string = COLORS.silver;
  if (chartPoints.length >= 2) {
    const first = chartPoints[0].ldl;
    const last  = chartPoints[chartPoints.length - 1].ldl;
    const diff  = last - first;
    if (diff > 5)        { trendLabel = `↑ +${diff.toFixed(0)} since first draw`; trendColor = COLORS.crimson; }
    else if (diff < -5)  { trendLabel = `↓ ${diff.toFixed(0)} since first draw`;  trendColor = COLORS.emeraldText; }
    else                 { trendLabel = 'Stable across draws'; trendColor = COLORS.silver; }
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.emerald} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Lab Vault</Text>
            {drawnAt && <Text style={s.headerSub}>Last draw: {drawnAt}</Text>}
          </View>
          <TouchableOpacity
            style={s.infoBtn}
            onPress={() => router.push('/explanations')}
          >
            <Text style={s.infoBtnText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* LDL Trend Chart */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardLabel}>LDL TREND</Text>
            {trendLabel !== '' && (
              <Text style={[s.trendTag, { color: trendColor }]}>{trendLabel}</Text>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LDLChart points={chartPoints} />
          </ScrollView>
        </View>

        {/* Lab Values Grid */}
        {latestLab ? (
          <View>
            <View style={s.dividerRow}>
              <Text style={s.dividerLabel}>LATEST VALUES</Text>
              <View style={s.dividerLine} />
            </View>
            <View style={s.labGrid}>
              <LabValueCard
                label="LDL"
                value={ldl !== null && ldl !== undefined ? String(ldl) : '--'}
                unit="mg/dL"
                color={ldl !== undefined ? ldlColor(ldl) : COLORS.silver}
                note={ldl !== undefined && ldl >= 130 ? 'Above target' : ldl !== undefined && ldl < 70 ? 'Optimal' : undefined}
              />
              <LabValueCard
                label="HDL"
                value={hdl !== null && hdl !== undefined ? String(hdl) : '--'}
                unit="mg/dL"
                color={hdl !== undefined && hdl >= 60 ? COLORS.emeraldText : COLORS.silver}
              />
              <LabValueCard
                label="ApoB"
                value={apob !== null && apob !== undefined ? String(apob) : '--'}
                unit="mg/dL"
                color={apob !== undefined && apob >= 100 ? COLORS.crimson : COLORS.silver}
              />
              <LabValueCard
                label="hsCRP"
                value={hscrp !== null && hscrp !== undefined ? String(hscrp) : '--'}
                unit="mg/L"
                color={hscrp !== undefined ? hscrpColor(hscrp) : COLORS.silver}
                note={hscrp !== undefined && hscrp >= 3.0 ? 'High risk' : undefined}
              />
              <LabValueCard
                label="Triglycerides"
                value={trig !== null && trig !== undefined ? String(trig) : '--'}
                unit="mg/dL"
                color={trig !== undefined && trig >= 150 ? COLORS.crimson : COLORS.silver}
              />
            </View>
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No lab results yet</Text>
            <Text style={s.emptyText}>
              Upload your most recent lipid panel to start tracking your LDL trend.
            </Text>
            <TouchableOpacity
              style={s.uploadBtn}
              onPress={() => Alert.alert('Coming soon', 'Lab PDF upload is coming in the next update.')}
            >
              <Text style={s.uploadBtnText}>Upload Lab Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Insight */}
        {insight ? (
          <View>
            <View style={s.dividerRow}>
              <Text style={s.dividerLabel}>WEEKLY INSIGHT</Text>
              <View style={s.dividerLine} />
            </View>
            <View style={s.insightCard}>
              <View style={s.insightHeader}>
                <View style={s.dilDot} />
                <Text style={s.dilLabel}>DIL</Text>
              </View>
              <Text style={s.insightText}>{insight.narrative}</Text>
              {insight.focus_area && (
                <Text style={s.focusArea}>Focus area: {insight.focus_area}</Text>
              )}
              <Text style={s.cite}>
                Rohimaya Health AI · {
                  new Date(insight.week_start).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={s.insightEmpty}>
            <Text style={s.emptyText}>
              Dil will generate your first weekly insight after you log meals and biometrics for a few days.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content:   { padding: 16, paddingTop: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2 },
  headerSub:   { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  infoBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  infoBtnText: { color: COLORS.silver, fontSize: 13 },

  card: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  cardLabel: { color: COLORS.silver, fontSize: 8, letterSpacing: 1.8 },
  trendTag:  { fontSize: 10, fontStyle: 'italic' },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10, marginTop: 4,
  },
  dividerLabel: { color: COLORS.silver, fontSize: 8, letterSpacing: 1.8 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },

  labGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  labCard: {
    flex: 1, minWidth: '28%',
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 11, alignItems: 'center',
  },
  labCardLabel: { color: COLORS.silver, fontSize: 7.5, letterSpacing: 1.5, marginBottom: 4 },
  labCardValue: { fontSize: 20, lineHeight: 24 },
  labCardUnit:  { color: COLORS.silver, fontSize: 9, marginTop: 1 },
  labCardNote:  { fontSize: 9, fontStyle: 'italic', marginTop: 3 },

  insightCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderLeftWidth: 3,
    borderLeftColor: COLORS.emeraldDeep, borderRadius: RADIUS.md,
    padding: 14, marginBottom: 12,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dilDot:  { width: 5, height: 5, backgroundColor: COLORS.emerald, borderRadius: 3 },
  dilLabel: { color: COLORS.emeraldText, fontSize: 8, letterSpacing: 2 },
  insightText: { color: COLORS.silver, fontSize: 12.5, lineHeight: 20, fontStyle: 'italic' },
  focusArea: { color: COLORS.emeraldText, fontSize: 10, marginTop: 8, fontStyle: 'italic' },
  cite: { color: 'rgba(148,163,184,0.35)', fontSize: 8, marginTop: 6, letterSpacing: 0.5 },

  insightEmpty: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 14, marginBottom: 12,
  },

  emptyState: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: 20, alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { color: COLORS.emeraldText, fontSize: 13, marginBottom: 6, letterSpacing: 1 },
  emptyText:  { color: COLORS.silver, fontSize: 12, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },
  uploadBtn: {
    marginTop: 14, borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 8,
  },
  uploadBtnText: { color: COLORS.emeraldText, fontSize: 10, letterSpacing: 1 },

  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centeredTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2, marginBottom: 8 },
  centeredText:  { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
});
