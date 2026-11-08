import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { segmentTitle } from '@/domain/cues';
import { edit, stamp, startFrom } from '@/domain/editor';
import { clock } from '@/domain/format';
import { checkRoutine, LIMITS } from '@/domain/limits';
import { MODALITIES, type Modality, type Routine, type Step } from '@/domain/routine';
import { buildTimeline, summarize } from '@/domain/timeline';
import { MODALITY } from '@/features/modality/catalog';
import { usePresets } from '@/features/routines/presets';
import { useT } from '@/i18n/i18n-context';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Chip } from '@/ui/chip';
import { dialog } from '@/ui/dialog';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { Stepper } from '@/ui/stepper';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import type { Colors } from '@/ui/theme';
import { useColors, useThemedStyles } from '@/ui/theme-context';
import { radius, space } from '@/ui/tokens';
import { TopBar } from '@/ui/top-bar';

import { BlockSheet } from './block-sheet';
import { idGenerator } from './ids';
import { StepSheet } from './step-sheet';

const PREVIEW_MAX = 12;
const EDITABLE = MODALITIES.filter((m) => m !== 'temporizador');

export const draftKey = (id: string, from?: string, modality?: string) =>
  id === 'nova' ? `rascunho:nova:${from ?? modality ?? ''}` : `rascunho:${id}`;

type Load =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; existed: boolean; base: Routine; recovered: boolean };

function isModality(value: string | undefined): value is Modality {
  return (MODALITIES as readonly string[]).includes(value ?? '');
}

const asRoutine = (raw: unknown): Routine | null => {
  // O rascunho foi gravado por este mesmo editor: basta conferir a forma mínima.
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Partial<Routine>;
  return typeof r.id === 'string' && Array.isArray(r.blocks) ? (r as Routine) : null;
};

/**
 * Editor de rotinas (C02). Cada mudança vai para um rascunho no banco: sair, trocar de app ou
 * fechar não perde nada. Descartar pede confirmação. Modelo pronto nunca é alterado: vira cópia.
 */
export function EditorScreen({
  id,
  from,
  modality,
}: {
  /** Id da rotina própria, ou "nova". */
  id: string;
  /** Modelo pronto de partida (nova). */
  from?: string | undefined;
  modality?: string | undefined;
}) {
  const repos = useRepos();
  const t = useT();
  const presets = usePresets();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const key = draftKey(id, from, modality);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [draft, setDraft] = useState<Routine | null>(null);
  const [newId] = useState(() => idGenerator());
  const [leaving, setLeaving] = useState<'back' | 'start' | null>(null);
  const [stepAt, setStepAt] = useState<[number, number] | null>(null);
  const [blockAt, setBlockAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const open = async (): Promise<[Load, Routine | null]> => {
      const saved = asRoutine(await repos.prefs.get(key));
      if (id !== 'nova') {
        const existing = await repos.routines.get(id);
        if (!existing) return [{ status: 'missing' }, null];
        const ready = { status: 'ready', existed: true, base: existing } as const;
        return [{ ...ready, recovered: saved !== null }, saved ?? existing];
      }
      const start = startFrom(
        from ? presets.byId(from) : undefined,
        isModality(modality) ? modality : 'personalizada',
        newId,
        Date.now(),
        t.words,
      );
      return [
        { status: 'ready', existed: false, base: start, recovered: saved !== null },
        saved ?? start,
      ];
    };
    void open()
      .catch((): [Load, null] => [{ status: 'missing' }, null])
      .then(([next, routine]) => {
        if (!active) return;
        setLoad(next);
        setDraft(routine);
      });
    return () => {
      active = false;
    };
  }, [repos, id, key, from, modality, newId, presets, t]);

  const dirty =
    load.status === 'ready' &&
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(load.base);

  const update = (next: Routine) => {
    setDraft(next);
    repos.prefs.set(key, next).catch(() => undefined);
  };

  const discard = () => {
    repos.prefs.set(key, undefined).catch(() => undefined);
    setLeaving('back');
  };

  // Descartar o rascunho recuperado: volta ao que está salvo e segue no editor.
  const dropDraft = () => {
    if (load.status !== 'ready') return;
    repos.prefs.set(key, undefined).catch(() => undefined);
    setDraft(load.base);
    setLoad({ ...load, recovered: false });
  };

  usePreventRemove(dirty && leaving === null, () => {
    dialog.alert('Sair do editor?', 'Suas alterações ficam guardadas como rascunho.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar alterações', style: 'destructive', onPress: discard },
      {
        text: 'Sair e guardar rascunho',
        onPress: () => {
          // O banco atende em fila: esta leitura só volta depois da última gravação do
          // rascunho. Sair antes deixava reabrir e ler o rascunho antigo (CI carregado).
          void repos.prefs
            .get(key)
            .catch(() => undefined)
            .then(() => {
              setLeaving('back');
            });
        },
      },
    ]);
  });

  useEffect(() => {
    if (leaving === 'back') router.back();
    if (leaving === 'start' && draft)
      router.replace({ pathname: '/sessao', params: { rotina: draft.id } });
    // Só reage à decisão de sair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const timeline = useMemo(() => (draft ? buildTimeline(draft) : []), [draft]);

  if (load.status === 'missing') {
    return (
      <Screen
        footer={
          <Button
            label="Voltar"
            onPress={() => {
              router.back();
            }}
          />
        }
      >
        <Text variant="title" accessibilityRole="header">
          Rotina não encontrada
        </Text>
      </Screen>
    );
  }
  if (load.status === 'loading' || !draft) return <Screen>{null}</Screen>;

  const existed = load.existed;
  const check = checkRoutine(stamp(draft, existed, draft.updatedAt), t.words);
  const problem = check.ok ? null : (check.issues[0]?.message ?? null);
  const summary = summarize(timeline);

  const save = async (then: 'back' | 'start') => {
    const result = checkRoutine(stamp(draft, existed, Date.now()), t.words);
    if (!result.ok) return;
    await repos.routines.save(result.routine);
    await repos.prefs.set(key, undefined);
    setDraft(result.routine);
    setLeaving(then);
  };

  const stepActions = (b: number, s: number) => {
    const steps = draft.blocks[b]?.steps ?? [];
    return {
      change: (patch: Partial<Omit<Step, 'id'>>) => {
        update(edit.step(draft, b, s, patch));
      },
      moveUp:
        s > 0
          ? () => {
              update(edit.moveStep(draft, b, s, s - 1));
              setStepAt([b, s - 1]);
            }
          : null,
      moveDown:
        s < steps.length - 1
          ? () => {
              update(edit.moveStep(draft, b, s, s + 1));
              setStepAt([b, s + 1]);
            }
          : null,
      duplicate: () => {
        update(edit.duplicateStep(draft, b, s, newId));
        setStepAt([b, s + 1]);
      },
      insertAfter: () => {
        update(edit.addStep(draft, b, s, 'work', newId, t.words));
        setStepAt([b, s + 1]);
      },
      remove:
        steps.length > 1
          ? () => {
              update(edit.removeStep(draft, b, s));
              setStepAt(null);
            }
          : null,
    };
  };

  const blockActions = (b: number) => ({
    change: (patch: Parameters<typeof edit.block>[2]) => {
      update(edit.block(draft, b, patch));
    },
    moveUp:
      b > 0
        ? () => {
            update(edit.moveBlock(draft, b, b - 1));
            setBlockAt(b - 1);
          }
        : null,
    moveDown:
      b < draft.blocks.length - 1
        ? () => {
            update(edit.moveBlock(draft, b, b + 1));
            setBlockAt(b + 1);
          }
        : null,
    remove:
      draft.blocks.length > 1
        ? () => {
            dialog.alert('Apagar o bloco?', 'As etapas dele saem da rotina.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Apagar',
                style: 'destructive',
                onPress: () => {
                  update(edit.removeBlock(draft, b));
                  setBlockAt(null);
                },
              },
            ]);
          }
        : null,
  });

  const openStep = stepAt ? (draft.blocks[stepAt[0]]?.steps[stepAt[1]] ?? null) : null;
  const openBlock = blockAt === null ? null : (draft.blocks[blockAt] ?? null);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Button
              label="Salvar"
              kind="secondary"
              disabled={!check.ok}
              disabledHint={problem ?? undefined}
              onPress={() => {
                void save('back');
              }}
            />
          </View>
          <View style={styles.footerItem}>
            <Button
              label="Salvar e começar"
              disabled={!check.ok}
              disabledHint={problem ?? undefined}
              onPress={() => {
                void save('start');
              }}
            />
          </View>
        </View>
      }
    >
      <TopBar title={existed ? 'Editar rotina' : 'Nova rotina'} />

      {load.recovered ? (
        <Notice
          tone="soft"
          action={{
            label: 'Descartar rascunho',
            onPress: () => {
              dialog.alert('Descartar o rascunho?', 'As alterações não salvas somem.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Descartar', style: 'destructive', onPress: dropDraft },
              ]);
            },
          }}
        >
          Rascunho recuperado: você saiu sem salvar da última vez.
        </Notice>
      ) : null}

      <TextField
        label="Nome da rotina"
        value={draft.name}
        placeholder="Ex.: Circuito de sexta"
        maxLength={LIMITS.nameMax}
        onChangeText={(name) => {
          update(edit.routine(draft, { name }));
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.modalities}
        accessibilityLabel="Modalidade"
      >
        {EDITABLE.map((m) => (
          <Chip
            key={m}
            label={MODALITY[m].label}
            selected={draft.modality === m}
            onPress={() => {
              update(edit.routine(draft, { modality: m }));
            }}
          />
        ))}
      </ScrollView>

      <Card style={styles.total}>
        <View>
          <Text color="textMuted">Total{summary.manualCount > 0 ? ' estimado' : ''}</Text>
          <Text variant="display" tabular>
            {clock(summary.knownMs)}
          </Text>
        </View>
        <View style={styles.totalSide}>
          <Text color="textMuted">
            {`${String(draft.blocks.length)} ${draft.blocks.length === 1 ? 'bloco' : 'blocos'} · ${String(summary.segments)} etapas`}
          </Text>
          {summary.manualCount > 0 ? (
            <Text variant="caption" color="textMuted">
              {`+ ${String(summary.manualCount)} por repetições, no seu ritmo`}
            </Text>
          ) : null}
        </View>
      </Card>

      <Card>
        <Stepper
          label="Preparação"
          value={draft.prepSeconds}
          min={0}
          max={LIMITS.prepMaxSeconds}
          step={5}
          format={(s) => clock(s * 1000)}
          onChange={(prepSeconds) => {
            update(edit.routine(draft, { prepSeconds }));
          }}
        />
      </Card>

      {draft.blocks.map((block, b) => {
        const last = b === draft.blocks.length - 1;
        return (
          <View key={block.id} style={styles.blockGroup}>
            <Card style={styles.block}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${block.name}, ${String(block.repeat)} rodadas. Editar bloco`}
                onPress={() => {
                  setBlockAt(b);
                }}
                style={styles.blockHeader}
              >
                <Text variant="title" style={styles.flex} numberOfLines={1}>
                  {block.name}
                </Text>
                <View style={styles.repeat}>
                  <Text variant="label">{`×${String(block.repeat)}`}</Text>
                </View>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textMuted} />
              </Pressable>
              {block.steps.map((step, s) => {
                const amount =
                  step.seconds === null
                    ? `${String(step.reps ?? 0)} rep`
                    : clock(step.seconds * 1000);
                return (
                  <Pressable
                    key={step.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${step.name}, ${amount}${step.disabled ? ', desativada' : ''}. Editar etapa`}
                    onPress={() => {
                      setStepAt([b, s]);
                    }}
                    style={({ pressed }) => [styles.step, pressed && styles.pressed]}
                  >
                    <View style={[styles.bar, step.kind === 'work' ? styles.work : styles.rest]} />
                    <View style={styles.flex}>
                      <Text variant="label" color={step.disabled ? 'textMuted' : 'text'}>
                        {step.name}
                      </Text>
                      {step.disabled ? (
                        <Text variant="caption" color="textMuted">
                          desativada
                        </Text>
                      ) : null}
                    </View>
                    <Text variant="label" tabular color={step.disabled ? 'textMuted' : 'text'}>
                      {amount}
                    </Text>
                  </Pressable>
                );
              })}
              <Button
                label="+ Adicionar etapa"
                kind="text"
                accessibilityLabel={`Adicionar etapa em ${block.name}`}
                onPress={() => {
                  update(edit.addStep(draft, b, block.steps.length - 1, 'work', newId, t.words));
                  setStepAt([b, block.steps.length]);
                }}
              />
            </Card>
            {!last && block.restAfterSeconds > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Descanso entre blocos, ${clock(block.restAfterSeconds * 1000)}. Editar`}
                onPress={() => {
                  setBlockAt(b);
                }}
                style={styles.blockRest}
              >
                <View style={[styles.bar, styles.rest]} />
                <Text variant="label" style={styles.flex}>
                  Descanso entre blocos
                </Text>
                <Text variant="label" tabular>
                  {clock(block.restAfterSeconds * 1000)}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <Button
        label="+ Adicionar bloco"
        kind="text"
        disabled={draft.blocks.length >= LIMITS.blocksMax}
        disabledHint={`A rotina pode ter até ${String(LIMITS.blocksMax)} blocos.`}
        onPress={() => {
          update(edit.addBlock(draft, newId, t.words));
        }}
      />

      <Card>
        <Stepper
          label="Encerramento"
          value={draft.cooldownSeconds}
          min={0}
          max={LIMITS.cooldownMaxSeconds}
          step={15}
          format={(s) => (s === 0 ? 'Sem' : clock(s * 1000))}
          onChange={(cooldownSeconds) => {
            update(edit.routine(draft, { cooldownSeconds }));
          }}
        />
      </Card>

      <SectionTitle>Prévia</SectionTitle>
      <Card>
        {timeline.slice(0, PREVIEW_MAX).map((segment) => (
          <View key={segment.index} style={styles.previewRow}>
            <Text color="textMuted" tabular style={styles.previewIndex}>
              {String(segment.index + 1)}
            </Text>
            <Text style={styles.flex} numberOfLines={1}>
              {segmentTitle(segment, t.words)}
            </Text>
            <Text tabular>
              {segment.durationMs === null
                ? `${String(segment.reps ?? 0)} rep`
                : clock(segment.durationMs)}
            </Text>
          </View>
        ))}
        {timeline.length > PREVIEW_MAX ? (
          <Text color="textMuted">{`e mais ${String(timeline.length - PREVIEW_MAX)} etapas`}</Text>
        ) : null}
        {timeline.length === 0 ? <Text color="textMuted">Nenhuma etapa ativa.</Text> : null}
      </Card>

      {problem ? <Notice tone="danger">{problem}</Notice> : null}

      <StepSheet
        step={openStep}
        actions={stepAt ? stepActions(stepAt[0], stepAt[1]) : stepActions(0, 0)}
        onClose={() => {
          setStepAt(null);
        }}
      />
      <BlockSheet
        block={openBlock}
        last={blockAt === draft.blocks.length - 1}
        actions={blockActions(blockAt ?? 0)}
        onClose={() => {
          setBlockAt(null);
        }}
      />
    </Screen>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    footer: { flexDirection: 'row', gap: space.md },
    footerItem: { flex: 1 },
    bleed: { marginHorizontal: -space.lg },
    modalities: { gap: space.sm, paddingHorizontal: space.lg },
    total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalSide: { alignItems: 'flex-end', gap: 2, flexShrink: 1 },
    blockGroup: { gap: space.sm },
    block: { gap: 0 },
    blockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      paddingBottom: space.sm,
    },
    repeat: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.pill,
      paddingHorizontal: space.sm,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      minHeight: 48,
    },
    pressed: { opacity: 0.7 },
    bar: { width: 4, alignSelf: 'stretch', borderRadius: radius.pill },
    work: { backgroundColor: colors.primary },
    rest: { backgroundColor: colors.textMuted },
    blockRest: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minHeight: 48,
    },
    flex: { flex: 1 },
    previewRow: { flexDirection: 'row', gap: space.md, paddingVertical: 2 },
    previewIndex: { minWidth: 24 },
  });
