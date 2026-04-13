import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../../src/constants/theme';
import DilHeart3D from '../../src/components/DilHeart3D';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEART_SIZE = Math.min(SCREEN_WIDTH * 0.55, 220);
const BPM = 68;

export default function DilScreen() {
  return (
    <SafeAreaView style={s.container}>

      {/* 3D Heart — DilHeart3D */}
      <DilHeart3D bpm={BPM} size={HEART_SIZE} />

      {/* App name */}
      <Text style={s.appName}>CardioDil AI</Text>

      {/* Tagline */}
      <Text style={s.tagline}>"Know what your heart is eating."</Text>

      {/* Enter button */}
      <TouchableOpacity
        style={s.enterBtn}
        onPress={() => router.push('/(tabs)/dashboard')}
        activeOpacity={0.75}
      >
        <Text style={s.enterBtnText}>Enter</Text>
      </TouchableOpacity>

      {/* Dil ready */}
      <Text style={s.dilReady}>Dil is ready.</Text>

      {/* Badge */}
      <Text style={s.badge}>Rohimaya Health AI</Text>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  appName: {
    color: COLORS.gold,
    fontSize: 22,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },

  tagline: {
    color: COLORS.silver,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  enterBtn: {
    borderWidth: 1,
    borderColor: COLORS.emerald,
    borderRadius: RADIUS.full,
    paddingHorizontal: 32,
    paddingVertical: 11,
    backgroundColor: 'transparent',
    marginBottom: 14,
  },

  enterBtnText: {
    color: COLORS.emeraldText,
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'center',
  },

  dilReady: {
    color: COLORS.emeraldText,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.65,
    marginBottom: 24,
  },

  badge: {
    color: 'rgba(148,163,184,0.25)',
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    position: 'absolute',
    bottom: 32,
  },
});
