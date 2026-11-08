import { Children, useState, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { Button } from './button';
import { SectionTitle } from './section-title';
import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, space } from './tokens';

/** Qual card está à esquerda; no fim da rolagem, o último (ele nunca chega a encostar na borda). */
export function carouselIndex(
  { contentOffset, contentSize, layoutMeasurement }: NativeScrollEvent,
  step: number,
  count: number,
) {
  if (contentOffset.x + layoutMeasurement.width >= contentSize.width - 1) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.round(contentOffset.x / step)));
}

/**
 * Faixa horizontal de cards (C01b): o último aparece cortado na borda para mostrar que rola.
 * Rola de card em card; os pontos embaixo dizem onde se está (decorativos: o leitor de tela já
 * percorre os cards). "Ver todos" fica no título, para quem prefere a lista inteira.
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
  const styles = useThemedStyles(makeStyles);
  const count = Children.count(children);
  const [index, setIndex] = useState(0);
  const step = itemWidth + space.md;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(carouselIndex(e.nativeEvent, step, count));
  };
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
        snapToInterval={step}
        snapToAlignment="start"
        onScroll={onScroll}
        testID="carousel-scroll"
        scrollEventThrottle={64}
        // Sai da margem da tela para o card encostar na borda e mostrar que continua.
        style={styles.bleed}
        contentContainerStyle={styles.row}
      >
        {children}
      </ScrollView>
      {count > 1 ? (
        <View
          style={styles.dots}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="carousel-dots"
        >
          {Array.from({ length: count }, (_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    section: { gap: space.sm },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bleed: { marginHorizontal: -space.lg },
    row: { gap: space.md, paddingHorizontal: space.lg },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: space.xs + 2 },
    dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.border },
    dotOn: { width: 18, backgroundColor: colors.primary },
  });
