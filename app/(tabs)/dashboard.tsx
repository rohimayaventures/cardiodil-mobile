import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../src/constants/theme';

// Dashboard + Quick Log screen — placeholder
// Full implementation with biometrics and Quick Log comes in a later prompt

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.sub}>Heart Score, biometrics, and Quick Log coming next.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: 60 },
  title: { color: COLORS.emeraldText, fontSize: 18, letterSpacing: 2, marginBottom: 12 },
  sub: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
});
