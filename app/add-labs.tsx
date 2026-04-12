import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS } from '../src/constants/theme';

/** Placeholder modal — full Add Labs form can land here in a follow-up. */
export default function AddLabsScreen() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Add Labs</Text>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <Text style={s.hint}>Lab entry form will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: COLORS.emeraldText, fontSize: 16, letterSpacing: 2 },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
  },
  closeText: { color: COLORS.silver, fontSize: 12 },
  body: { flex: 1, padding: 20, justifyContent: 'center' },
  hint: { color: COLORS.silver, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
});
