import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '../contexts/HistoryContext';
import { useI18n } from '../contexts/I18nContext';
import HistoryListItem from '../components/HistoryListItem';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Colors, Spacing, Typography } from '../constants/theme';

type RootStackParamList = {
  History: undefined;
  HistoryDetail: { entryId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const { history, isLoading, refreshHistory, clearHistory, removeEntry } = useHistory();
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleClearHistory = () => {
    setShowClearModal(true);
  };

  const confirmClearHistory = async () => {
    await clearHistory();
    setShowClearModal(false);
  };

  const handleItemPress = (entryId: string) => {
    navigation.navigate('HistoryDetail', { entryId });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        history.length > 0 ? (
          <Ionicons
            name="trash-outline"
            size={24}
            color={theme.text}
            onPress={handleClearHistory}
            style={{ marginRight: Spacing.m }}
          />
        ) : null,
    });
  }, [navigation, history.length, theme.text]);

  if (history.length === 0 && !isLoading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Ionicons name="time-outline" size={80} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {t('history.empty')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {t('history.emptySubtitle')}
        </Text>
      </View>
    );
  }

  const workoutCountText =
    history.length === 1
      ? t('history.workoutsCount_one').replace('{{count}}', '1')
      : t('history.workoutsCount_other').replace('{{count}}', String(history.length));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryListItem
            entry={item}
            onPress={() => handleItemPress(item.id)}
            onDelete={() => setItemToDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: theme.textSecondary }]}>
              {workoutCountText}
            </Text>
          </View>
        }
      />

      <ConfirmationModal
        visible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearHistory}
        title={t('history.clearConfirmTitle')}
        message={t('history.clearConfirmMessage')}
        confirmText={t('history.confirmClear')}
        cancelText={t('history.cancel')}
        variant="danger"
      />

      {/* Delete Single Entry Modal */}
      <ConfirmationModal
        visible={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await removeEntry(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title={t("history.removeOne.title")}
        message={t("history.removeOne.message")}
        confirmText={t("history.removeOne.confirm")}
        cancelText={t("history.removeOne.cancel")}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h2,
    marginTop: Spacing.l,
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: Spacing.s,
  },
  headerContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  headerText: {
    ...Typography.bodySmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
