import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function AboutScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <ThemedText type="h2" style={styles.title}>
          CronôBR
        </ThemedText>
        <ThemedText type="body" style={[styles.text, { color: theme.textSecondary }]}>
          Versão 9.0
        </ThemedText>
        <ThemedText type="body" style={[styles.text, { color: theme.textSecondary, marginTop: Spacing.l }]}>
          Seu parceiro de treino profissional.
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.l,
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.s,
  },
  text: {
    textAlign: "center",
  },
});
