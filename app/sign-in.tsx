import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { COLORS, RADIUS } from '../src/constants/theme';

// Sign In Screen — CardioDil AI
// Handles both sign in and account creation
// After sign in the tab layout disclaimer check runs
// and routes to disclaimer if not yet accepted

type Mode = 'signin' | 'signup';

export default function SignInScreen() {
  const [mode, setMode]           = useState<Mode>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message ?? 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { display_name: displayName.trim() || undefined },
        },
      });
      if (error) throw error;
      // Profile is auto-created by Supabase trigger on_auth_user_created
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Account creation failed', error.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email address above then tap Forgot Password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );
      if (error) throw error;
      Alert.alert(
        'Check your email',
        'A password reset link has been sent to ' + email.trim().toLowerCase()
      );
    } catch (error: any) {
      Alert.alert('Reset failed', error.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >

          {/* App identity */}
          <View style={s.identity}>
            <Text style={s.appName}>CardioDil AI</Text>
            <Text style={s.tagline}>"Know what your heart is eating."</Text>
            <Text style={s.brand}>Rohimaya Health AI</Text>
          </View>

          {/* Mode toggle */}
          <View style={s.modeRow}>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'signin' && s.modeBtnOn]}
              onPress={() => setMode('signin')}
            >
              <Text style={[s.modeBtnText, mode === 'signin' && s.modeBtnTextOn]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeBtn, mode === 'signup' && s.modeBtnOn]}
              onPress={() => setMode('signup')}
            >
              <Text style={[s.modeBtnText, mode === 'signup' && s.modeBtnTextOn]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={s.form}>

            {mode === 'signup' && (
              <View style={s.fieldBlock}>
                <Text style={s.fieldLabel}>YOUR NAME</Text>
                <TextInput
                  style={s.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="How should Dil address you?"
                  placeholderTextColor="rgba(148,163,184,0.35)"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="rgba(148,163,184,0.35)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.fieldBlock}>
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Your password'}
                placeholderTextColor="rgba(148,163,184,0.35)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Primary action */}
            <TouchableOpacity
              style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={COLORS.emeraldText} />
                : <Text style={s.primaryBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Forgot password */}
            {mode === 'signin' && (
              <TouchableOpacity
                style={s.forgotBtn}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={s.forgotBtnText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

          </View>

          {/* Disclaimer note */}
          <Text style={s.disclaimerNote}>
            By creating an account you agree to our medical disclaimer
            and privacy policy. CardioDil AI is not a medical device.
          </Text>

          {/* Legal */}
          <Text style={s.legal}>
            In an emergency call 911.{'\n'}
            CardioDil AI v1.0 by Rohimaya Health AI
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  content: {
    flexGrow: 1, padding: 28,
    justifyContent: 'center', paddingTop: 60,
  },

  identity: { alignItems: 'center', marginBottom: 40 },
  appName: {
    color: COLORS.gold, fontSize: 24,
    letterSpacing: 2, marginBottom: 8,
  },
  tagline: {
    color: COLORS.silver, fontSize: 13,
    fontStyle: 'italic', textAlign: 'center',
    lineHeight: 20, marginBottom: 8,
  },
  brand: {
    color: 'rgba(148,163,184,0.4)',
    fontSize: 9, letterSpacing: 2,
  },

  modeRow: {
    flexDirection: 'row', gap: 8,
    marginBottom: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, padding: 4,
  },
  modeBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: RADIUS.full, alignItems: 'center',
  },
  modeBtnOn: {
    backgroundColor: COLORS.emeraldDeep,
    borderWidth: 1, borderColor: COLORS.emerald,
  },
  modeBtnText:    { color: COLORS.silver, fontSize: 11, letterSpacing: 1 },
  modeBtnTextOn:  { color: COLORS.emeraldText },

  form: { gap: 16, marginBottom: 24 },

  fieldBlock: { gap: 6 },
  fieldLabel: {
    color: COLORS.silver, fontSize: 7.5, letterSpacing: 1.8,
  },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.emeraldText, fontSize: 14,
  },

  primaryBtn: {
    backgroundColor: COLORS.emeraldDeep,
    borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.md, padding: 14,
    alignItems: 'center', marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1.5,
  },

  forgotBtn:     { alignItems: 'center', paddingVertical: 8 },
  forgotBtnText: {
    color: COLORS.silver, fontSize: 11,
    fontStyle: 'italic', textDecorationLine: 'underline',
  },

  disclaimerNote: {
    color: 'rgba(148,163,184,0.45)', fontSize: 10,
    fontStyle: 'italic', textAlign: 'center',
    lineHeight: 16, marginBottom: 16,
  },
  legal: {
    color: 'rgba(148,163,184,0.25)', fontSize: 8,
    textAlign: 'center', letterSpacing: 0.5, lineHeight: 14,
  },
});
