import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/theme';

// Meal Vision / Brand Intelligence screen — placeholder
// Claude vision integration and food scoring comes in a later prompt

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Vision</Text>
      <Text style={styles.sub}>Brand Intelligence and meal scoring coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { color: COLORS.emeraldText, fontSize: 18, letterSpacing: 2, marginBottom: 12 },
  sub: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
});
