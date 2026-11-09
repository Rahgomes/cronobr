import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import { copyRoutine } from '@/domain/editor';
import type { Session } from '@/domain/engine';
import { clock, relativeDay } from '@/domain/format';
import { recentRoutines, type RecentRoutine } from '@/domain/history';
import type { Routine } from '@/domain/routine';
import { buildTimeline, summarize } from '@/domain/timeline';
import { idGenerator } from '@/features/editor/ids';
import { MODALITY } from '@/features/modality/catalog';
import { useFavorites } from '@/features/routines/favorites';
import { usePresets } from '@/features/routines/presets';
import { RoutineOptions, type RoutineOptionActions } from '@/features/routines/routine-options';
import { useT } from '@/i18n/i18n-context';
import { BrandMark } from '@/ui/brand-mark';
import { Button } from '@/ui/button';
import { Carousel } from '@/ui/carousel';
import { Notice } from '@/ui/notice';
import { PhotoBadge, PhotoCard } from '@/ui/photo-card';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { space } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

import { LastRoutine } from './last-routine';
import { QuickTiles } from './quick-tiles';
import { RoutineRow } from './routine-row';
import { TimersSummary } from './timers-summary';

interface HomeData {
  active: Session | null;
  mine: Routine[];
  recent: RecentRoutine[];
  /** Hora da leitura, para o "há 2 dias" (ler o relógio no render quebraria a pureza). */
  now: number;
}

/** Só a última aparece; as outras vêm de reserva se a última sumir da lista. */
const RECENT_MAX = 1;
// Largura pensada para 390 pt: um card e meio à vista, o meio cortado mostra que rola.
const MODALITY_CARD = { width: 216, height: 280 };

/**
 * Início (C01b): última rotina com Repetir, início rápido, modalidades em carrossel com foto,
 * favoritas e as rotinas da pessoa. Histórico pelo link da última rotina; backup em Ajustes.
 */
export function HomeScreen() {
  const repos = useRepos();
  const t = useT();
  const presets = usePresets();
  const [data, setData] = useState<HomeData | null>(null);
  const [reloads, setReloads] = useState(0);
  const favorites = useFavorites();
  const [options, setOptions] = useState<Routine | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        repos.session.load(),
        repos.routines.list(),
        repos.history.page({ limit: 40 }),
      ]).then(([session, mine, page]) => {
        if (active) {
          setData({
            active: session,
            mine,
            recent: recentRoutines(page.entries, RECENT_MAX),
            now: Date.now(),
          });
        }
      });
      return () => {
        active = false;
      };
      // `reloads` força a releitura depois de duplicar, mover ou apagar.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repos, reloads]),
  );
  const reload = () => {
    setReloads((n) => n + 1);
  };

  const mine = data?.mine ?? [];
  const byId = new Map([...presets.all, ...mine].map((r) => [r.id, r]));
  const favoriteRoutines = favorites.ids.flatMap((id) => byId.get(id) ?? []);
  const open = (routine: Routine) => {
    router.push({ pathname: '/sessao', params: { rotina: routine.id } });
  };
  const optionActions = (routine: Routine): RoutineOptionActions => {
    const index = mine.findIndex((r) => r.id === routine.id);
    const own = index >= 0;
    const reorder = (to: number) => () => {
      const ids = mine.map((r) => r.id);
      const [moved] = ids.splice(index, 1);
      if (moved) ids.splice(to, 0, moved);
      void repos.routines.reorder(ids).then(reload);
    };
    return {
      favorite: favorites.ids.includes(routine.id),
      toggleFavorite: () => {
        favorites.toggle(routine.id);
      },
      edit: () => {
        router.push(
          own
            ? { pathname: '/rotina/[id]', params: { id: routine.id } }
            : { pathname: '/rotina/[id]', params: { id: 'nova', de: routine.id } },
        );
      },
      duplicate: own
        ? () => {
            const copy = copyRoutine(routine, idGenerator(), Date.now(), t.words);
            void repos.routines.save(copy).then(reload);
          }
        : undefined,
      moveUp: own && index > 0 ? reorder(index - 1) : null,
      moveDown: own && index < mine.length - 1 ? reorder(index + 1) : null,
      remove: own
        ? () => {
            void repos.routines.remove(routine.id).then(reload);
          }
        : undefined,
    };
  };

  const last = data?.recent[0];
  const lastTotal = last ? clock(summarize(buildTimeline(last.routine)).knownMs) : '';
  const lastWhen = last ? relativeDay(last.lastEndedAt, data.now, t.words) : '';

  return (
    <Screen>
      <View style={styles.top}>
        <BrandMark height={36} />
        <View style={styles.actions}>
          <RoundAction
            icon="cog-outline"
            label={t.home.settings}
            onPress={() => {
              router.push('/ajustes');
            }}
          />
        </View>
      </View>

      {last ? (
        <LastRoutine
          name={last.routine.name}
          detail={t.home.recentDetail(lastTotal, lastWhen)}
          accessibilityLabel={t.home.repeatLabel(last.routine.name, lastTotal, lastWhen)}
          onRepeat={() => {
            router.push({ pathname: '/sessao', params: { repetir: last.entryId } });
          }}
          onHistory={() => {
            router.push('/historico');
          }}
        />
      ) : null}

      <QuickTiles />
      <TimersSummary />

      {data?.active ? (
        <Notice
          tone="alert"
          action={{
            label: t.home.continueWorkout,
            onPress: () => {
              router.push('/sessao');
            },
          }}
        >
          {t.home.inProgress(data.active.routine.name)}
        </Notice>
      ) : null}

      <Carousel
        title={t.home.modalities}
        itemWidth={MODALITY_CARD.width}
        seeAll={{
          label: t.home.seeAll,
          onPress: () => {
            router.push('/modalidades');
          },
        }}
      >
        {presets.modalities.map((modality) => {
          const info = MODALITY[modality];
          const count = t.home.models(presets.of(modality).length);
          return (
            <PhotoCard
              key={modality}
              {...MODALITY_CARD}
              photo={info.photo}
              title={t.modality[modality].label}
              subtitle={t.modality[modality].tagline}
              badge={<PhotoBadge label={count} />}
              accessibilityLabel={t.home.modalityLabel(
                t.modality[modality].label,
                t.modality[modality].tagline,
                count,
              )}
              onPress={() => {
                router.push({ pathname: '/modalidade/[id]', params: { id: modality } });
              }}
            />
          );
        })}
      </Carousel>

      {favoriteRoutines.length > 0 ? (
        <View style={styles.list}>
          <SectionTitle>{t.home.favorites}</SectionTitle>
          {favoriteRoutines.map((routine) => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              favorite
              onPress={() => {
                open(routine);
              }}
              onMore={() => {
                setOptions(routine);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.list}>
        {mine.length > 0 ? <SectionTitle>{t.home.yourRoutines}</SectionTitle> : null}
        {mine.map((routine) => (
          <RoutineRow
            key={routine.id}
            routine={routine}
            favorite={favorites.ids.includes(routine.id)}
            onPress={() => {
              open(routine);
            }}
            onMore={() => {
              setOptions(routine);
            }}
          />
        ))}
        <Button
          label={t.home.newRoutine}
          kind="primary"
          onPress={() => {
            router.push({ pathname: '/rotina/[id]', params: { id: 'nova' } });
          }}
        />
      </View>

      <RoutineOptions
        routine={options}
        actions={options ? optionActions(options) : null}
        onClose={() => {
          setOptions(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.sm,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  list: { gap: space.sm },
});
