import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '../contexts/HistoryContext';
import { useI18n } from '../contexts/I18nContext';
import { getHistoryEntryById } from '../lib/storage';
import { formatDateFull, formatDuration, formatDurationHuman } from '../utils/dateUtils';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

type RootStackParamList = {
  HistoryDetail: { entryId: string };
  TimerConfig: undefined;
  History: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryDetail'>;

export default function HistoryDetailScreen({ navigation, route }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const { t, language } = useI18n();

  const { entryId } = route.params;
  const [entry, setEntry] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    try {
      const data = await getHistoryEntryById(entryId);
      setEntry(data);
    } catch (error) {
      console.error('Error loading history entry:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatWorkout = () => {
    if (!entry) return;

    // Navigate to TimerConfig with the workout configuration
    navigation.navigate('TimerConfig', {
      // Pass the config to pre-fill the form
      initialConfig: entry.config,
      workoutType: entry.type,
      presetName: entry.presetName,
      presetCategory: entry.presetCategory,
    } as any);
  };

  const handleDeleteEntry = () => {
    // TODO: Implement delete single entry in V9
    // For now, this is disabled per V8 plan
    navigation.navigate('History');
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Ionicons
          name="trash-outline"
          size={24}
          color={theme.text}
          onPress={handleDeleteEntry}
          style={{ marginRight: Spacing.m }}
        />
      ),
    });
  }, [navigation, theme.text]);

  if (loading || !entry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t('history.loading')}
        </Text>
      </View>
    );
  }

  const workoutName = entry.type === 'preset' && entry.presetName
    ? entry.presetName
    : t('history.workoutManual');

  const statusIcon = entry.wasInterrupted ? 'close-circle' : 'checkmark-circle';
  const statusColor = entry.wasInterrupted ? Colors.error : Colors.success;
  const statusText = entry.wasInterrupted ? t('history.statusInterrupted') : t('history.statusCompleted');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name={statusIcon} size={24} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Workout Name */}
        <Text style={[styles.workoutName, { color: theme.text }]}>
          {workoutName}
        </Text>

        {/* Category Badge */}
        {entry.type === 'preset' && entry.presetCategory && (
          <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
              {entry.presetCategory}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          {formatDateFull(entry.date, language)}
        </Text>
      </View>

      {/* Duration Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('history.durationTotal')}
        </Text>
        <Text style={[styles.durationLarge, { color: theme.text }]}>
          {formatDuration(entry.duration)}
        </Text>
        <Text style={[styles.durationHuman, { color: theme.textSecondary }]}>
          {formatDurationHuman(entry.duration)}
        </Text>
      </View>

      {/* Configuration Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('history.configuration')}
        </Text>

        <View style={styles.configRow}>
          <View style={styles.configItem}>
            <Ionicons name="timer-outline" size={24} color={Colors.phasePreparation} />
            <Text style={[styles.configLabel, { color: theme.textSecondary }]}>
              {t('history.preparation')}
            </Text>
            <Text style={[styles.configValue, { color: theme.text }]}>
              {entry.config.preparation}s
            </Text>
          </View>

          <View style={styles.configItem}>
            <Ionicons name="fitness-outline" size={24} color={Colors.phaseExercise} />
            <Text style={[styles.configLabel, { color: theme.textSecondary }]}>
              {t('history.exercise')}
            </Text>
            <Text style={[styles.configValue, { color: theme.text }]}>
              {entry.config.exercise}s
            </Text>
          </View>
        </View>

        <View style={styles.configRow}>
          <View style={styles.configItem}>
            <Ionicons name="pause-outline" size={24} color={Colors.phaseRest} />
            <Text style={[styles.configLabel, { color: theme.textSecondary }]}>
              {t('history.rest')}
            </Text>
            <Text style={[styles.configValue, { color: theme.text }]}>
              {entry.config.rest}s
            </Text>
          </View>

          <View style={styles.configItem}>
            <Ionicons name="repeat-outline" size={24} color={Colors.primary} />
            <Text style={[styles.configLabel, { color: theme.textSecondary }]}>
              {t('history.rounds')}
            </Text>
            <Text style={[styles.configValue, { color: theme.text }]}>
              {entry.completedRounds}/{entry.config.rounds}
            </Text>
          </View>
        </View>
      </View>

      {/* Repeat Button */}
      <Pressable
        onPress={handleRepeatWorkout}
        style={({ pressed }) => [
          styles.repeatButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Ionicons name="refresh-outline" size={24} color={Colors.light.buttonText} />
        <Text style={styles.repeatButtonText}>{t('history.repeatWorkout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  loadingText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  card: {
    padding: Spacing.l,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.s,
    marginBottom: Spacing.m,
  },
  statusText: {
    ...Typography.button,
    marginLeft: Spacing.s,
  },
  workoutName: {
    ...Typography.h1,
    marginBottom: Spacing.s,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.s,
    marginBottom: Spacing.s,
  },
  categoryText: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateText: {
    ...Typography.body,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.m,
  },
  durationLarge: {
    ...Typography.display,
    textAlign: 'center',
  },
  durationHuman: {
    ...Typography.h3,
    textAlign: 'center',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.m,
  },
  configItem: {
    alignItems: 'center',
    flex: 1,
  },
  configLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  configValue: {
    ...Typography.h2,
    marginTop: Spacing.xs,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    marginTop: Spacing.s,
  },
  repeatButtonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
    marginLeft: Spacing.s,
  },
});
