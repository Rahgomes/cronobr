import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme-context';
import { space } from '@/ui/tokens';

export default function NotFound() {
  const colors = useColors();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text variant="title" accessibilityRole="header">
        Página não encontrada
      </Text>
      <Button
        label="Voltar ao início"
        onPress={() => {
          router.replace('/');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg },
});
