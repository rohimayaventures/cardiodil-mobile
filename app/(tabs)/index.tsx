import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/theme';

// Splash / Dil screen — placeholder for Canvas heart character
// Full implementation comes in a later prompt

export default function DilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>CardioDil AI</Text>
      <Text style={styles.tagline}>"Know what your heart is eating."</Text>
      <Text style={styles.sub}>Dil is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    color: COLORS.silver,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  sub: {
    color: COLORS.emeraldText,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.65,
  },
});
