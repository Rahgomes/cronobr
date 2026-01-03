import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/contexts/I18nContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type PreviewRouteProp = RouteProp<RootStackParamList, "WorkoutPreview">;

interface TimelineBlock {
  type: "prep" | "exercise" | "rest";
  duration: number;
  round?: number;
}

const PHASE_COLORS = {
  prep: Colors.phasePreparation,
  exercise: Colors.phaseExercise,
  rest: Colors.phaseRest,
};

function TimelineBlockComponent({
  block,
  index,
  totalBlocks,
}: {
  block: TimelineBlock;
  index: number;
  totalBlocks: number;
}) {
  const { theme } = useTheme();
  const { t, formatTime } = useI18n();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 200 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getLabel = () => {
    switch (block.type) {
      case "prep":
        return t("preview.prep");
      case "exercise":
        return block.round ? `${t("preview.exercise")} (R${block.round})` : t("preview.exercise");
      case "rest":
        return block.round ? `${t("preview.rest")} (R${block.round})` : t("preview.rest");
    }
  };

  const getIcon = (): keyof typeof Feather.glyphMap => {
    switch (block.type) {
      case "prep":
        return "clock";
      case "exercise":
        return "zap";
      case "rest":
        return "wind";
    }
  };

  const formatBlockTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.blockContainer}>
        <View style={[styles.timelineLine, { backgroundColor: theme.backgroundSecondary }]}>
          {index < totalBlocks - 1 ? (
            <View
              style={[styles.lineConnector, { backgroundColor: PHASE_COLORS[block.type] + "40" }]}
            />
          ) : null}
        </View>
        <View
          style={[styles.blockDot, { backgroundColor: PHASE_COLORS[block.type] }]}
        >
          <Feather name={getIcon()} size={14} color="#FFFFFF" />
        </View>
        <Card style={StyleSheet.flatten([styles.blockCard, { borderLeftColor: PHASE_COLORS[block.type] }])}>
          <View style={styles.blockContent}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {getLabel()}
            </ThemedText>
            <ThemedText type="h3" style={{ color: PHASE_COLORS[block.type] }}>
              {formatBlockTime(block.duration)}
            </ThemedText>
          </View>
        </Card>
      </View>
    </Animated.View>
  );
}

export default function WorkoutPreviewScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<PreviewRouteProp>();
  const { theme } = useTheme();
  const { t, formatTime } = useI18n();

  const { prepTime, exerciseTime, restTime, rounds } = route.params;

  const buildTimeline = (): TimelineBlock[] => {
    const blocks: TimelineBlock[] = [];
    
    blocks.push({ type: "prep", duration: prepTime });
    
    for (let i = 1; i <= rounds; i++) {
      blocks.push({ type: "exercise", duration: exerciseTime, round: i });
      if (i < rounds) {
        blocks.push({ type: "rest", duration: restTime, round: i });
      }
    }
    
    return blocks;
  };

  const timeline = buildTimeline();

  const totalTime = rounds > 0
    ? prepTime + (exerciseTime + restTime) * rounds - restTime
    : prepTime;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.m,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.m,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.summaryCard}>
          <Card style={styles.totalCard}>
            <View style={styles.totalContent}>
              <View style={styles.totalInfo}>
                <Feather name="clock" size={24} color={Colors.primary} />
                <View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {t("preview.totalTime")}
                  </ThemedText>
                  <ThemedText type="h2" style={{ color: Colors.primary }}>
                    {formatTime(totalTime)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Rounds
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {rounds}x
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Phases
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {timeline.length}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        <ThemedText type="h3" style={styles.sectionTitle}>
          Timeline
        </ThemedText>

        <View style={styles.timelineContainer}>
          {timeline.map((block, index) => (
            <TimelineBlockComponent
              key={`${block.type}-${index}`}
              block={block}
              index={index}
              totalBlocks={timeline.length}
            />
          ))}
        </View>
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
  summaryCard: {
    marginBottom: Spacing.l,
  },
  totalCard: {
    padding: Spacing.l,
  },
  totalContent: {
    gap: Spacing.m,
  },
  totalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.l,
  },
  statItem: {
    gap: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  timelineContainer: {
    gap: Spacing.s,
  },
  blockContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.m,
    marginLeft: Spacing.s,
  },
  timelineLine: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 0,
    width: 2,
  },
  lineConnector: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    bottom: -10,
  },
  blockDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  blockCard: {
    flex: 1,
    padding: Spacing.m,
    borderLeftWidth: 3,
  },
  blockContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
