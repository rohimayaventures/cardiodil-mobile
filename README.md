# CardioDil AI

**"Know what your heart is eating."**

CardioDil AI is a cardiac health intelligence platform built by
Rohimaya Health AI under Pagade Ventures. It combines clinical
nutrition scoring, real-time biometric tracking, and an AI agent
named Dil to help people in cardiac recovery make better daily
decisions about food, exercise, and lifestyle.

CardioDil AI is NOT a medical device. It is NOT a substitute for
professional medical advice. In an emergency call 911.

---

## What It Does

### Dil — Your Cardiac Health Agent
Dil (Hindi for heart) is a conversational AI agent powered by
Claude Sonnet. Dil knows your lab history, your biometrics, your
meals, and your goals. Dil speaks with warm clinical authority
and occasional dry wit. Dil asks one question per turn. Always.

### Meal Vision
Point your camera at any meal. Claude vision identifies the
components, estimates the nutritional profile, and scores it
using Prasad's V1 LDL Impact Algorithm. Branded products trigger
a Brand Intelligence flag — Dil never estimates nutrition for a
branded product without database confirmation.

### Two Scores, Two Different Things

**Meal Score (0-100)**
Single meal LDL impact. Calculated the moment a meal is scanned.
Driven by saturated fat, fiber, sodium, cooking method, and
omega-3 content.

| Score | Tier |
|---|---|
| 90-100 | Excellent |
| 70-89 | Good |
| 50-69 | Moderate |
| 30-49 | Poor |
| 0-29 | Very Poor |

**Heart Score (0-100)**
Daily composite. Calculated once per day from four components.

| Component | Weight | Source |
|---|---|---|
| Meals | 30% | Average of today's meal scores |
| Biometrics | 30% | HRV, HR, BP, SpO2, sleep, steps |
| Labs | 20% | Most recent LDL, hsCRP, ApoB |
| Lifestyle | 20% | Exercise, stress, sleep quality |

### Lab Vault
Tracks every lab panel a user gets — not just lipid panels.
Supports Lipid, Advanced Cardiac, CBC, CMP, BMP, Metabolic,
Thyroid, and Vitamins panels. User-selectable trend chart.
Each value shows its draw date because labs are irregular.

### Quick Log
Dashboard biometric logging: exercise type and intensity,
steps confirmed from Apple Health, stress level 1-5,
blood pressure, heart rate, sleep quality override.
Auto-reads from HealthKit and Circul ring. All fields
have manual override. Saves to Supabase and awards 120 Dil XP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo React Native + TypeScript |
| Navigation | expo-router (file-based) |
| Database | Supabase (PostgreSQL + RLS) |
| Authentication | Supabase Auth (email) |
| AI agent | Anthropic Claude Sonnet 4.5 |
| Meal vision | Claude vision API (multipart image) |
| Voice | ElevenLabs TTS (eleven_turbo_v2_5) |
| Health data | react-native-health (HealthKit + Circul ring) |
| Charts | react-native-svg |
| Nutrition data | USDA FoodData Central, Open Food Facts |
| Build | EAS Build (TestFlight / App Store) |

---

## Design System — Dil Vital

Slytherin Cardiac Edition.

| Token | Value | Usage |
|---|---|---|
| bg | #07090A | App background |
| surface | #0D1410 | Cards |
| elevated | #142019 | Inputs, secondary cards |
| border | #1D3020 | All borders |
| emerald | #22C55E | Good scores, active states |
| gold | #C9A84C | Heart Score number, app name, milestones ONLY |
| crimson | #DC2626 | Danger states, clinical alerts ONLY |
| silver | #94A3B8 | Body text, labels |

Fonts: Cinzel Decorative (display), Cinzel (headers),
EB Garamond (Dil speech), JetBrains Mono (all data).

---

## Project Structure

```
app/
  (tabs)/
    index.tsx          Splash screen — pulsating SVG heart at 68 BPM
    dashboard.tsx      Heart Score hero + biometrics + Quick Log
    chat.tsx           Dil Chat — Claude API + ElevenLabs voice
    scan.tsx           Meal Vision — camera + Claude vision + scoring
    labs.tsx           Lab Vault — all panels + trend chart
  _layout.tsx          Root stack with modal screens registered
  sign-in.tsx          Auth screen — sign in and create account
  disclaimer.tsx       First-launch medical disclaimer (Apple compliance)
  privacy-policy.tsx   In-app privacy policy (Dil Vital dark theme)
  settings.tsx         Account, legal links, sign out
  explanations.tsx     Score explanations modal — 4 tabbed sections
  add-labs.tsx         Manual lab entry — all 8 panels
src/
  constants/
    theme.ts           Dil Vital design tokens
    scoreExplanations.ts All score and metric explanation copy
  hooks/
    useAuth.ts         Supabase session management hook
  lib/
    supabase.ts        Supabase client + all database queries
    mealScore.ts       Prasad V1 LDL Impact meal scoring algorithm
    heartScore.ts      Daily composite Heart Score engine (4 components)
    healthkit.ts       HealthKit + Circul ring data wrapper
    elevenlabs.ts      Dil TTS integration with expo-av playback
    dilPersonality.ts  Dil humor and response library
    dilSystemPrompt.ts Claude system prompt builder with live context
  types/
    index.ts           All TypeScript interfaces and types
docs/
  privacy-policy.html  Hosted privacy policy for App Store Connect
```

---

## Supabase Schema

| Table | Purpose |
|---|---|
| user_profiles | Auth, tier, gamification, disclaimer acceptance |
| meals | Meal logs with meal_score and meal_score_tier |
| biometrics | Daily Quick Log saves — all 6 input types |
| lab_results | All lab panels — 50+ columns |
| daily_heart_scores | Composite Heart Score stored once per day |
| emotion_logs | Dil conversation sentiment tracking |
| weekly_insights | Dil weekly narrative and focus area |

Row Level Security is enabled on all tables.
Users can only read and write their own rows.

The `add_dil_xp` RPC function handles atomic XP updates.
The `on_auth_user_created` trigger auto-creates a user profile on signup.
The `protect_locked_tier` trigger prevents Stripe from overriding
founder-tier accounts.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.
Never commit `.env.local` — it is covered by `.gitignore`.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ANTHROPIC_API_KEY=
EXPO_PUBLIC_ELEVENLABS_API_KEY=
EXPO_PUBLIC_ELEVENLABS_VOICE_ID=
EXPO_PUBLIC_USDA_API_KEY=
```

For EAS builds, set these as project secrets:
```
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo Go (for development without native builds)
npx expo start

# TypeScript check
npx tsc --noEmit

# EAS build for TestFlight
eas build --platform ios --profile preview
```

---

## Dil Voice Setup

1. Go to elevenlabs.io → Voice Lab → Voice Design
2. Create Dil's voice using the character description in the
   session transcript
3. Save the voice and copy the Voice ID
4. Add to .env.local as EXPO_PUBLIC_ELEVENLABS_VOICE_ID

Dil voice settings: stability 0.68, similarity 0.82,
style 0.15, speaker boost on, model eleven_turbo_v2_5.

---

## Clinical Guardrails

Dil never diagnoses. Dil never references medications.
Dil never estimates nutrition for branded products without
database confirmation. Dil asks one question per turn.
If metrics trend into clinically concerning territory,
Dil flags it and recommends a cardiologist appointment.

These rules are enforced in the Claude system prompt and
cannot be overridden by user input.

---

## Privacy Policy

Hosted at:
https://rohimayaventures.github.io/cardiodil-mobile/privacy-policy.html

Also accessible in-app at any time via Settings → Privacy Policy.

---

## Gamification

**Dil XP** — earned by logging meals, biometrics, and labs.
Log All awards 120 XP. Milestone acknowledgments at days 7, 14,
21, and 30.

**Phoenix Cycle** — 30-day recovery cycle. Resets and repeats.
Tracks consistency, not perfection.

**Streak Days** — consecutive days with at least one log entry.

---

## Phase 2 Roadmap

- Lab PDF upload with Claude OCR extraction
- Daily Heart Score auto-calculation via Supabase Edge Function
- Stripe billing with tier protection for founder accounts
- CardioDil Web (Next.js) with Three.js GLB heart model
- Correlation Engine — meals vs next-day HRV patterns
- Push notifications for daily check-in and streak reminders
- Open Food Facts and USDA barcode scan integration
- LaidOffRise MCP and Ask Hannah MCP integrations

---

## Built By

Rohimaya Health AI / Pagade Ventures
Westminster, Colorado
Hannah Kraulik Pagade — Clinical Operator, AI Product Builder

*CardioDil AI is not a medical device. Not a substitute for
professional medical advice. In an emergency call 911.*
