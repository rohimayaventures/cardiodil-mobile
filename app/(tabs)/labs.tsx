import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../src/constants/theme';

// Lab Vault / Trends screen — placeholder
// LDL trend chart and weekly insight coming in a later prompt

export default function LabsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lab Vault / Trends</Text>
      <Text style={styles.sub}>LDL trend chart and Dil weekly insight coming next.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: 60 },
  title: { color: COLORS.emeraldText, fontSize: 18, letterSpacing: 2, marginBottom: 12 },
  sub: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
});
