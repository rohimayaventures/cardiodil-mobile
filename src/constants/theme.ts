// Dil Vital Design System — CardioDil AI, Slytherin Cardiac Edition
// GOLD RULE: #C9A84C appears ONLY on heart score, app name, milestones
// RED RULE: #DC2626 and #7F1D1D appear ONLY on danger states and clinical alerts

export const COLORS = {
  bg: '#07090A',
  surface: '#0D1410',
  elevated: '#142019',
  border: '#1D3020',
  emerald: '#22C55E',
  emeraldDeep: '#166534',
  emeraldText: '#86EFAC',
  gold: '#C9A84C',
  goldPale: '#F5D97A',
  silver: '#94A3B8',
  crimson: '#DC2626',
  blood: '#7F1D1D',
} as const;

export const FONTS = {
  display: 'CinzelDecorative_400Regular',
  displayBold: 'CinzelDecorative_700Bold',
  header: 'Cinzel_400Regular',
  headerMedium: 'Cinzel_600SemiBold',
  narrative: 'EBGaramond_400Regular',
  narrativeItalic: 'EBGaramond_400Regular_Italic',
  data: 'JetBrainsMono_400Regular',
  dataMedium: 'JetBrainsMono_500Medium',
} as const;

export const SPACING = {
  xs: 4, sm: 8, md: 14, lg: 20, xl: 28,
} as const;

export const RADIUS = {
  sm: 8, md: 14, lg: 18, xl: 24, full: 100,
} as const;

export const BPM_DEFAULT = 68;
export const BEAT_INTERVAL_MS = (60 / BPM_DEFAULT) * 1000;

export const HEART_SCORE_TIERS = {
  excellent: { min: 90, max: 100, label: 'Excellent', color: '#C9A84C' },
  good:      { min: 70, max: 89,  label: 'Good',      color: '#22C55E' },
  moderate:  { min: 50, max: 69,  label: 'Moderate',  color: '#94A3B8' },
  poor:      { min: 30, max: 49,  label: 'Poor',      color: '#DC2626' },
  very_poor: { min: 0,  max: 29,  label: 'Very Poor', color: '#7F1D1D' },
} as const;

export const SODIUM_LIMITS = {
  perMealWarning: 400,
  perMealDanger: 600,
  dailyTarget: 1500,
} as const;

export const SAT_FAT_LIMITS = {
  perMealGood: 3,
  perMealWarning: 7,
  perMealDanger: 10,
} as const;

export const FIBER_TARGETS = {
  perMealMinimum: 2,
  perMealGood: 5,
  perMealExcellent: 10,
  dailyTarget: 25,
} as const;
