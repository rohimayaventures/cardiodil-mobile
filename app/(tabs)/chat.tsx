import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS, RADIUS } from '../../src/constants/theme';
import { buildDilSystemPrompt, DilContext } from '../../src/lib/dilSystemPrompt';
import { speak, stopDil, isSpeaking } from '../../src/lib/elevenlabs';
import {
  getTodayBiometrics,
  getTodayMeals,
  getWeeklyMealAverage,
  getRecentLabs,
  getUserProfile,
} from '../../src/lib/supabase';
import { MORNING_GREETINGS, getDilResponse } from '../../src/lib/dilPersonality';

// Dil Chat Screen — CardioDil AI
// Conversational interface with Dil powered by Claude Sonnet
// Voice output via ElevenLabs TTS
// Full health context injected into every Claude API call
// One question per turn enforced in system prompt
//
// SECURITY NOTE: For Phase 1 (single user), API key is on client.
// Phase 2+: proxy through Supabase Edge Function or Cloudflare Worker.

interface Message {
  id: string;
  role: 'user' | 'dil';
  content: string;
  timestamp: Date;
}

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!;

export default function ChatScreen() {
  const { userId, signedIn } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dilSpeaking, setDilSpeaking] = useState(false);
  const [context, setContext] = useState<DilContext>({});

  // Load full health context for system prompt
  const loadContext = useCallback(async () => {
    if (!userId) return;
    try {
      const [biometrics, meals, labs, weeklyAvg, profile] = await Promise.all([
        getTodayBiometrics(userId),
        getTodayMeals(userId),
        getRecentLabs(userId, 3),
        getWeeklyMealAverage(userId),
        getUserProfile(userId),
      ]);

      // Detect LDL trend from last 3 draws
      let ldlTrend: DilContext['ldlTrend'] = null;
      if (labs.length >= 3) {
        const ldls = labs.slice(0, 3).map((l: any) => l.ldl ?? 0);
        if (ldls[0] > ldls[1] && ldls[1] > ldls[2]) ldlTrend = 'rising';
        else if (ldls[0] < ldls[1] && ldls[1] < ldls[2]) ldlTrend = 'falling';
        else ldlTrend = 'stable';
      }

      setContext({
        userProfile: profile
          ? {
              display_name: profile.display_name ?? undefined,
              dietary_preferences: profile.dietary_preferences ?? [],
              cuisine_preferences: profile.cuisine_preferences ?? [],
              wearable_device: profile.wearable_device ?? undefined,
              activity_level: profile.activity_level ?? undefined,
            }
          : undefined,
        biometrics: biometrics
          ? {
              resting_hr:    biometrics.resting_hr ?? undefined,
              hrv_sdnn:      biometrics.hrv_sdnn ?? undefined,
              spo2_avg:      biometrics.spo2_avg ?? undefined,
              sleep_hours:   biometrics.sleep_hours ?? undefined,
              systolic:      biometrics.systolic ?? undefined,
              diastolic:     biometrics.diastolic ?? undefined,
              steps:         biometrics.steps ?? undefined,
              stress_level:  biometrics.stress_level ?? undefined,
              input_method:  biometrics.input_method ?? undefined,
            }
          : undefined,
        latestLab: labs[0]
          ? {
              drawn_at:          labs[0].drawn_at,
              ldl:               labs[0].ldl ?? undefined,
              hdl:               labs[0].hdl ?? undefined,
              total_cholesterol: labs[0].total_cholesterol ?? undefined,
              triglycerides:     labs[0].triglycerides ?? undefined,
              apob:              labs[0].apob ?? undefined,
              hscrp:             labs[0].hscrp ?? undefined,
              glucose:           labs[0].glucose ?? undefined,
            }
          : undefined,
        ldlTrend,
        todayMeals: meals.map((m: any) => ({
          description:      m.description,
          heart_score:      m.heart_score,
          heart_score_tier: m.heart_score_tier ?? '',
          ldl_impact:       m.ldl_impact ?? '',
        })),
        weeklyMealAvg: weeklyAvg,
        streakDays:    profile?.streak_days ?? 0,
        phoenixDay:    profile?.phoenix_cycle_day ?? 1,
        dilXP:         profile?.dil_xp ?? 0,
      });
    } catch (e) {
      console.warn('[DilChat] Context load failed:', e);
    }
  }, [userId]);

  // Load context and show Dil's opening message
  useEffect(() => {
    loadContext().then(() => {
      const greeting = MORNING_GREETINGS.all_clear();
      const opening: Message = {
        id: Date.now().toString(),
        role: 'dil',
        content: greeting,
        timestamp: new Date(),
      };
      setMessages([opening]);
      speakDil(greeting);
    });
  }, [loadContext]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  async function speakDil(text: string) {
    setDilSpeaking(true);
    await speak(text);
    setDilSpeaking(false);
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Stop Dil if currently speaking
    if (isSpeaking()) await stopDil();

    try {
      // Build conversation history for Claude (excluding opening greeting)
      const history = messages
        .filter((m) => m.role === 'user' || m.id !== messages[0]?.id)
        .map((m) => ({
          role: m.role === 'dil' ? 'assistant' : 'user',
          content: m.content,
        }));

      history.push({ role: 'user', content: userMessage.content });

      const systemPrompt = buildDilSystemPrompt(context);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          messages: history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const dilContent =
        data.content?.[0]?.type === 'text'
          ? data.content[0].text
          : 'I had trouble responding. Try again.';

      const dilMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dil',
        content: dilContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, dilMessage]);
      speakDil(dilContent);
    } catch (error) {
      console.error('[DilChat] Claude API failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dil',
        content: 'Something went wrong on my end. Check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (!signedIn) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.signedOutState}>
          <Text style={s.signedOutTitle}>Dil</Text>
          <Text style={s.signedOutText}>
            Sign in to start a conversation with Dil.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={[s.statusDot, { backgroundColor: dilSpeaking ? COLORS.emerald : COLORS.emeraldDeep }]} />
            <View>
              <Text style={s.headerName}>Dil</Text>
              <Text style={s.headerStatus}>
                {dilSpeaking ? 'Speaking...' : isLoading ? 'Thinking...' : 'One question at a time. Always.'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.muteBtn}
            onPress={() => isSpeaking() ? stopDil() : null}
          >
            <Text style={s.muteBtnText}>{dilSpeaking ? 'Mute' : '   '}</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                s.messageWrapper,
                msg.role === 'user' ? s.userWrapper : s.dilWrapper,
              ]}
            >
              {msg.role === 'dil' && (
                <Text style={s.senderLabel}>DIL</Text>
              )}
              <View style={[
                s.bubble,
                msg.role === 'dil' ? s.dilBubble : s.userBubble,
              ]}>
                <Text style={[
                  s.bubbleText,
                  msg.role === 'dil' ? s.dilText : s.userText,
                ]}>
                  {msg.content}
                </Text>
              </View>
              <Text style={s.timestamp}>{formatTime(msg.timestamp)}</Text>
            </View>
          ))}

          {isLoading && (
            <View style={s.dilWrapper}>
              <Text style={s.senderLabel}>DIL</Text>
              <View style={s.dilBubble}>
                <ActivityIndicator size="small" color={COLORS.emerald} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Dil anything..."
            placeholderTextColor={COLORS.silver}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || isLoading) && s.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Text style={s.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14, paddingTop: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  headerName: {
    color: COLORS.emeraldText, fontSize: 15, letterSpacing: 1.5,
  },
  headerStatus: {
    color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 1,
  },
  muteBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  muteBtnText: { color: COLORS.silver, fontSize: 10, letterSpacing: 0.5 },

  messages: { flex: 1 },
  messagesContent: { padding: 14, gap: 12, paddingBottom: 8 },

  messageWrapper: { maxWidth: '88%', gap: 3 },
  dilWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end' },

  senderLabel: {
    color: COLORS.emeraldText, fontSize: 7.5,
    letterSpacing: 2, marginBottom: 2, marginLeft: 2,
  },

  bubble: { borderRadius: 14, padding: 10 },
  dilBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 2, borderLeftColor: COLORS.emeraldDeep,
    borderRadius: 3,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopRightRadius: 14,
    minHeight: 38,
    justifyContent: 'center',
  },
  userBubble: {
    backgroundColor: COLORS.elevated,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.18)',
    borderRadius: 14,
    borderTopRightRadius: 3,
  },

  bubbleText: { fontSize: 13, lineHeight: 20 },
  dilText: { color: COLORS.silver, fontStyle: 'italic' },
  userText: { color: COLORS.emeraldText },

  timestamp: {
    color: 'rgba(148,163,184,0.35)', fontSize: 8,
    fontStyle: 'italic', marginLeft: 4,
  },

  inputRow: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface, alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: COLORS.elevated,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 10,
    color: COLORS.silver, fontSize: 13, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: COLORS.emeraldDeep,
    borderWidth: 1, borderColor: COLORS.emerald,
    borderRadius: RADIUS.md, paddingHorizontal: 16,
    paddingVertical: 10, justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: COLORS.emeraldText, fontSize: 11, letterSpacing: 1 },

  signedOutState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  signedOutTitle: { color: COLORS.gold, fontSize: 22, letterSpacing: 3, marginBottom: 10 },
  signedOutText: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
});
