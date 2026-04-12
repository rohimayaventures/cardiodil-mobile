import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { COLORS, RADIUS } from '../src/constants/theme';
import { saveLabResult } from '../src/lib/supabase';

// Add Labs — CardioDil AI
// Manual entry form for lab results from any panel
// All fields optional — user enters only what they have
// Draw date is required
// Panel tabs filter which fields are shown
// PDF upload is Phase 2

type PanelKey =
  | 'lipid'
  | 'advanced'
  | 'metabolic'
  | 'kidney'
  | 'liver'
  | 'electrolytes'
  | 'cbc'
  | 'thyroid'
  | 'vitamins';

const PANELS: { key: PanelKey; label: string }[] = [
  { key: 'lipid',        label: 'Lipid Panel'    },
  { key: 'advanced',     label: 'Advanced Cardiac' },
  { key: 'metabolic',    label: 'Metabolic'      },
  { key: 'kidney',       label: 'Kidney / BMP'   },
  { key: 'liver',        label: 'Liver / CMP'    },
  { key: 'electrolytes', label: 'Electrolytes'   },
  { key: 'cbc',          label: 'CBC'            },
  { key: 'thyroid',      label: 'Thyroid'        },
  { key: 'vitamins',     label: 'Vitamins'       },
];

interface FieldDef {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  decimals?: number;
  note?: string;
}

const PANEL_FIELDS: Record<PanelKey, FieldDef[]> = {
  lipid: [
    { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', placeholder: '180' },
    { key: 'ldl',               label: 'LDL',               unit: 'mg/dL', placeholder: '100', note: 'Target under 70 for cardiac recovery' },
    { key: 'hdl',               label: 'HDL',               unit: 'mg/dL', placeholder: '55'  },
    { key: 'triglycerides',     label: 'Triglycerides',     unit: 'mg/dL', placeholder: '120' },
    { key: 'vldl',              label: 'VLDL',              unit: 'mg/dL', placeholder: '24'  },
    { key: 'non_hdl',           label: 'Non-HDL',           unit: 'mg/dL', placeholder: '125' },
  ],
  advanced: [
    { key: 'apob',        label: 'ApoB',         unit: 'mg/dL',  placeholder: '90',  note: 'Target under 80 for high cardiac risk' },
    { key: 'hscrp',       label: 'hsCRP',        unit: 'mg/L',   placeholder: '1.2', decimals: 2, note: 'Above 3.0 is high risk' },
    { key: 'lp_a',        label: 'Lp(a)',        unit: 'mg/dL',  placeholder: '30',  note: 'Above 50 is elevated cardiac risk' },
    { key: 'homocysteine',label: 'Homocysteine', unit: 'umol/L', placeholder: '10',  decimals: 1 },
  ],
  metabolic: [
    { key: 'glucose', label: 'Glucose (fasting)', unit: 'mg/dL', placeholder: '90',  note: 'Fasting preferred' },
    { key: 'a1c',     label: 'HbA1c',            unit: '%',      placeholder: '5.4', decimals: 1, note: 'Above 6.5% is diabetic range' },
  ],
  kidney: [
    { key: 'bun',        label: 'BUN',         unit: 'mg/dL', placeholder: '15'   },
    { key: 'creatinine', label: 'Creatinine',  unit: 'mg/dL', placeholder: '0.9', decimals: 2 },
    { key: 'egfr',       label: 'eGFR',        unit: 'mL/min', placeholder: '90', note: 'Below 60 is reduced function' },
  ],
  liver: [
    { key: 'alt',             label: 'ALT',            unit: 'U/L',   placeholder: '25', note: 'Monitor if on statins' },
    { key: 'ast',             label: 'AST',            unit: 'U/L',   placeholder: '22', note: 'Monitor if on statins' },
    { key: 'alp',             label: 'ALP',            unit: 'U/L',   placeholder: '70'  },
    { key: 'total_bilirubin', label: 'Total Bilirubin',unit: 'mg/dL', placeholder: '0.8', decimals: 1 },
    { key: 'albumin',         label: 'Albumin',        unit: 'g/dL',  placeholder: '4.2', decimals: 1 },
    { key: 'total_protein',   label: 'Total Protein',  unit: 'g/dL',  placeholder: '7.0', decimals: 1 },
  ],
  electrolytes: [
    { key: 'sodium',    label: 'Sodium',    unit: 'mEq/L', placeholder: '140', note: 'Normal 136-145'   },
    { key: 'potassium', label: 'Potassium', unit: 'mEq/L', placeholder: '4.0', decimals: 1, note: 'Normal 3.5-5.0 — critical for cardiac' },
    { key: 'chloride',  label: 'Chloride',  unit: 'mEq/L', placeholder: '102' },
    { key: 'co2',       label: 'CO2 / Bicarb', unit: 'mEq/L', placeholder: '24' },
    { key: 'calcium',   label: 'Calcium',   unit: 'mg/dL', placeholder: '9.5', decimals: 1 },
  ],
  cbc: [
    { key: 'wbc',        label: 'WBC',         unit: 'K/uL', placeholder: '6.5',  decimals: 1, note: 'Normal 4.0-11.0' },
    { key: 'rbc',        label: 'RBC',         unit: 'M/uL', placeholder: '4.8',  decimals: 2 },
    { key: 'hemoglobin', label: 'Hemoglobin',  unit: 'g/dL', placeholder: '14.0', decimals: 1, note: 'Low Hgb increases cardiac workload' },
    { key: 'hematocrit', label: 'Hematocrit',  unit: '%',    placeholder: '42.0', decimals: 1 },
    { key: 'platelets',  label: 'Platelets',   unit: 'K/uL', placeholder: '250',  note: 'Normal 150-400' },
    { key: 'mcv',        label: 'MCV',         unit: 'fL',   placeholder: '88',   decimals: 1 },
    { key: 'mch',        label: 'MCH',         unit: 'pg',   placeholder: '29',   decimals: 1 },
    { key: 'mchc',       label: 'MCHC',        unit: 'g/dL', placeholder: '33',   decimals: 1 },
  ],
  thyroid: [
    { key: 'tsh',     label: 'TSH',     unit: 'mIU/L', placeholder: '2.0', decimals: 2, note: 'Normal 0.4-4.0' },
    { key: 'free_t3', label: 'Free T3', unit: 'pg/mL', placeholder: '3.2', decimals: 1 },
    { key: 'free_t4', label: 'Free T4', unit: 'ng/dL', placeholder: '1.2', decimals: 2 },
  ],
  vitamins: [
    { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', placeholder: '40',  note: 'Below 20 is deficient' },
    { key: 'b12',       label: 'B12',       unit: 'pg/mL', placeholder: '500', note: 'Below 200 may be deficient' },
    { key: 'iron',      label: 'Iron',      unit: 'ug/dL', placeholder: '90'  },
    { key: 'ferritin',  label: 'Ferritin',  unit: 'ng/mL', placeholder: '80'  },
    { key: 'tibc',      label: 'TIBC',      unit: 'ug/dL', placeholder: '340' },
  ],
};

function LabInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.inputBlock}>
      <View style={s.inputLabelRow}>
        <Text style={s.inputLabel}>{field.label}</Text>
        <Text style={s.inputUnit}>{field.unit}</Text>
      </View>
      {field.note && (
        <Text style={s.inputNote}>{field.note}</Text>
      )}
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={field.placeholder}
        placeholderTextColor="rgba(148,163,184,0.3)"
        maxLength={10}
      />
    </View>
  );
}

export default function AddLabsScreen() {
  const { userId, signedIn } = useAuth();

  const [activePanel, setActivePanel] = useState<PanelKey>('lipid');
  const [drawnAt, setDrawnAt]         = useState('');
  const [saving, setSaving]           = useState(false);
  const [values, setValues]           = useState<Record<string, string>>({});

  function setValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function parseDate(input: string): string | null {
    // Accept MM/DD/YYYY or YYYY-MM-DD
    const parts = input.includes('/')
      ? input.split('/')
      : input.split('-');

    if (input.includes('/') && parts.length === 3) {
      const [m, d, y] = parts;
      if (m && d && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`;
      }
    }
    if (input.includes('-') && parts.length === 3 && parts[0].length === 4) {
      return `${input}T12:00:00Z`;
    }
    return null;
  }

  async function handleSave() {
    if (!signedIn || !userId) {
      Alert.alert('Not signed in', 'Sign in to save lab results.');
      return;
    }

    if (!drawnAt.trim()) {
      Alert.alert('Date required', 'Enter the date your labs were drawn (MM/DD/YYYY).');
      return;
    }

    const parsedDate = parseDate(drawnAt.trim());
    if (!parsedDate) {
      Alert.alert('Invalid date', 'Use MM/DD/YYYY or YYYY-MM-DD format.');
      return;
    }

    // Check that at least one value was entered
    const allFields = Object.values(PANEL_FIELDS).flat();
    const hasAnyValue = allFields.some(
      (f) => values[f.key] && values[f.key].trim() !== ''
    );

    if (!hasAnyValue) {
      Alert.alert('No values entered', 'Enter at least one lab value before saving.');
      return;
    }

    // Build the payload — only include fields with values
    const payload: Record<string, unknown> = {
      drawn_at: parsedDate,
      panel_types: [activePanel],
    };

    allFields.forEach((f) => {
      const raw = values[f.key];
      if (raw && raw.trim() !== '') {
        const num = parseFloat(raw.replace(',', '.'));
        if (!isNaN(num)) payload[f.key] = num;
      }
    });

    setSaving(true);
    try {
      await saveLabResult(userId, payload);
      Alert.alert(
        'Lab results saved',
        'Your results are now visible in the Lab Vault.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('[AddLabs] Save failed:', error);
      Alert.alert('Save failed', 'Could not save your lab results. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const currentFields = PANEL_FIELDS[activePanel];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Add Lab Results</Text>
            <Text style={s.headerSub}>Manual entry. All fields optional.</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Text style={s.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Draw date */}
        <View style={s.dateRow}>
          <Text style={s.dateLabel}>DATE LABS WERE DRAWN</Text>
          <TextInput
            style={s.dateInput}
            value={drawnAt}
            onChangeText={setDrawnAt}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="rgba(148,163,184,0.35)"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        {/* Panel tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.panelTabs}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
        >
          {PANELS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[s.panelTab, activePanel === p.key && s.panelTabOn]}
              onPress={() => setActivePanel(p.key)}
            >
              <Text style={[s.panelTabText, activePanel === p.key && s.panelTabTextOn]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Field inputs */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.panelSubtitle}>
            Enter the values from your lab report. Leave blank if not on your panel.
          </Text>

          {currentFields.map((field) => (
            <LabInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(v) => setValue(field.key, v)}
            />
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Save button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={COLORS.emeraldText} />
              : <Text style={s.saveBtnText}>Save Lab Results</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 16, paddingTop: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 15, letterSpacing: 1.5 },
  headerSub:   { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  closeBtn: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  closeBtnText: { color: COLORS.silver, fontSize: 11, letterSpacing: 0.5 },

  dateRow: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dateLabel: { color: COLORS.silver, fontSize: 7.5, letterSpacing: 1.5, flex: 1 },
  dateInput: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 6,
    color: COLORS.emeraldText, fontSize: 14,
    minWidth: 120, textAlign: 'center',
  },

  panelTabs: {
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 10, flexGrow: 0,
    backgroundColor: COLORS.surface,
  },
  panelTab: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
  },
  panelTabOn:     { borderColor: COLORS.emerald, backgroundColor: 'rgba(34,197,94,0.08)' },
  panelTabText:   { color: COLORS.silver, fontSize: 9, letterSpacing: 0.8 },
  panelTabTextOn: { color: COLORS.emeraldText },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  panelSubtitle: {
    color: 'rgba(148,163,184,0.5)', fontSize: 11,
    fontStyle: 'italic', marginBottom: 4,
  },

  inputBlock: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12,
  },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  inputLabel:    { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 0.5 },
  inputUnit:     { color: COLORS.silver, fontSize: 9, fontStyle: 'italic' },
  inputNote:     { color: 'rgba(148,163,184,0.5)', fontSize: 9, fontStyle: 'italic', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 8,
    color: COLORS.emeraldText, fontSize: 18,
    marginTop: 6,
  },

  footer: {
    padding: 16, borderTopWidth: 1,
    borderTopColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  saveBtn: {
    backgroundColor: COLORS.emeraldDeep, borderWidth: 1,
    borderColor: COLORS.emerald, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1.5 },
});
