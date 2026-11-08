// Corpo da sessão nas três visualizações (P1). Todas leem o mesmo estado do motor: trocar de
// visualização não muda nada no tempo, só no desenho.
import { Pressable, StyleSheet, View } from 'react-native';

import { ownName, segmentTitle } from '@/domain/cues';
import type { Snapshot } from '@/domain/engine';
import { clock, duration } from '@/domain/format';
import { overallProgress, phaseProgress, rowState, type RowState } from '@/domain/progress';
import type { Phase, Segment } from '@/domain/timeline';
import type { Words } from '@/domain/words';
import { useT } from '@/i18n/i18n-context';
import { ProgressRing } from '@/ui/progress-ring';
import { Text } from '@/ui/text';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space, type ColorRole } from '@/ui/tokens';

import { roundLabel } from './labels';

export const PHASE_TINT: Record<Phase, ColorRole> = {
  prep: 'phasePrep',
  work: 'phaseWork',
  rest: 'phaseRest',
  blockRest: 'phaseBlockRest',
  cooldown: 'phaseCooldown',
};

export interface BodyProps {
  timeline: readonly Segment[];
  snap: Snapshot;
  segment: Segment;
}

/** Número grande: o que falta, ou as repetições numa etapa manual. */
function BigTime({ segment, snap, size, color }: BodyProps & { size: number; color?: string }) {
  const manual = segment.durationMs === null;
  return (
    <Text
      variant="display"
      tabular
      style={[
        { fontSize: size, lineHeight: Math.round(size * 1.1) },
        styles.center,
        color ? { color } : null,
      ]}
      accessibilityRole="timer"
      accessibilityLabel={
        manual
          ? `${String(segment.reps)} repetições`
          : `Faltam ${duration(Math.ceil((snap.remainingMs ?? 0) / 1000) * 1000)}`
      }
    >
      {manual ? `${String(segment.reps)} rep.` : clock(snap.remainingMs ?? 0)}
    </Text>
  );
}

function nextLine(next: Segment | undefined, w: Words): string {
  if (!next) return 'Última etapa';
  const time = next.durationMs === null ? `${String(next.reps)} rep.` : clock(next.durationMs);
  return `Depois: ${segmentTitle(next, w)} ${time}`;
}

/** Barra fina do treino inteiro. */
function TrainingBar({ timeline, snap }: Omit<BodyProps, 'segment'>) {
  const styles = useThemedStyles(makeStyles);
  const progress = overallProgress(timeline, snap);
  return (
    <View
      style={styles.bar}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Progresso do treino"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <View style={[styles.barFill, { width: `${String(progress * 100)}%` }]} />
    </View>
  );
}

/** Anel (C03): o padrão. Etapa atual, próxima, rodada e total. */
export function RingBody({ timeline, snap, segment }: BodyProps) {
  const w = useT().words;
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const round = roundLabel(segment, w);
  return (
    <View style={styles.body}>
      <Text variant="title" accessibilityRole="header" style={styles.center}>
        {segmentTitle(segment, w)}
      </Text>
      {round ? (
        <Text color="textMuted" style={styles.center}>
          {round}
        </Text>
      ) : null}
      <View style={styles.ringBox}>
        <ProgressRing
          size={260}
          stroke={12}
          progress={phaseProgress(timeline, snap)}
          color={colors[PHASE_TINT[segment.phase]]}
          track={colors.border}
        >
          <BigTime timeline={timeline} snap={snap} segment={segment} size={72} />
        </ProgressRing>
      </View>
      <Text color="textMuted" style={styles.center}>
        {nextLine(timeline[segment.index + 1], w)}
      </Text>
      <TrainingBar timeline={timeline} snap={snap} />
      <Text color="textMuted" style={styles.center}>
        Restante no treino: {clock(snap.totalRemainingMs)}
      </Text>
    </View>
  );
}

/** Foco (C03b): número gigante sobre a cor da fase, pouca informação. */
export function FocusBody({ timeline, snap, segment }: BodyProps) {
  const w = useT().words;
  const name = ownName(segment, w);
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const ink = { color: colors.onPhase };
  const soft = { color: colors.onPhaseMuted };
  return (
    <View style={styles.body}>
      <View>
        {/* Sem nome próprio, a fase aparece uma vez só (C03b). */}
        {name ? (
          <Text variant="label" style={[styles.center, ink]}>
            {w.phase[segment.phase].toUpperCase()}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header" style={[styles.center, ink]}>
          {name ?? w.phase[segment.phase].toUpperCase()}
        </Text>
      </View>
      <BigTime
        timeline={timeline}
        snap={snap}
        segment={segment}
        size={120}
        color={colors.onPhase}
      />
      <Text style={[styles.center, soft]}>{nextLine(timeline[segment.index + 1], w)}</Text>
      <View style={styles.facts}>
        {segment.round !== null && segment.rounds !== null ? (
          <View style={styles.fact}>
            <Text variant="label" tabular style={ink}>
              {`${String(segment.round)}/${String(segment.rounds)}`}
            </Text>
            <Text variant="caption" style={soft}>
              rodada
            </Text>
          </View>
        ) : null}
        <View style={styles.fact}>
          <Text variant="label" tabular style={ink}>
            {clock(snap.totalRemainingMs)}
          </Text>
          <Text variant="caption" style={soft}>
            restante
          </Text>
        </View>
      </View>
    </View>
  );
}

const STATE_SUFFIX: Record<RowState, string> = { done: ', feita', current: ', agora', next: '' };

/**
 * Lista (C03c): a sequência à frente, a atual destacada e as feitas apagadas. Destravada, tocar
 * numa linha pede confirmação e salta para ela (P3).
 */
export function ListBody({
  timeline,
  snap,
  segment,
  onJump,
}: BodyProps & { onJump: ((target: Segment) => void) | null }) {
  const w = useT().words;
  const name = ownName(segment, w);
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const round = roundLabel(segment, w);
  return (
    <View style={styles.body}>
      <View style={styles.listHead}>
        <View style={[styles.pill, { backgroundColor: colors[PHASE_TINT[segment.phase]] }]}>
          <Text variant="caption" style={{ color: colors.onPhase }}>
            {w.phase[segment.phase].toUpperCase()}
          </Text>
        </View>
        {name ? (
          <Text variant="title" accessibilityRole="header" style={styles.grow} numberOfLines={1}>
            {name}
          </Text>
        ) : (
          <Text variant="title" accessibilityRole="header" style={styles.grow} numberOfLines={1}>
            {round ?? w.phase[segment.phase]}
          </Text>
        )}
      </View>
      <BigTime timeline={timeline} snap={snap} segment={segment} size={64} />
      {round && name ? (
        <Text color="textMuted" style={styles.center}>
          {round}
        </Text>
      ) : null}
      <TrainingBar timeline={timeline} snap={snap} />
      <View style={styles.rows}>
        {timeline.map((row) => {
          const state = rowState(row.index, snap);
          const time = row.durationMs === null ? `${String(row.reps)} rep.` : clock(row.durationMs);
          const label = `${String(row.index + 1)}. ${segmentTitle(row, w)}, ${time}${STATE_SUFFIX[state]}`;
          return (
            <Pressable
              key={row.index}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityHint={onJump && state !== 'current' ? 'Ir para esta etapa' : undefined}
              disabled={!onJump || state === 'current'}
              onPress={() => {
                onJump?.(row);
              }}
              style={[styles.row, state === 'current' && styles.rowCurrent]}
            >
              <View style={[styles.rowBar, { backgroundColor: colors[PHASE_TINT[row.phase]] }]} />
              <Text tabular color="textMuted" style={styles.rowIndex}>
                {String(row.index + 1)}
              </Text>
              <Text
                style={[styles.grow, state === 'done' && styles.rowDone]}
                variant={state === 'current' ? 'label' : 'body'}
                numberOfLines={1}
              >
                {segmentTitle(row, w)}
              </Text>
              <Text tabular color={state === 'done' ? 'textMuted' : 'text'}>
                {state === 'done' ? `✓ ${time}` : time}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    body: { gap: space.md, paddingTop: space.sm },
    center: { textAlign: 'center' },
    grow: { flex: 1, minWidth: 0 },
    ringBox: { alignItems: 'center', paddingVertical: space.sm },
    bar: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: 6, backgroundColor: colors.primary },
    facts: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
    fact: { alignItems: 'center' },
    listHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    pill: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
    rows: { gap: 2 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: 48,
      paddingRight: space.sm,
      borderRadius: radius.sm,
    },
    rowCurrent: { backgroundColor: colors.accentSoft },
    rowBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
    rowIndex: { width: 28, textAlign: 'right' },
    rowDone: { color: colors.textMuted },
  });
