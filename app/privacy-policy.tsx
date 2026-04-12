import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../src/constants/theme';

// Privacy Policy — CardioDil AI
// In-app screen, Dil Vital dark theme
// Accessible from disclaimer screen and settings screen
// Satisfies Apple App Store requirement for privacy policy link
// Version 1.0 — April 2026

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Privacy Policy</Text>
          <Text style={s.headerSub}>Version 1.0 — April 2026</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        <Text style={s.intro}>
          CardioDil AI is a product of Rohimaya Health AI, operated under
          Pagade Ventures. This policy explains what data we collect, how
          we use it, and your rights.
        </Text>

        {/* Emergency */}
        <View style={s.emergencyCard}>
          <Text style={s.emergencyTitle}>MEDICAL DISCLAIMER</Text>
          <Text style={s.emergencyText}>
            CardioDil AI is NOT a medical device and is NOT a substitute
            for professional medical advice, diagnosis, or treatment.
            In an emergency, call 911 immediately.
          </Text>
        </View>

        <Section title="WHAT WE COLLECT">
          <Body>CardioDil AI collects the following data when you use the app:</Body>
          <Bullet>Email address for account creation and authentication.</Bullet>
          <Bullet>Health data you enter: lab results, biometrics, meal descriptions, exercise logs, stress levels, and sleep quality.</Bullet>
          <Bullet>Health data read from Apple HealthKit with your explicit permission: resting heart rate, heart rate variability, blood oxygen, steps, sleep duration, and blood pressure.</Bullet>
          <Bullet>Meal images you capture or select for nutritional analysis.</Bullet>
        </Section>

        <Section title="HOW WE USE YOUR DATA">
          <Bullet>To calculate your Meal Score and daily Heart Score.</Bullet>
          <Bullet>To generate personalized insights and responses from Dil, our AI cardiac health agent.</Bullet>
          <Bullet>To store your health history so Dil can identify trends over time.</Bullet>
          <Bullet>Meal images are sent to Anthropic's Claude API for nutritional analysis. Images are not retained by Anthropic beyond the API call.</Bullet>
          <Bullet>Dil's text responses are converted to voice via ElevenLabs. Text is not retained by ElevenLabs beyond the API call.</Bullet>
        </Section>

        <Section title="WHAT WE DO NOT DO">
          <Bullet>We do not sell your health data to any third party. Ever.</Bullet>
          <Bullet>We do not share your health data with advertisers.</Bullet>
          <Bullet>We do not use your health data to train AI models.</Bullet>
          <Bullet>We do not write data back to Apple HealthKit.</Bullet>
          <Bullet>We do not provide medical diagnoses or treatment recommendations.</Bullet>
        </Section>

        <Section title="HEALTHKIT DATA">
          <Body>
            CardioDil AI requests read-only access to Apple HealthKit for
            resting heart rate, heart rate variability, blood oxygen,
            step count, sleep analysis, and blood pressure. This data is
            used only within the app to calculate your Heart Score and
            provide context to Dil. It is stored in your private account
            and is never shared or sold.
          </Body>
          <Body>
            You can revoke HealthKit access at any time in iPhone Settings
            under Health {'>'} Apps {'>'} CardioDil AI.
          </Body>
        </Section>

        <Section title="DATA STORAGE AND SECURITY">
          <Body>
            Your health data is stored in a private Supabase database
            protected by Row Level Security. Only your authenticated
            account can read or write your data. We use industry-standard
            encryption in transit and at rest.
          </Body>
        </Section>

        <Section title="THIRD PARTY SERVICES">
          <Bullet>Supabase — database and authentication (supabase.com/privacy)</Bullet>
          <Bullet>Anthropic Claude API — meal image analysis and Dil conversation (anthropic.com/privacy)</Bullet>
          <Bullet>ElevenLabs — text to speech for Dil's voice (elevenlabs.io/privacy)</Bullet>
          <Bullet>USDA FoodData Central — nutritional reference data. No personal data shared.</Bullet>
          <Bullet>Open Food Facts — packaged food nutritional data. No personal data shared.</Bullet>
        </Section>

        <Section title="YOUR RIGHTS">
          <Body>
            You may request deletion of your account and all associated
            health data at any time by contacting us at
            privacy@rohimaya.ai. Deletion is completed within 30 days.
          </Body>
        </Section>

        <Section title="CHILDREN">
          <Body>
            CardioDil AI is not intended for users under 13 years of age.
            We do not knowingly collect data from children.
          </Body>
        </Section>

        <Section title="CHANGES TO THIS POLICY">
          <Body>
            If we make material changes to this policy we will notify you
            in the app and update the version date above.
          </Body>
        </Section>

        <Section title="CONTACT">
          <Body>Rohimaya Health AI / Pagade Ventures</Body>
          <Body>Westminster, Colorado</Body>
          <Body>privacy@rohimaya.ai</Body>
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>{'\u25E6'}</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 16, paddingTop: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 15, letterSpacing: 1.5 },
  headerSub:   { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  closeBtn: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  closeBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  intro: {
    color: COLORS.silver, fontSize: 13, lineHeight: 20,
    marginBottom: 16, fontStyle: 'italic',
  },

  emergencyCard: {
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.35)',
    borderRadius: RADIUS.md, padding: 14, marginBottom: 24,
  },
  emergencyTitle: {
    color: COLORS.crimson, fontSize: 9,
    letterSpacing: 1.8, marginBottom: 6,
  },
  emergencyText: {
    color: COLORS.crimson, fontSize: 13, lineHeight: 20,
  },

  section:      { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.emeraldText, fontSize: 8.5,
    letterSpacing: 1.8, marginBottom: 10,
  },
  body: {
    color: COLORS.silver, fontSize: 13,
    lineHeight: 20, marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row', gap: 8,
    marginBottom: 6, paddingRight: 8,
  },
  bulletDot:  { color: COLORS.emeraldText, fontSize: 12, marginTop: 2 },
  bulletText: { color: COLORS.silver, fontSize: 13, lineHeight: 20, flex: 1 },
});
