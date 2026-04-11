import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../src/constants/theme';
import {
  MEAL_SCORE_EXPLANATION,
  HEART_SCORE_EXPLANATION,
  BIOMETRIC_EXPLANATIONS,
  LAB_EXPLANATIONS,
} from '../src/constants/scoreExplanations';

// Score Explanations Screen — CardioDil AI
// Explains every score and metric shown in the app
// Accessible via the ? button on Dashboard and other screens
// Written in Dil's voice: smart, calm, slightly direct

type Section = 'meal' | 'heart' | 'biometrics' | 'labs';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'meal',       label: 'Meal Score'  },
  { key: 'heart',      label: 'Heart Score' },
  { key: 'biometrics', label: 'Biometrics'  },
  { key: 'labs',       label: 'Labs'        },
];

function TierBadge({ color, range, label, meaning }: {
  color: string;
  range: string;
  label: string;
  meaning: string;
}) {
  return (
    <View style={s.tierRow}>
      <View style={[s.tierDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={[s.tierLabel, { color }]}>{label}</Text>
          <Text style={s.tierRange}>{range}</Text>
        </View>
        <Text style={s.tierMeaning}>{meaning}</Text>
      </View>
    </View>
  );
}

function FactorRow({ name, impact, explanation, icon }: {
  name: string;
  impact: string;
  explanation: string;
  icon: string;
}) {
  const color = impact === 'positive' ? COLORS.emeraldText : COLORS.silver;
  return (
    <View style={s.factorCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <Text style={{ color, fontSize: 13 }}>{icon}</Text>
        <Text style={[s.factorName, { color }]}>{name}</Text>
        <Text style={[s.factorImpact, {
          color: impact === 'positive' ? COLORS.emeraldText : COLORS.crimson,
          backgroundColor: impact === 'positive'
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(220,38,38,0.08)',
        }]}>
          {impact === 'positive' ? 'Helps LDL' : 'Hurts LDL'}
        </Text>
      </View>
      <Text style={s.factorExplanation}>{explanation}</Text>
    </View>
  );
}

function ComponentRow({ name, weight, description }: {
  name: string;
  weight: string;
  description: string;
}) {
  return (
    <View style={s.componentCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={s.componentName}>{name}</Text>
        <Text style={s.componentWeight}>{weight}</Text>
      </View>
      <Text style={s.componentDesc}>{description}</Text>
    </View>
  );
}

function RangeRow({ label, range, color }: {
  label: string;
  range: string;
  color: string;
}) {
  return (
    <View style={s.rangeRow}>
      <View style={[s.rangeBar, { backgroundColor: color, opacity: 0.25 }]} />
      <View style={[s.rangeDot, { backgroundColor: color }]} />
      <Text style={[s.rangeLabel, { color }]}>{label}</Text>
      <Text style={s.rangeValue}>{range}</Text>
    </View>
  );
}

function DilNote({ text }: { text: string }) {
  return (
    <View style={s.dilNoteCard}>
      <View style={s.dilNoteDot} />
      <View style={{ flex: 1 }}>
        <Text style={s.dilNoteLabel}>DIL</Text>
        <Text style={s.dilNoteText}>{text}</Text>
      </View>
    </View>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <View style={s.sectionDivider}>
      <Text style={s.sectionDividerText}>{title}</Text>
      <View style={s.sectionDividerLine} />
    </View>
  );
}

export default function ExplanationsScreen() {
  const [activeSection, setActiveSection] = useState<Section>('meal');

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>What Does This Mean?</Text>
          <Text style={s.headerSub}>Every score and metric explained.</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View style={s.sectionTabs}>
        {SECTIONS.map((sec) => (
          <TouchableOpacity
            key={sec.key}
            style={[s.sectionTab, activeSection === sec.key && s.sectionTabOn]}
            onPress={() => setActiveSection(sec.key)}
          >
            <Text style={[s.sectionTabText, activeSection === sec.key && s.sectionTabTextOn]}>
              {sec.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* MEAL SCORE */}
        {activeSection === 'meal' && (
          <View>
            <Text style={s.pageTitle}>{MEAL_SCORE_EXPLANATION.title}</Text>
            <Text style={s.pageSubtitle}>{MEAL_SCORE_EXPLANATION.subtitle}</Text>
            <Text style={s.pageDescription}>{MEAL_SCORE_EXPLANATION.description}</Text>

            <SectionDivider title="Score Tiers" />
            {MEAL_SCORE_EXPLANATION.tiers.map((tier) => (
              <TierBadge
                key={tier.label}
                color={tier.color}
                range={tier.range}
                label={tier.label}
                meaning={tier.meaning}
              />
            ))}

            <SectionDivider title="What We Score" />
            {MEAL_SCORE_EXPLANATION.factors.map((factor) => (
              <FactorRow
                key={factor.name}
                name={factor.name}
                impact={factor.impact}
                explanation={factor.explanation}
                icon={factor.icon}
              />
            ))}

            <DilNote text={MEAL_SCORE_EXPLANATION.dilNote} />
          </View>
        )}

        {/* HEART SCORE */}
        {activeSection === 'heart' && (
          <View>
            <Text style={s.pageTitle}>{HEART_SCORE_EXPLANATION.title}</Text>
            <Text style={s.pageSubtitle}>{HEART_SCORE_EXPLANATION.subtitle}</Text>
            <Text style={s.pageDescription}>{HEART_SCORE_EXPLANATION.description}</Text>

            <SectionDivider title="Four Components" />
            {HEART_SCORE_EXPLANATION.components.map((comp) => (
              <ComponentRow
                key={comp.name}
                name={comp.name}
                weight={comp.weight}
                description={comp.description}
              />
            ))}

            <SectionDivider title="Score Tiers" />
            {HEART_SCORE_EXPLANATION.tiers.map((tier) => (
              <TierBadge
                key={tier.label}
                color={tier.color}
                range={tier.range}
                label={tier.label}
                meaning={tier.meaning}
              />
            ))}

            <DilNote text={HEART_SCORE_EXPLANATION.dilNote} />
          </View>
        )}

        {/* BIOMETRICS */}
        {activeSection === 'biometrics' && (
          <View>
            <Text style={s.pageTitle}>Biometric Readings</Text>
            <Text style={s.pageSubtitle}>Auto-read from your Circul ring and Apple Health.</Text>

            {Object.values(BIOMETRIC_EXPLANATIONS).map((metric) => (
              <View key={metric.name} style={s.metricBlock}>
                <View style={s.metricBlockHeader}>
                  <Text style={s.metricBlockName}>{metric.name}</Text>
                  <Text style={s.metricBlockUnit}>{metric.unit}</Text>
                </View>
                <Text style={s.metricBlockSource}>{metric.source}</Text>
                <Text style={s.metricBlockExplanation}>{metric.explanation}</Text>
                <View style={s.rangeBlock}>
                  {metric.ranges.map((r) => (
                    <RangeRow
                      key={r.label}
                      label={r.label}
                      range={r.range}
                      color={r.color}
                    />
                  ))}
                </View>
                <DilNote text={metric.dilNote} />
              </View>
            ))}
          </View>
        )}

        {/* LABS */}
        {activeSection === 'labs' && (
          <View>
            <Text style={s.pageTitle}>Lab Results</Text>
            <Text style={s.pageSubtitle}>Your lipid panel and inflammation markers.</Text>

            {Object.values(LAB_EXPLANATIONS).map((lab) => (
              <View key={lab.name} style={s.metricBlock}>
                <View style={s.metricBlockHeader}>
                  <Text style={s.metricBlockName}>{lab.name}</Text>
                  <Text style={s.metricBlockUnit}>{lab.unit}</Text>
                </View>
                <Text style={s.metricBlockExplanation}>{lab.explanation}</Text>
                <View style={s.rangeBlock}>
                  {lab.ranges.map((r) => (
                    <RangeRow
                      key={r.label}
                      label={r.label}
                      range={r.range}
                      color={r.color}
                    />
                  ))}
                </View>
                <DilNote text={lab.dilNote} />
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 20, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 1.5, marginBottom: 3 },
  headerSub: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic' },
  closeBtn: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  closeBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  sectionTabs: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 8, gap: 6,
  },
  sectionTab: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTabOn: { borderColor: COLORS.emerald, backgroundColor: 'rgba(34,197,94,0.08)' },
  sectionTabText: { color: COLORS.silver, fontSize: 9, letterSpacing: 1 },
  sectionTabTextOn: { color: COLORS.emeraldText },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  pageTitle: { color: COLORS.gold, fontSize: 18, letterSpacing: 1, marginBottom: 4 },
  pageSubtitle: { color: COLORS.emeraldText, fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  pageDescription: { color: COLORS.silver, fontSize: 12.5, lineHeight: 20, marginBottom: 4 },

  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 },
  sectionDividerText: { color: COLORS.silver, fontSize: 8, letterSpacing: 1.8 },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  tierRow: {
    flexDirection: 'row', gap: 10, marginBottom: 12,
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12,
  },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3, flexShrink: 0 },
  tierLabel: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  tierRange: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic' },
  tierMeaning: { color: COLORS.silver, fontSize: 12, lineHeight: 18 },

  factorCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8,
  },
  factorName: { fontSize: 11, letterSpacing: 0.5, fontWeight: '600' },
  factorImpact: {
    fontSize: 8, letterSpacing: 0.8, paddingHorizontal: 7,
    paddingVertical: 2, borderRadius: 100,
  },
  factorExplanation: { color: COLORS.silver, fontSize: 12, lineHeight: 18 },

  componentCard: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderLeftWidth: 3,
    borderLeftColor: COLORS.emeraldDeep, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 8,
  },
  componentName: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 0.5 },
  componentWeight: { color: COLORS.gold, fontSize: 11, letterSpacing: 0.5 },
  componentDesc: { color: COLORS.silver, fontSize: 12, lineHeight: 18 },

  metricBlock: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 12,
  },
  metricBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  metricBlockName: { color: COLORS.emeraldText, fontSize: 13, letterSpacing: 0.5 },
  metricBlockUnit: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic' },
  metricBlockSource: { color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic', marginBottom: 8 },
  metricBlockExplanation: { color: COLORS.silver, fontSize: 12, lineHeight: 18, marginBottom: 10 },

  rangeBlock: { gap: 6, marginBottom: 10 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeBar: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 4 },
  rangeDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  rangeLabel: { fontSize: 10, letterSpacing: 0.5, flex: 1 },
  rangeValue: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic' },

  dilNoteCard: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderLeftWidth: 3,
    borderLeftColor: COLORS.emerald, borderRadius: RADIUS.md,
    padding: 12, flexDirection: 'row', gap: 8, marginTop: 4,
  },
  dilNoteDot: { width: 5, height: 5, backgroundColor: COLORS.emerald, borderRadius: 3, marginTop: 4, flexShrink: 0 },
  dilNoteLabel: { color: COLORS.emeraldText, fontSize: 7.5, letterSpacing: 2, marginBottom: 3 },
  dilNoteText: { color: COLORS.silver, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
});
