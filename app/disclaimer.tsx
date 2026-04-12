import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { COLORS, RADIUS } from '../src/constants/theme';

// First Launch Disclaimer — CardioDil AI
// Shown once on first launch, acceptance tracked in user_profiles
// Also accessible from Settings at any time
// Apple App Store Review Guidelines 5.1.3 compliance
// gestureEnabled false prevents swipe-to-dismiss

const PRIVACY_POLICY_URL = 'https://your-privacy-policy-url.com';

export default function DisclaimerScreen() {
  const { userId } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  async function handleAccept() {
    if (!userId) return;
    setAccepting(true);
    try {
      await supabase
        .from('user_profiles')
        .update({
          disclaimer_accepted_at: new Date().toISOString(),
          terms_accepted_at:      new Date().toISOString(),
          onboarding_complete:    true,
          privacy_policy_version: '1.0',
        })
        .eq('id', userId);

      router.replace('/(tabs)');
    } catch (e) {
      console.error('[Disclaimer] Accept failed:', e);
    } finally {
      setAccepting(false);
    }
  }

  function handleScroll(event: any) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isNearBottom) setHasScrolled(true);
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.appName}>CardioDil AI</Text>
        <Text style={s.headerSub}>Rohimaya Health AI</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >

        {/* Emergency notice — always first */}
        <View style={s.emergencyCard}>
          <Text style={s.emergencyTitle}>IN A MEDICAL EMERGENCY</Text>
          <Text style={s.emergencyText}>
            Call 911 immediately. Do not rely on this app in an emergency.
          </Text>
        </View>

        {/* Medical disclaimer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>NOT A MEDICAL DEVICE</Text>
          <Text style={s.body}>
            CardioDil AI is a personal health tracking and education tool.
            It is NOT a medical device. It is NOT a substitute for professional
            medical advice, diagnosis, or treatment.
          </Text>
          <Text style={s.body}>
            Always consult a qualified physician or cardiologist before making
            any changes to your diet, exercise, or health management based on
            information from this app.
          </Text>
          <Text style={s.body}>
            Dil, the AI agent in this app, provides educational information only.
            Dil does not diagnose conditions, recommend medications, or replace
            your medical care team.
          </Text>
        </View>

        {/* Health data */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>YOUR HEALTH DATA</Text>
          <Text style={s.body}>
            This app reads health data from Apple HealthKit including heart rate,
            heart rate variability, blood oxygen, steps, sleep, and blood pressure.
            This data is stored securely in your private account and is never sold
            or shared with advertisers.
          </Text>
          <Text style={s.body}>
            Meal images are sent to Anthropic's Claude API for nutritional analysis.
            Images are not retained by Anthropic beyond the API call.
          </Text>
        </View>

        {/* Score limitations */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ABOUT YOUR SCORES</Text>
          <Text style={s.body}>
            Your Meal Score and Heart Score are educational estimates designed
            to help you understand general cardiac health trends. They are not
            clinical measurements and should not be used to make medical decisions.
          </Text>
          <Text style={s.body}>
            Lab result interpretation in this app is for reference only.
            Always discuss your lab results with your healthcare provider.
          </Text>
        </View>

        {/* No guarantees */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>NO GUARANTEES</Text>
          <Text style={s.body}>
            Rohimaya Health AI makes no guarantees about health outcomes
            from using this app. Individual results vary. This app is one
            tool among many in your cardiac health journey.
          </Text>
        </View>

        {/* Privacy */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PRIVACY POLICY</Text>
          <Text style={s.body}>
            By using CardioDil AI you agree to our Privacy Policy which
            describes how we collect, use, and protect your health data.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            style={s.linkBtn}
          >
            <Text style={s.linkText}>Read Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll nudge */}
        {!hasScrolled && (
          <Text style={s.scrollNudge}>
            Please scroll to read the full agreement before accepting.
          </Text>
        )}

        <View style={{ height: 16 }} />

      </ScrollView>

      {/* Accept button */}
      <View style={s.footer}>
        <Text style={s.footerNote}>
          By tapping I Understand and Agree you confirm you have read this
          disclosure and agree to the terms above.
        </Text>
        <TouchableOpacity
          style={[
            s.acceptBtn,
            (!hasScrolled || accepting) && s.acceptBtnDisabled,
          ]}
          onPress={handleAccept}
          disabled={!hasScrolled || accepting}
        >
          <Text style={s.acceptBtnText}>
            {accepting ? 'Saving...' : 'I Understand and Agree'}
          </Text>
        </TouchableOpacity>
        <Text style={s.footerSub}>
          CardioDil AI v1.0 by Rohimaya Health AI
        </Text>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    alignItems: 'center', padding: 20, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  appName:   { color: COLORS.gold, fontSize: 18, letterSpacing: 2, marginBottom: 2 },
  headerSub: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', letterSpacing: 1 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 8 },

  emergencyCard: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)',
    borderRadius: RADIUS.md, padding: 14, marginBottom: 20,
  },
  emergencyTitle: {
    color: COLORS.crimson, fontSize: 10,
    letterSpacing: 1.5, marginBottom: 6,
  },
  emergencyText: {
    color: COLORS.crimson, fontSize: 13,
    lineHeight: 20, fontWeight: '600',
  },

  section:      { marginBottom: 22 },
  sectionTitle: {
    color: COLORS.emeraldText, fontSize: 9,
    letterSpacing: 1.8, marginBottom: 10,
  },
  body: {
    color: COLORS.silver, fontSize: 13,
    lineHeight: 20, marginBottom: 10,
  },

  linkBtn:  { marginTop: 4 },
  linkText: {
    color: COLORS.emerald, fontSize: 13,
    textDecorationLine: 'underline',
  },

  scrollNudge: {
    color: 'rgba(148,163,184,0.4)', fontSize: 11,
    fontStyle: 'italic', textAlign: 'center', marginTop: 8,
  },

  footer: {
    padding: 16, borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  footerNote: {
    color: COLORS.silver, fontSize: 10,
    lineHeight: 16, marginBottom: 12,
    fontStyle: 'italic', textAlign: 'center',
  },
  acceptBtn: {
    backgroundColor: COLORS.emeraldDeep, borderWidth: 1,
    borderColor: COLORS.emerald, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center', marginBottom: 10,
  },
  acceptBtnDisabled: { opacity: 0.35 },
  acceptBtnText: {
    color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1.5,
  },
  footerSub: {
    color: 'rgba(148,163,184,0.3)', fontSize: 8,
    textAlign: 'center', letterSpacing: 1,
  },
});
