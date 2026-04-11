import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/theme';

// Dil Chat screen — placeholder
// Claude API conversation and ElevenLabs voice coming in a later prompt

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dil</Text>
      <Text style={styles.sub}>One question at a time. Always.</Text>
      <Text style={styles.note}>Claude API conversation coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { color: COLORS.gold, fontSize: 18, letterSpacing: 3, marginBottom: 10 },
  sub: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  note: { color: COLORS.silver, fontSize: 11, opacity: 0.5, fontStyle: 'italic' },
});
