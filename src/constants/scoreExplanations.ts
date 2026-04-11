// Score Explanations — CardioDil AI
// Powers the "What Does This Mean?" explanation screen
// All explanation copy written in Dil's voice: smart, calm, slightly direct
// EB Garamond italic is used for all Dil speech in the UI layer

export const MEAL_SCORE_EXPLANATION = {
  title: 'Meal Score',
  subtitle: 'How heart-healthy was this meal?',
  description: 'Every meal you log gets a score from 0 to 100. The score measures how much that single meal helps or hurts your LDL cholesterol — the primary number we are working to bring down. It does not judge you. It gives you data.',
  tiers: [
    {
      range: '90 to 100',
      label: 'Excellent',
      color: '#C9A84C',
      meaning: 'This meal is actively working to lower your LDL. High fiber, low saturated fat, heart-protective nutrients. Eat this regularly.',
    },
    {
      range: '70 to 89',
      label: 'Good',
      color: '#22C55E',
      meaning: 'Solid cardiac meal. Supports your heart health goals. Small improvements could push it higher but this is a good consistent choice.',
    },
    {
      range: '50 to 69',
      label: 'Moderate',
      color: '#94A3B8',
      meaning: 'Mixed nutritional picture. Some elements help, some work against your LDL goals. Worth looking at what is dragging the score down.',
    },
    {
      range: '30 to 49',
      label: 'Poor',
      color: '#DC2626',
      meaning: 'This meal works against your LDL reduction goals. One poor meal does not undo your progress. A consistent pattern of them does.',
    },
    {
      range: '0 to 29',
      label: 'Very Poor',
      color: '#7F1D1D',
      meaning: 'High cardiovascular risk meal. Significant saturated fat, trans fat, or sodium. Occasional is manageable. This should not be a regular occurrence during recovery.',
    },
  ],
  factors: [
    {
      name: 'Saturated Fat',
      icon: '⚠',
      impact: 'negative',
      explanation: 'The primary driver of LDL cholesterol. Found in red meat, butter, full-fat dairy, and fried foods. Every gram above 7g per meal is penalized in your score. Target: under 4g per meal.',
    },
    {
      name: 'Trans Fat',
      icon: '⚠',
      impact: 'negative',
      explanation: 'Raises LDL and lowers HDL simultaneously. Found in partially hydrogenated oils and some processed foods. There is no acceptable amount during cardiac recovery. Any trans fat flags your meal.',
    },
    {
      name: 'Fiber',
      icon: '✓',
      impact: 'positive',
      explanation: 'Soluble fiber binds cholesterol in your gut before it can be absorbed. One of the most effective dietary tools for LDL reduction. Every gram helps. Target: at least 5g per meal, 25g daily.',
    },
    {
      name: 'Sodium',
      icon: '⚠',
      impact: 'negative',
      explanation: 'High sodium raises blood pressure which strains your heart during recovery. Any single meal over 400mg is flagged. Your daily target is under 1,500mg total. Restaurant meals are the biggest risk.',
    },
    {
      name: 'Omega-3',
      icon: '✓',
      impact: 'positive',
      explanation: 'Anti-inflammatory and LDL-protective. Found in fatty fish like salmon, mackerel, and sardines, plus walnuts and flaxseed. At 2,000mg or more per meal, your score gets a significant bonus.',
    },
    {
      name: 'Legumes',
      icon: '✓',
      impact: 'positive',
      explanation: 'Lentils, chickpeas, black beans, and similar foods are among the most heart-protective foods available. High soluble fiber, plant protein, and zero saturated fat. Major score bonus.',
    },
  ],
  dilNote: 'No single meal determines your outcome. The pattern across days and weeks is what your LDL will respond to. Dil is tracking that pattern so you do not have to hold it all in your head.',
} as const;

export const HEART_SCORE_EXPLANATION = {
  title: 'Heart Score',
  subtitle: 'How is your heart doing today?',
  description: 'Your Heart Score is a composite daily picture of your cardiovascular health. It combines your meal scores with your biometric data from the Circul ring and Apple Health, your lab trends, and your lifestyle inputs. One number that answers: how did today go for your heart.',
  components: [
    {
      name: 'Meal Score Average',
      weight: '30%',
      description: 'The average of all meals you logged today. Every meal you scan and log contributes. Unlogged meals are not counted, which means logging consistently gives you a more accurate picture.',
    },
    {
      name: 'Biometrics',
      weight: '30%',
      description: 'Your Circul ring and Apple Health data: resting heart rate, HRV (heart rate variability), SpO2 (blood oxygen), blood pressure, and sleep stages. These are read automatically each morning. You can override any reading manually.',
    },
    {
      name: 'Lab Trends',
      weight: '20%',
      description: 'Your most recent lab results: LDL, HDL, ApoB, hsCRP (inflammation marker), and glucose. Lab trends are weighted by recency. A rising LDL over three consecutive draws lowers this component significantly.',
    },
    {
      name: 'Lifestyle',
      weight: '20%',
      description: 'Exercise type and duration, step count, stress level (1 to 5), and sleep quality. These are logged in the Quick Log section of your Dashboard each day. Auto-read where possible, manual override always available.',
    },
  ],
  tiers: [
    {
      range: '90 to 100',
      label: 'Excellent',
      color: '#C9A84C',
      meaning: 'Outstanding cardiac day. Your biometrics, meals, and lifestyle all aligned. This is what recovery looks like when everything is working.',
    },
    {
      range: '70 to 89',
      label: 'Good',
      color: '#22C55E',
      meaning: 'Strong cardiac day. Most inputs are working in your favor. Dil will highlight which area has the most room to improve.',
    },
    {
      range: '50 to 69',
      label: 'Moderate',
      color: '#94A3B8',
      meaning: 'Mixed day. Something is pulling the score down. Check which component — meals, biometrics, labs, or lifestyle — is the weak point.',
    },
    {
      range: '30 to 49',
      label: 'Poor',
      color: '#DC2626',
      meaning: 'One or more areas need attention today. This is not a crisis, it is information. Dil will tell you what to focus on.',
    },
    {
      range: '0 to 29',
      label: 'Very Poor',
      color: '#7F1D1D',
      meaning: 'Multiple areas are in concerning territory. If you see this consistently, Dil will prompt you to schedule a cardiologist check-in.',
    },
  ],
  dilNote: 'Your Heart Score is a tool, not a verdict. A single bad day does not define your recovery. What Dil is watching is the trend line over weeks — and that is what will move your LDL.',
} as const;

export const BIOMETRIC_EXPLANATIONS = {
  hrv: {
    name: 'HRV (Heart Rate Variability)',
    unit: 'ms (SDNN)',
    source: 'Circul ring via Apple HealthKit',
    explanation: 'HRV measures the variation in time between your heartbeats. Higher HRV generally means your autonomic nervous system is recovering well and your heart is adapting efficiently to stress. It is one of the best daily indicators of overall cardiac recovery.',
    ranges: [
      { label: 'Good', range: 'Above 40ms', color: '#22C55E' },
      { label: 'Moderate', range: '20 to 40ms', color: '#94A3B8' },
      { label: 'Low', range: 'Below 20ms', color: '#DC2626' },
    ],
    dilNote: 'Your HRV will naturally vary day to day. Dil tracks the 7-day trend, not individual readings. A consistently rising trend is what matters.',
  },
  spo2: {
    name: 'SpO2 (Blood Oxygen)',
    unit: '%',
    source: 'Circul ring via Apple HealthKit',
    explanation: 'SpO2 measures how much oxygen your red blood cells are carrying. Your Circul ring tracks this continuously overnight, which is when cardiac patients are most at risk for drops. Dil records your average and your lowest point, and the exact time it occurred.',
    ranges: [
      { label: 'Normal', range: '95% and above', color: '#22C55E' },
      { label: 'Watch', range: '90 to 94%', color: '#94A3B8' },
      { label: 'Concerning', range: 'Below 90%', color: '#DC2626' },
    ],
    dilNote: 'A dip during light sleep is less clinically significant than a dip during deep sleep. Dil tracks the timestamp so the context is never lost.',
  },
  restingHR: {
    name: 'Resting Heart Rate',
    unit: 'BPM',
    source: 'Apple HealthKit or manual entry',
    explanation: 'Your resting heart rate during cardiac recovery is a direct indicator of how hard your heart is working at baseline. A gradually decreasing resting HR over weeks typically signals improving cardiovascular fitness.',
    ranges: [
      { label: 'Optimal', range: '50 to 70 BPM', color: '#22C55E' },
      { label: 'Acceptable', range: '70 to 85 BPM', color: '#94A3B8' },
      { label: 'Elevated', range: 'Above 85 BPM', color: '#DC2626' },
    ],
    dilNote: 'Beta blockers and other cardiac medications directly affect resting HR. Dil does not account for medication effects. Always discuss your numbers with your cardiologist.',
  },
  bloodPressure: {
    name: 'Blood Pressure',
    unit: 'mmHg (systolic/diastolic)',
    source: 'Circul ring or manual entry',
    explanation: 'Blood pressure during cardiac recovery is critical. Consistently elevated BP strains the heart muscle and can accelerate arterial damage. Your daily BP reading is one of the most important numbers Dil tracks.',
    ranges: [
      { label: 'Normal', range: 'Below 120/80', color: '#22C55E' },
      { label: 'Elevated', range: '120 to 139 / 80 to 89', color: '#94A3B8' },
      { label: 'High', range: '140/90 and above', color: '#DC2626' },
    ],
    dilNote: 'If your BP consistently reads above 140/90 across three or more days, Dil will recommend scheduling a cardiologist appointment. This is not a diagnosis.',
  },
} as const;

export const LAB_EXPLANATIONS = {
  ldl: {
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    explanation: 'LDL is the primary target of your cardiac recovery diet. High LDL causes plaque buildup in arteries over time. Every food decision Dil scores is ultimately aimed at moving this number down.',
    ranges: [
      { label: 'Optimal for cardiac recovery', range: 'Below 70 mg/dL', color: '#22C55E' },
      { label: 'Near optimal',                  range: '70 to 100 mg/dL', color: '#22C55E' },
      { label: 'Borderline high',               range: '100 to 129 mg/dL', color: '#94A3B8' },
      { label: 'High',                          range: '130 to 159 mg/dL', color: '#DC2626' },
      { label: 'Very high',                     range: '160 mg/dL and above', color: '#7F1D1D' },
    ],
    dilNote: 'For cardiac recovery patients, most cardiologists target LDL below 70 mg/dL. Your personal target should come from your cardiologist, not Dil.',
  },
  hdl: {
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    explanation: 'HDL is often called good cholesterol because it carries LDL out of your arteries. Higher HDL is protective. Exercise is one of the most effective ways to raise HDL.',
    ranges: [
      { label: 'Protective', range: 'Above 60 mg/dL', color: '#22C55E' },
      { label: 'Acceptable', range: '40 to 59 mg/dL', color: '#94A3B8' },
      { label: 'Low risk',   range: 'Below 40 mg/dL', color: '#DC2626' },
    ],
    dilNote: 'Dil tracks the LDL to HDL ratio over time, not just individual values. The ratio trend is more predictive than any single number.',
  },
  apob: {
    name: 'ApoB',
    unit: 'mg/dL',
    explanation: 'ApoB measures the total number of LDL particles in your blood, not just their cholesterol content. It is considered a more precise cardiac risk marker than standard LDL. A low ApoB with normal LDL is reassuring. A high ApoB with borderline LDL is a warning.',
    ranges: [
      { label: 'Optimal', range: 'Below 80 mg/dL', color: '#22C55E' },
      { label: 'Borderline', range: '80 to 99 mg/dL', color: '#94A3B8' },
      { label: 'High',    range: '100 mg/dL and above', color: '#DC2626' },
    ],
    dilNote: 'Not all labs include ApoB by default. If yours does not, ask your cardiologist to add it to your next panel.',
  },
  hscrp: {
    name: 'hsCRP (Inflammation Marker)',
    unit: 'mg/L',
    explanation: 'High-sensitivity CRP measures inflammation in your body. Elevated hsCRP during cardiac recovery indicates your cardiovascular system is under stress and increases the risk of a future event. Diet, sleep, and stress level all directly affect this number.',
    ranges: [
      { label: 'Low risk',      range: 'Below 1.0 mg/L', color: '#22C55E' },
      { label: 'Average risk',  range: '1.0 to 3.0 mg/L', color: '#94A3B8' },
      { label: 'High risk',     range: 'Above 3.0 mg/L', color: '#DC2626' },
    ],
    dilNote: 'Omega-3 rich meals, consistent sleep, and lower stress directly reduce hsCRP. This is one of the numbers where your daily habits have the most visible impact.',
  },
} as const;
