import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../../src/constants/theme';

// Splash / Dil Screen — CardioDil AI
// Pulsating SVG heart with ripple rings on each beat
// 68 BPM default — syncs to real HealthKit HR in a later prompt
// All animations use native driver for smooth 60fps on device

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEART_SIZE = Math.min(SCREEN_WIDTH * 0.55, 220);
const BPM = 68;
const BEAT_INTERVAL = (60 / BPM) * 1000;
const ANIMATION_DURATION = 880;
const RING_COUNT = 3;
const RING_STAGGER = 400;

// SVG heart path — clean symmetric shape, center 100,100 in viewBox 0 0 200 200
// Bottom apex at (100,160), top notch at (100,69.6)
const HEART_PATH =
  'M 100 160 ' +
  'C 96 136, 29.6 101.6, 50.4 72 ' +
  'C 71.2 45.6, 96.8 58.4, 100 69.6 ' +
  'C 103.2 58.4, 128.8 45.6, 149.6 72 ' +
  'C 170.4 101.6, 104 136, 100 160 Z';

export default function DilScreen() {
  const heartScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  const rings = useRef(
    Array.from({ length: RING_COUNT }, () => ({
      opacity: new Animated.Value(0),
      scale:   new Animated.Value(0.9),
    }))
  ).current;

  function fireRipple() {
    rings.forEach((ring, i) => {
      setTimeout(() => {
        ring.opacity.setValue(0.65);
        ring.scale.setValue(0.92);
        Animated.parallel([
          Animated.timing(ring.opacity, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(ring.scale, {
            toValue: 1.85,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]).start();
      }, i * RING_STAGGER);
    });
  }

  function beatCycle() {
    // Systole: contract
    // Diastole: expand then settle
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 0.935,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1.02,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1.0,
        duration: 620,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const waitTime = Math.max(0, BEAT_INTERVAL - ANIMATION_DURATION);
      setTimeout(() => {
        fireRipple();
        beatCycle();
      }, waitTime);
    });
  }

  // Ambient glow breathes slowly
  function glowCycle() {
    Animated.sequence([
      Animated.timing(glowOpacity, {
        toValue: 0.85,
        duration: 2200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.45,
        duration: 2200,
        useNativeDriver: true,
      }),
    ]).start(() => glowCycle());
  }

  useEffect(() => {
    // Stagger start so ripples fire on the first beat
    const beatTimer = setTimeout(() => {
      fireRipple();
      beatCycle();
    }, 600);

    glowCycle();

    return () => clearTimeout(beatTimer);
  }, []);

  return (
    <SafeAreaView style={s.container}>

      {/* Ambient glow */}
      <Animated.View
        style={[
          s.glowWrap,
          { opacity: glowOpacity },
        ]}
      >
        <Svg width={HEART_SIZE * 2} height={HEART_SIZE * 2} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#22C55E" stopOpacity={0.18} />
              <Stop offset="55%"  stopColor="#166534" stopOpacity={0.06} />
              <Stop offset="100%" stopColor="#22C55E" stopOpacity={0}    />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="100" fill="url(#glow)" />
        </Svg>
      </Animated.View>

      {/* Ripple rings */}
      {rings.map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            s.ringWrap,
            {
              opacity:   ring.opacity,
              transform: [{ scale: ring.scale }],
            },
          ]}
        >
          <Svg
            width={HEART_SIZE}
            height={HEART_SIZE}
            viewBox="0 0 200 200"
          >
            <Path
              d={HEART_PATH}
              fill="none"
              stroke="#22C55E"
              strokeWidth={2.5}
              strokeOpacity={0.7}
            />
          </Svg>
        </Animated.View>
      ))}

      {/* Pulsating heart */}
      <Animated.View
        style={[
          s.heartWrap,
          { transform: [{ scale: heartScale }] },
        ]}
      >
        <Svg
          width={HEART_SIZE}
          height={HEART_SIZE}
          viewBox="0 0 200 200"
        >
          <Defs>
            <RadialGradient id="heartFill" cx="38%" cy="32%" r="65%">
              <Stop offset="0%"   stopColor="#22C55E" stopOpacity={0.9} />
              <Stop offset="38%"  stopColor="#166534" stopOpacity={0.72} />
              <Stop offset="78%"  stopColor="#0d2018" stopOpacity={0.55} />
              <Stop offset="100%" stopColor="#07140a" stopOpacity={0.30} />
            </RadialGradient>
          </Defs>
          {/* Fill */}
          <Path d={HEART_PATH} fill="url(#heartFill)" />
          {/* Specular highlight */}
          <Circle
            cx="78"
            cy="76"
            r="22"
            fill="#86EFAC"
            fillOpacity={0.12}
          />
          {/* Stroke */}
          <Path
            d={HEART_PATH}
            fill="none"
            stroke="#22C55E"
            strokeWidth={2.2}
            strokeOpacity={0.55}
          />
        </Svg>
      </Animated.View>

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

  glowWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ringWrap: {
    position: 'absolute',
    width: HEART_SIZE,
    height: HEART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartWrap: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    marginBottom: 20,
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
