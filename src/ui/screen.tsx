import {
  createContext,
  useContext,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Colors } from './theme';
import { useThemedStyles } from './theme-context';
import { radius, space, touch } from './tokens';

type Props = {
  children: ReactNode;
  /** Ações principais presas embaixo: aparecem em qualquer altura de tela, o conteúdo rola. */
  footer?: ReactNode;
  /** Ação flutuante no canto (ex.: "+ Agendar" das abas): ocupa só o botão, não uma faixa inteira. */
  fab?: ReactNode;
  /** Para a tela rolar até uma seção (ex.: o atalho "Foto do espaço" da Hoje). */
  scrollRef?: RefObject<ComponentRef<typeof ScrollView> | null>;
  /**
   * Visual v2: cor da faixa da barra de status, para o cabeçalho colorido da tela começar lá em
   * cima (a Hoje). O conteúdo rola por baixo dela, então os ícones brancos seguem legíveis.
   */
  statusTint?: string;
};

/**
 * Verdadeiro nas telas das abas: a barra de abas já soma a área da barra de gestos. Somar de novo
 * aqui deixava uma faixa vazia da altura dela acima das abas, com o "+ Agendar" metade dentro
 * (teste interno, Galaxy A54).
 */
export const InsideTabsContext = createContext(false);

/** Toda tela passa por aqui: edge-to-edge do targetSdk 36 exige respeitar as áreas seguras. */
export function Screen({ children, footer, fab, scrollRef, statusTint }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insideTabs = useContext(InsideTabsContext);
  return (
    <SafeAreaView
      // Com statusTint, o recuo do topo (atrás da barra de status) pinta na cor do cabeçalho.
      style={[styles.safe, statusTint ? { backgroundColor: statusTint } : null]}
      edges={insideTabs ? ['top'] : ['top', 'bottom']}
    >
      <ScrollView
        style={styles.scroll}
        ref={scrollRef}
        contentContainerStyle={[styles.content, fab ? styles.fabRoom : null]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {fab ? (
        <View style={styles.fab} pointerEvents="box-none">
          {fab}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Tela com lista longa (PRD 23 PF1): FlatList virtualizada no lugar do ScrollView, com o mesmo
 * respiro, FAB e áreas seguras do Screen. Lista dentro de ScrollView perde a virtualização, por
 * isso o que vem antes da lista entra como `header` (elemento, não componente: o campo de busca
 * não remonta a cada letra).
 */
export function ListScreen<T>({
  header,
  data,
  renderItem,
  keyExtractor,
  after,
  footer,
  fab,
  statusTint,
  extraData,
}: {
  header: ReactNode;
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  /** Depois da lista (sheets, avisos do fim). */
  after?: ReactNode;
  /** Ações presas embaixo, como no Screen. */
  footer?: ReactNode;
  fab?: ReactNode;
  statusTint?: string;
  /** O que muda a linha sem mudar a lista (ex.: quem está marcada): a FlatList redesenha. */
  extraData?: unknown;
}) {
  const styles = useThemedStyles(makeStyles);
  const insideTabs = useContext(InsideTabsContext);
  return (
    <SafeAreaView
      style={[styles.safe, statusTint ? { backgroundColor: statusTint } : null]}
      edges={insideTabs ? ['top'] : ['top', 'bottom']}
    >
      <FlatList
        style={styles.scroll}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<View style={[styles.block, styles.listHeader]}>{header}</View>}
        {...(after
          ? { ListFooterComponent: <View style={[styles.block, styles.listFooter]}>{after}</View> }
          : {})}
        // Espaço entre linhas por separador, não por gap: o gap somava nos espaçadores invisíveis
        // que a virtualização põe no lugar das linhas fora da tela.
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.listContent, fab ? styles.fabRoom : null]}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        extraData={extraData}
      />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {fab ? (
        <View style={styles.fab} pointerEvents="box-none">
          {fab}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Separator() {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.separator} />;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { backgroundColor: colors.background },
    content: { flexGrow: 1, padding: space.lg, gap: space.lg },
    block: { gap: space.lg },
    listContent: { flexGrow: 1, padding: space.lg },
    listHeader: { marginBottom: space.lg },
    listFooter: { marginTop: space.lg },
    separator: { height: space.md },
    // O fim da lista rola para cima do botão flutuante em vez de ficar escondido atrás dele.
    fabRoom: { paddingBottom: touch.button + space.xl * 2 },
    fab: {
      position: 'absolute',
      right: space.lg,
      bottom: space.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      elevation: 6,
      shadowColor: colors.text,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    footer: {
      gap: space.sm,
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.md,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
