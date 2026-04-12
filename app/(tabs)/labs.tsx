import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { getRecentLabs, getLatestInsight } from '../../src/lib/supabase';

// Lab Vault — CardioDil AI
// Supports: Lipid, Advanced Cardiac, CBC, CMP, BMP, HbA1c, Thyroid, Vitamins
// Trend chart marker is user-selectable via chip row
// Lab frequency is irregular — always show draw date prominently
// Manual entry via Add Labs modal screen

const CHART_WIDTH  = 320;
const CHART_HEIGHT = 120;
const CHART_PAD    = { top: 14, right: 20, bottom: 30, left: 44 };

// Trendable markers the user can select
type TrendMarker =
  | 'ldl' | 'hdl' | 'apob' | 'hscrp' | 'triglycerides'
  | 'a1c' | 'egfr' | 'hemoglobin' | 'tsh' | 'lp_a' | 'vitamin_d';

const TREND_CHIPS: { key: TrendMarker; label: string }[] = [
  { key: 'ldl',         label: 'LDL'        },
  { key: 'hdl',         label: 'HDL'        },
  { key: 'apob',        label: 'ApoB'       },
  { key: 'hscrp',       label: 'hsCRP'      },
  { key: 'triglycerides', label: 'Trig'     },
  { key: 'a1c',         label: 'HbA1c'      },
  { key: 'egfr',        label: 'eGFR'       },
  { key: 'hemoglobin',  label: 'Hgb'        },
  { key: 'lp_a',        label: 'Lp(a)'      },
  { key: 'tsh',         label: 'TSH'        },
  { key: 'vitamin_d',   label: 'Vit D'      },
];

// Clinical color helpers
function markerColor(key: TrendMarker, value: number): string {
  switch (key) {
    case 'ldl':
      if (value < 70)  return COLORS.emerald;
      if (value < 100) return COLORS.emeraldText;
      if (value < 130) return COLORS.silver;
      return COLORS.crimson;
    case 'hdl':
      return value >= 60 ? COLORS.emerald : value >= 40 ? COLORS.silver : COLORS.crimson;
    case 'hscrp':
      return value < 1.0 ? COLORS.emerald : value < 3.0 ? COLORS.silver : COLORS.crimson;
    case 'a1c':
      return value < 5.7 ? COLORS.emerald : value < 6.5 ? COLORS.silver : COLORS.crimson;
    case 'egfr':
      return value >= 90 ? COLORS.emerald : value >= 60 ? COLORS.silver : COLORS.crimson;
    case 'tsh':
      return value >= 0.4 && value <= 4.0 ? COLORS.emeraldText : COLORS.crimson;
    case 'vitamin_d':
      return value >= 30 ? COLORS.emerald : value >= 20 ? COLORS.silver : COLORS.crimson;
    default:
      return COLORS.emeraldText;
  }
}

function TrendChart({
  points,
  marker,
}: {
  points: { date: string; value: number }[];
  marker: TrendMarker;
}) {
  if (points.length < 2) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: COLORS.silver, fontSize: 12, fontStyle: 'italic' }}>
          Log at least 2 draws to see a trend.
        </Text>
      </View>
    );
  }

  const vals   = points.map((p) => p.value);
  const minVal = Math.min(...vals) - Math.max(5, Math.min(...vals) * 0.08);
  const maxVal = Math.max(...vals) + Math.max(5, Math.max(...vals) * 0.08);
  const innerW = CHART_WIDTH  - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_HEIGHT - CHART_PAD.top  - CHART_PAD.bottom;

  const xPos = (i: number) =>
    CHART_PAD.left + (i / (points.length - 1)) * innerW;
  const yPos = (v: number) =>
    CHART_PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const pathD   = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.value)}`).join(' ');
  const areaD   = pathD + ` L ${xPos(points.length - 1)} ${CHART_PAD.top + innerH} L ${xPos(0)} ${CHART_PAD.top + innerH} Z`;
  const trendUp = points[points.length - 1].value > points[0].value;

  // For HDL and eGFR, rising is good — invert color logic
  const risingIsGood = marker === 'hdl' || marker === 'egfr' || marker === 'hemoglobin' || marker === 'vitamin_d';
  const lineColor = trendUp
    ? risingIsGood ? COLORS.emerald : COLORS.crimson
    : risingIsGood ? COLORS.crimson : COLORS.emerald;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={lineColor} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={lineColor} stopOpacity={0}   />
        </LinearGradient>
      </Defs>
      {[0, 0.33, 0.66, 1].map((t, i) => {
        const y   = CHART_PAD.top + innerH * t;
        const val = (maxVal - t * (maxVal - minVal)).toFixed(marker === 'a1c' || marker === 'tsh' ? 1 : 0);
        return (
          <React.Fragment key={i}>
            <Line x1={CHART_PAD.left} y1={y} x2={CHART_PAD.left + innerW} y2={y}
              stroke={COLORS.border} strokeWidth={0.8} />
            <SvgText x={CHART_PAD.left - 6} y={y + 4}
              fontSize={8} fill={COLORS.silver} textAnchor="end">{val}</SvgText>
          </React.Fragment>
        );
      })}
      <Path d={areaD} fill="url(#area)" />
      <Path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={xPos(i)} cy={yPos(p.value)} r={4}
            fill={markerColor(marker, p.value)} />
          <SvgText x={xPos(i)} y={CHART_PAD.top + innerH + 16}
            fontSize={7} fill={COLORS.silver} textAnchor="middle">
            {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

function LabValue({
  label, value, unit, color, note, drawnAt,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  note?: string;
  drawnAt?: string;
}) {
  const dateLabel = drawnAt
    ? new Date(drawnAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    : null;
  return (
    <View style={s.labVal}>
      <Text style={s.labValLabel}>{label}</Text>
      <Text style={[s.labValNum, { color }]}>{value}</Text>
      <Text style={s.labValUnit}>{unit}</Text>
      {note     && <Text style={[s.labValNote, { color }]}>{note}</Text>}
      {dateLabel && <Text style={s.labValDate}>{dateLabel}</Text>}
    </View>
  );
}

function PanelSection({
  title, children, hasData,
}: {
  title: string;
  children: React.ReactNode;
  hasData: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={s.panelSection}>
      <TouchableOpacity style={s.panelHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={s.panelTitle}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!hasData && <Text style={s.noDataTag}>No data</Text>}
          <Text style={s.panelChevron}>{open ? '▲' : '▽'}</Text>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={s.panelGrid}>
          {hasData ? children : (
            <Text style={s.noDataText}>
              No results yet. Tap Add Labs to enter values.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function fmt(v: unknown, decimals = 0): string {
  if (v === null || v === undefined) return '--';
  return Number(v).toFixed(decimals);
}

export default function LabsScreen() {
  const { userId, signedIn } = useAuth();

  const [refreshing, setRefreshing]   = useState(false);
  const [trendMarker, setTrendMarker] = useState<TrendMarker>('ldl');
  const [labs, setLabs]               = useState<Record<string, unknown>[]>([]);
  const [insight, setInsight]         = useState<Record<string, unknown> | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [labData, weeklyInsight] = await Promise.all([
        getRecentLabs(userId, 10),
        getLatestInsight(userId),
      ]);
      setLabs((labData ?? []) as Record<string, unknown>[]);
      setInsight(weeklyInsight as Record<string, unknown> | null);
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

  // Build trend chart points for selected marker
  const trendPoints = [...labs]
    .reverse()
    .filter((l) => l[trendMarker] !== null && l[trendMarker] !== undefined)
    .map((l) => ({ date: String(l.drawn_at), value: Number(l[trendMarker]) }));

  // Latest draw that has each field
  function latest(field: string) {
    return labs.find((l) => l[field] !== null && l[field] !== undefined);
  }
  function latestVal(field: string): unknown {
    return latest(field)?.[field];
  }
  function latestDate(field: string): string | undefined {
    const d = latest(field)?.drawn_at;
    return d !== undefined && d !== null ? String(d) : undefined;
  }

  // Trend direction label
  let trendLabel = '';
  let trendColor: string = COLORS.silver;
  if (trendPoints.length >= 2) {
    const diff = trendPoints[trendPoints.length - 1].value - trendPoints[0].value;
    const risingIsGood = ['hdl', 'egfr', 'hemoglobin', 'vitamin_d'].includes(trendMarker);
    const good = risingIsGood ? diff > 0 : diff < 0;
    if (Math.abs(diff) > 1) {
      trendLabel = diff > 0 ? `+${diff.toFixed(1)} since first draw` : `${diff.toFixed(1)} since first draw`;
      trendColor = good ? COLORS.emeraldText : COLORS.crimson;
    } else {
      trendLabel = 'Stable';
    }
  }

  if (!signedIn) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={s.centeredTitle}>Lab Vault</Text>
          <Text style={s.centeredText}>Sign in to view your lab results.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const noLabs = labs.length === 0;

  const lv = (field: string) => latestVal(field);
  const num = (field: string) => {
    const v = lv(field);
    return v === null || v === undefined ? undefined : Number(v);
  };

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
            <Text style={s.headerSub}>
              {noLabs ? 'No results yet' : `${labs.length} draw${labs.length !== 1 ? 's' : ''} on file`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-labs')}>
              <Text style={s.addBtnText}>+ Add Labs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.infoBtn} onPress={() => router.push('/explanations')}>
              <Text style={s.infoBtnText}>?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trend Chart */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardLabel}>TREND</Text>
            {trendLabel !== '' && (
              <Text style={[s.trendTag, { color: trendColor }]}>{trendLabel}</Text>
            )}
          </View>

          {/* Marker chip selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 2 }}>
              {TREND_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={[s.chip, trendMarker === chip.key && s.chipOn]}
                  onPress={() => setTrendMarker(chip.key)}
                >
                  <Text style={[s.chipText, trendMarker === chip.key && s.chipTextOn]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TrendChart points={trendPoints} marker={trendMarker} />
          </ScrollView>
        </View>

        {/* Lipid Panel */}
        <PanelSection
          title="Lipid Panel"
          hasData={!!(num('ldl') !== undefined || num('hdl') !== undefined || num('total_cholesterol') !== undefined)}
        >
          <LabValue label="LDL"   value={fmt(lv('ldl'))}               unit="mg/dL" color={num('ldl') !== undefined ? markerColor('ldl', num('ldl')!) : COLORS.silver} note={num('ldl') !== undefined && num('ldl')! >= 130 ? 'Above target' : num('ldl') !== undefined && num('ldl')! < 70 ? 'Optimal' : undefined} drawnAt={latestDate('ldl')} />
          <LabValue label="HDL"   value={fmt(lv('hdl'))}               unit="mg/dL" color={num('hdl') !== undefined ? markerColor('hdl', num('hdl')!) : COLORS.silver} drawnAt={latestDate('hdl')} />
          <LabValue label="Total" value={fmt(lv('total_cholesterol'))}  unit="mg/dL" color={(num('total_cholesterol') ?? 0) >= 200 ? COLORS.crimson : COLORS.silver}               drawnAt={latestDate('total_cholesterol')} />
          <LabValue label="Trig"  value={fmt(lv('triglycerides'))}      unit="mg/dL" color={(num('triglycerides') ?? 0) >= 150 ? COLORS.crimson : COLORS.silver}                   drawnAt={latestDate('triglycerides')} />
          <LabValue label="VLDL"  value={fmt(lv('vldl'))}              unit="mg/dL" color={(num('vldl') ?? 0) >= 30 ? COLORS.crimson : COLORS.silver}                            drawnAt={latestDate('vldl')} />
          <LabValue label="Non-HDL" value={fmt(lv('non_hdl'))}         unit="mg/dL" color={(num('non_hdl') ?? 0) >= 130 ? COLORS.crimson : COLORS.silver}                       drawnAt={latestDate('non_hdl')} />
        </PanelSection>

        {/* Advanced Cardiac */}
        <PanelSection
          title="Advanced Cardiac"
          hasData={!!(num('apob') !== undefined || num('hscrp') !== undefined || num('lp_a') !== undefined || num('homocysteine') !== undefined)}
        >
          <LabValue label="ApoB"         value={fmt(lv('apob'))}        unit="mg/dL" color={(num('apob') ?? 0) >= 100 ? COLORS.crimson : COLORS.emeraldText}    drawnAt={latestDate('apob')} />
          <LabValue label="hsCRP"        value={fmt(lv('hscrp'), 1)}    unit="mg/L"  color={num('hscrp') !== undefined ? markerColor('hscrp', num('hscrp')!) : COLORS.silver} note={num('hscrp') !== undefined && num('hscrp')! >= 3.0 ? 'High risk' : undefined} drawnAt={latestDate('hscrp')} />
          <LabValue label="Lp(a)"        value={fmt(lv('lp_a'))}        unit="mg/dL" color={(num('lp_a') ?? 0) >= 50 ? COLORS.crimson : COLORS.silver}          drawnAt={latestDate('lp_a')} />
          <LabValue label="Homocysteine" value={fmt(lv('homocysteine'), 1)} unit="umol/L" color={(num('homocysteine') ?? 0) >= 15 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('homocysteine')} />
        </PanelSection>

        {/* Metabolic */}
        <PanelSection
          title="Metabolic"
          hasData={!!(num('glucose') !== undefined || num('a1c') !== undefined)}
        >
          <LabValue label="Glucose" value={fmt(lv('glucose'))} unit="mg/dL" color={(num('glucose') ?? 0) >= 100 ? COLORS.crimson : COLORS.emeraldText} drawnAt={latestDate('glucose')} />
          <LabValue label="HbA1c"   value={fmt(lv('a1c'), 1)} unit="%"      color={num('a1c') !== undefined ? markerColor('a1c', num('a1c')!) : COLORS.silver} note={num('a1c') !== undefined && num('a1c')! >= 6.5 ? 'Diabetic range' : num('a1c') !== undefined && num('a1c')! >= 5.7 ? 'Pre-diabetic' : undefined} drawnAt={latestDate('a1c')} />
        </PanelSection>

        {/* Kidney — CMP / BMP */}
        <PanelSection
          title="Kidney Function (CMP / BMP)"
          hasData={!!(num('bun') !== undefined || num('creatinine') !== undefined || num('egfr') !== undefined)}
        >
          <LabValue label="BUN"        value={fmt(lv('bun'))}        unit="mg/dL" color={(num('bun') ?? 0) >= 20 ? COLORS.silver : COLORS.emeraldText}    drawnAt={latestDate('bun')} />
          <LabValue label="Creatinine" value={fmt(lv('creatinine'), 2)} unit="mg/dL" color={(num('creatinine') ?? 0) >= 1.2 ? COLORS.crimson : COLORS.emeraldText} drawnAt={latestDate('creatinine')} />
          <LabValue label="eGFR"       value={fmt(lv('egfr'))}       unit="mL/min" color={num('egfr') !== undefined ? markerColor('egfr', num('egfr')!) : COLORS.silver} note={num('egfr') !== undefined && num('egfr')! < 60 ? 'Below normal' : undefined} drawnAt={latestDate('egfr')} />
        </PanelSection>

        {/* Liver — CMP */}
        <PanelSection
          title="Liver Function (CMP)"
          hasData={!!(num('alt') !== undefined || num('ast') !== undefined || num('alp') !== undefined)}
        >
          <LabValue label="ALT"       value={fmt(lv('alt'))}            unit="U/L"   color={(num('alt') ?? 0) >= 40 ? COLORS.crimson : COLORS.silver}    drawnAt={latestDate('alt')} />
          <LabValue label="AST"       value={fmt(lv('ast'))}            unit="U/L"   color={(num('ast') ?? 0) >= 40 ? COLORS.crimson : COLORS.silver}    drawnAt={latestDate('ast')} />
          <LabValue label="ALP"       value={fmt(lv('alp'))}            unit="U/L"   color={(num('alp') ?? 0) >= 120 ? COLORS.crimson : COLORS.silver}   drawnAt={latestDate('alp')} />
          <LabValue label="T. Bili"   value={fmt(lv('total_bilirubin'), 1)} unit="mg/dL" color={(num('total_bilirubin') ?? 0) >= 1.2 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('total_bilirubin')} />
          <LabValue label="Albumin"   value={fmt(lv('albumin'), 1)}    unit="g/dL"  color={(num('albumin') ?? 0) < 3.5 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('albumin')} />
          <LabValue label="T. Protein" value={fmt(lv('total_protein'), 1)} unit="g/dL" color={COLORS.silver} drawnAt={latestDate('total_protein')} />
        </PanelSection>

        {/* Electrolytes */}
        <PanelSection
          title="Electrolytes (CMP / BMP)"
          hasData={!!(num('sodium') !== undefined || num('potassium') !== undefined || num('chloride') !== undefined)}
        >
          <LabValue label="Sodium"    value={fmt(lv('sodium'))}    unit="mEq/L" color={((num('sodium') ?? 136) < 136 || (num('sodium') ?? 145) > 145) ? COLORS.crimson : COLORS.silver}    drawnAt={latestDate('sodium')} />
          <LabValue label="Potassium" value={fmt(lv('potassium'), 1)} unit="mEq/L" color={((num('potassium') ?? 4) < 3.5 || (num('potassium') ?? 4) > 5.0) ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('potassium')} />
          <LabValue label="Chloride"  value={fmt(lv('chloride'))}  unit="mEq/L" color={COLORS.silver} drawnAt={latestDate('chloride')} />
          <LabValue label="CO2"       value={fmt(lv('co2'))}       unit="mEq/L" color={(num('co2') ?? 22) < 22 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('co2')} />
          <LabValue label="Calcium"   value={fmt(lv('calcium'), 1)} unit="mg/dL" color={((num('calcium') ?? 9) < 8.5 || (num('calcium') ?? 9) > 10.5) ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('calcium')} />
        </PanelSection>

        {/* CBC */}
        <PanelSection
          title="CBC"
          hasData={!!(num('wbc') !== undefined || num('hemoglobin') !== undefined || num('platelets') !== undefined)}
        >
          <LabValue label="WBC"  value={fmt(lv('wbc'), 1)}  unit="K/uL"  color={((num('wbc') ?? 7) < 4 || (num('wbc') ?? 7) > 11) ? COLORS.crimson : COLORS.silver}  drawnAt={latestDate('wbc')} />
          <LabValue label="RBC"  value={fmt(lv('rbc'), 2)}  unit="M/uL"  color={COLORS.silver} drawnAt={latestDate('rbc')} />
          <LabValue label="Hgb"  value={fmt(lv('hemoglobin'), 1)} unit="g/dL"  color={num('hemoglobin') !== undefined ? markerColor('hemoglobin', num('hemoglobin')!) : COLORS.silver} note={num('hemoglobin') !== undefined && num('hemoglobin')! < 12 ? 'Low' : undefined} drawnAt={latestDate('hemoglobin')} />
          <LabValue label="Hct"  value={fmt(lv('hematocrit'), 1)} unit="%"     color={COLORS.silver} drawnAt={latestDate('hematocrit')} />
          <LabValue label="Plt"  value={fmt(lv('platelets'))} unit="K/uL" color={(num('platelets') ?? 200) < 150 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('platelets')} />
        </PanelSection>

        {/* Thyroid */}
        <PanelSection
          title="Thyroid"
          hasData={!!(num('tsh') !== undefined || num('free_t3') !== undefined || num('free_t4') !== undefined)}
        >
          <LabValue label="TSH"    value={fmt(lv('tsh'), 2)}    unit="mIU/L" color={num('tsh') !== undefined ? markerColor('tsh', num('tsh')!) : COLORS.silver} note={num('tsh') !== undefined && num('tsh')! > 4.0 ? 'High' : num('tsh') !== undefined && num('tsh')! < 0.4 ? 'Low' : undefined} drawnAt={latestDate('tsh')} />
          <LabValue label="Free T3" value={fmt(lv('free_t3'), 1)} unit="pg/mL" color={COLORS.silver} drawnAt={latestDate('free_t3')} />
          <LabValue label="Free T4" value={fmt(lv('free_t4'), 2)} unit="ng/dL" color={COLORS.silver} drawnAt={latestDate('free_t4')} />
        </PanelSection>

        {/* Vitamins and Minerals */}
        <PanelSection
          title="Vitamins and Minerals"
          hasData={!!(num('vitamin_d') !== undefined || num('b12') !== undefined || num('ferritin') !== undefined)}
        >
          <LabValue label="Vit D"   value={fmt(lv('vitamin_d'))} unit="ng/mL" color={num('vitamin_d') !== undefined ? markerColor('vitamin_d', num('vitamin_d')!) : COLORS.silver} note={num('vitamin_d') !== undefined && num('vitamin_d')! < 20 ? 'Deficient' : undefined} drawnAt={latestDate('vitamin_d')} />
          <LabValue label="B12"     value={fmt(lv('b12'))}        unit="pg/mL" color={(num('b12') ?? 300) < 200 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('b12')} />
          <LabValue label="Iron"    value={fmt(lv('iron'))}       unit="ug/dL" color={(num('iron') ?? 80) < 60 ? COLORS.crimson : COLORS.silver}  drawnAt={latestDate('iron')} />
          <LabValue label="Ferritin" value={fmt(lv('ferritin'))} unit="ng/mL" color={(num('ferritin') ?? 50) < 12 ? COLORS.crimson : COLORS.silver} drawnAt={latestDate('ferritin')} />
          <LabValue label="TIBC"    value={fmt(lv('tibc'))}       unit="ug/dL" color={COLORS.silver} drawnAt={latestDate('tibc')} />
        </PanelSection>

        {/* Weekly Insight */}
        {insight && (
          <View style={s.insightCard}>
            <View style={s.insightHeader}>
              <View style={s.dilDot} />
              <Text style={s.dilLabel}>DIL</Text>
            </View>
            <Text style={s.insightText}>{String(insight.narrative ?? '')}</Text>
            {insight.focus_area != null && String(insight.focus_area).trim() !== '' ? (
              <Text style={s.focusArea}>Focus area: {String(insight.focus_area)}</Text>
            ) : null}
            <Text style={s.cite}>
              Rohimaya Health AI
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content:   { padding: 16, paddingTop: 20, paddingBottom: 56 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2 },
  headerSub:   { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 2 },

  addBtn: {
    backgroundColor: COLORS.emeraldDeep, borderWidth: 1,
    borderColor: COLORS.emerald, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: COLORS.emeraldText, fontSize: 10, letterSpacing: 1 },
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
    alignItems: 'center', marginBottom: 8,
  },
  cardLabel: { color: COLORS.silver, fontSize: 8, letterSpacing: 1.8 },
  trendTag:  { fontSize: 10, fontStyle: 'italic' },

  chip: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipOn:      { borderColor: COLORS.emerald, backgroundColor: 'rgba(34,197,94,0.08)' },
  chipText:    { color: COLORS.silver, fontSize: 9, letterSpacing: 0.5 },
  chipTextOn:  { color: COLORS.emeraldText },

  panelSection: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    marginBottom: 8, overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  panelTitle:   { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },
  panelChevron: { color: COLORS.silver, fontSize: 9 },
  noDataTag:    { color: 'rgba(148,163,184,0.4)', fontSize: 8, fontStyle: 'italic' },
  panelGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, padding: 10,
  },
  noDataText: {
    color: 'rgba(148,163,184,0.4)', fontSize: 11,
    fontStyle: 'italic', padding: 4,
  },

  labVal: {
    minWidth: '28%', flex: 1,
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.sm,
    padding: 9, alignItems: 'center',
  },
  labValLabel: { color: COLORS.silver, fontSize: 7, letterSpacing: 1.5, marginBottom: 3 },
  labValNum:   { fontSize: 18, lineHeight: 22 },
  labValUnit:  { color: COLORS.silver, fontSize: 8, marginTop: 1 },
  labValNote:  { fontSize: 8, fontStyle: 'italic', marginTop: 2 },
  labValDate:  { color: 'rgba(148,163,184,0.35)', fontSize: 7, marginTop: 3, fontStyle: 'italic' },

  insightCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderLeftWidth: 3,
    borderLeftColor: COLORS.emeraldDeep, borderRadius: RADIUS.md,
    padding: 14, marginTop: 4, marginBottom: 12,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dilDot:  { width: 5, height: 5, backgroundColor: COLORS.emerald, borderRadius: 3 },
  dilLabel: { color: COLORS.emeraldText, fontSize: 8, letterSpacing: 2 },
  insightText: { color: COLORS.silver, fontSize: 12.5, lineHeight: 20, fontStyle: 'italic' },
  focusArea: { color: COLORS.emeraldText, fontSize: 10, marginTop: 8, fontStyle: 'italic' },
  cite: { color: 'rgba(148,163,184,0.35)', fontSize: 8, marginTop: 6, letterSpacing: 0.5 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centeredTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2, marginBottom: 8 },
  centeredText:  { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
});
