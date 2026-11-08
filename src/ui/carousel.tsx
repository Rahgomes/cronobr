import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from './button';
import { SectionTitle } from './section-title';
import { space } from './tokens';

/**
 * Faixa horizontal de cards (C01b): o último aparece cortado na borda para mostrar que rola.
 * Rola de card em card. "Ver todos" fica no título, para quem prefere a lista inteira.
 */
export function Carousel({
  title,
  itemWidth,
  seeAll,
  children,
}: {
  title: string;
  itemWidth: number;
  seeAll?: { label: string; onPress: () => void } | undefined;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionTitle>{title}</SectionTitle>
        {seeAll ? <Button label={seeAll.label} kind="text" onPress={seeAll.onPress} /> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + space.md}
        snapToAlignment="start"
        // Sai da margem da tela para o card encostar na borda e mostrar que continua.
        style={styles.bleed}
        contentContainerStyle={styles.row}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bleed: { marginHorizontal: -space.lg },
  row: { gap: space.md, paddingHorizontal: space.lg },
});
