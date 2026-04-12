import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { COLORS, RADIUS } from '../src/constants/theme';

// Settings Screen — CardioDil AI
// Sign out, disclaimer, privacy policy, account info
// Accessible via a settings button added to the Dashboard header

export default function SettingsScreen() {
  const { userId, user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('display_name, tier, dil_xp, streak_days, phoenix_cycle_day, disclaimer_accepted_at, privacy_policy_version')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [userId]);

  async function handleSignOut() {
    Alert.alert(
      'Sign out',
      'You will need to sign back in to access your health data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/disclaimer');
          },
        },
      ]
    );
  }

  function formatDate(iso: string | null): string {
    if (!iso) return 'Not yet accepted';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* Account */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Email</Text>
            <Text style={s.rowValue}>{user?.email ?? '--'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Display name</Text>
            <Text style={s.rowValue}>{profile?.display_name ?? '--'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Tier</Text>
            <Text style={[s.rowValue, { color: COLORS.gold }]}>
              {profile?.tier ?? 'free'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>YOUR PROGRESS</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Dil XP</Text>
            <Text style={s.rowValue}>{profile?.dil_xp?.toLocaleString() ?? '0'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Streak</Text>
            <Text style={s.rowValue}>{profile?.streak_days ?? 0} days</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Phoenix Cycle</Text>
            <Text style={s.rowValue}>Day {profile?.phoenix_cycle_day ?? 1} of 30</Text>
          </View>
        </View>

        {/* Legal */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>LEGAL AND PRIVACY</Text>

          <TouchableOpacity
            style={s.navRow}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={s.navRowLabel}>Privacy Policy</Text>
            <Text style={s.navRowChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.navRow}
            onPress={() => router.push('/disclaimer')}
          >
            <Text style={s.navRowLabel}>Medical Disclaimer</Text>
            <Text style={s.navRowChevron}>›</Text>
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.rowLabel}>Disclaimer accepted</Text>
            <Text style={s.rowValue}>
              {formatDate(profile?.disclaimer_accepted_at ?? null)}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Privacy policy version</Text>
            <Text style={s.rowValue}>{profile?.privacy_policy_version ?? '1.0'}</Text>
          </View>
        </View>

        {/* App info */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>APP</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>0.1.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Built by</Text>
            <Text style={s.rowValue}>Rohimaya Health AI</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Contact</Text>
            <Text style={s.rowValue}>privacy@rohimaya.ai</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Not a medical device */}
        <Text style={s.legalNote}>
          CardioDil AI is not a medical device and is not a substitute
          for professional medical advice. In an emergency call 911.
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingTop: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { color: COLORS.emeraldText, fontSize: 15, letterSpacing: 1.5 },
  closeBtn: {
    backgroundColor: COLORS.elevated, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  closeBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  section:      { marginBottom: 20 },
  sectionLabel: {
    color: COLORS.silver, fontSize: 7.5,
    letterSpacing: 1.8, marginBottom: 8,
  },

  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.silver, fontSize: 12 },
  rowValue: { color: COLORS.emeraldText, fontSize: 12, maxWidth: '55%', textAlign: 'right' },

  navRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  navRowLabel:   { color: COLORS.silver, fontSize: 12 },
  navRowChevron: { color: COLORS.silver, fontSize: 18 },

  signOutBtn: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
    borderRadius: RADIUS.md, padding: 14,
    alignItems: 'center', marginBottom: 20, marginTop: 8,
  },
  signOutText: { color: COLORS.crimson, fontSize: 11, letterSpacing: 1 },

  legalNote: {
    color: 'rgba(148,163,184,0.35)', fontSize: 10,
    fontStyle: 'italic', textAlign: 'center',
    lineHeight: 16, paddingHorizontal: 8,
  },
});
