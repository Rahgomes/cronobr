import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRepos } from '@/data/data-context';
import type { Session } from '@/domain/engine';
import { clock, relativeDay } from '@/domain/format';
import { recentRoutines, type RecentRoutine } from '@/domain/history';
import { PRESET_MODALITIES, presetsOf } from '@/domain/presets';
import type { Routine } from '@/domain/routine';
import { buildTimeline, summarize } from '@/domain/timeline';
import { MODALITY } from '@/features/modality/catalog';
import { BrandMark } from '@/ui/brand-mark';
import { Carousel } from '@/ui/carousel';
import { Notice } from '@/ui/notice';
import { PhotoBadge, PhotoCard } from '@/ui/photo-card';
import { Screen } from '@/ui/screen';
import { SectionTitle } from '@/ui/section-title';
import { space } from '@/ui/tokens';
import { RoundAction } from '@/ui/top-bar';

import { RoutineRow } from './routine-row';

interface HomeData {
  active: Session | null;
  mine: Routine[];
  recent: RecentRoutine[];
  /** Hora da leitura, para o "há 2 dias" (ler o relógio no render quebraria a pureza). */
  now: number;
}

const RECENT_MAX = 8;
// Largura pensada para 390 pt: um card e meio à vista, o meio cortado mostra que rola.
const MODALITY_CARD = { width: 216, height: 280 };
const RECENT_CARD = { width: 184, height: 184 };

function models(count: number) {
  return count === 1 ? '1 modelo' : `${String(count)} modelos`;
}

/** Início (C01b): recentes e modalidades em carrossel com foto; a lista completa fica um toque adiante. */
export function HomeScreen() {
  const repos = useRepos();
  const [data, setData] = useState<HomeData | null>(null);

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
    }, [repos]),
  );

  return (
    <Screen>
      <View style={styles.top}>
        <BrandMark height={36} />
        <View style={styles.actions}>
          <RoundAction
            icon="history"
            label="Histórico"
            onPress={() => {
              router.push('/historico');
            }}
          />
          <RoundAction
            icon="cog-outline"
            label="Som e avisos"
            onPress={() => {
              router.push('/avisos');
            }}
          />
        </View>
      </View>

      {data?.active ? (
        <Notice
          tone="alert"
          action={{
            label: 'Continuar treino',
            onPress: () => {
              router.push('/sessao');
            },
          }}
        >
          {`Treino em andamento: ${data.active.routine.name}`}
        </Notice>
      ) : null}

      {data && data.recent.length > 0 ? (
        <Carousel
          title="Recentes"
          itemWidth={RECENT_CARD.width}
          seeAll={{
            label: 'Ver histórico',
            onPress: () => {
              router.push('/historico');
            },
          }}
        >
          {data.recent.map(({ entryId, routine, lastEndedAt }) => {
            const total = clock(summarize(buildTimeline(routine)).knownMs);
            const when = relativeDay(lastEndedAt, data.now);
            return (
              <PhotoCard
                key={entryId}
                {...RECENT_CARD}
                photo={MODALITY[routine.modality].photo}
                title={routine.name}
                subtitle={`${total} · ${when}`}
                accessibilityLabel={`Repetir ${routine.name}, ${total}, feito ${when}`}
                onPress={() => {
                  router.push({ pathname: '/sessao', params: { repetir: entryId } });
                }}
              />
            );
          })}
        </Carousel>
      ) : null}

      <Carousel
        title="Modalidades"
        itemWidth={MODALITY_CARD.width}
        seeAll={{
          label: 'Ver todas',
          onPress: () => {
            router.push('/modalidades');
          },
        }}
      >
        {PRESET_MODALITIES.map((modality) => {
          const info = MODALITY[modality];
          const count = models(presetsOf(modality).length);
          return (
            <PhotoCard
              key={modality}
              {...MODALITY_CARD}
              photo={info.photo}
              title={info.label}
              subtitle={info.tagline}
              badge={<PhotoBadge label={count} />}
              accessibilityLabel={`${info.label}: ${info.tagline}, ${count}`}
              onPress={() => {
                router.push({ pathname: '/modalidade/[id]', params: { id: modality } });
              }}
            />
          );
        })}
      </Carousel>

      {data && data.mine.length > 0 ? (
        <View style={styles.list}>
          <SectionTitle>Suas rotinas</SectionTitle>
          {data.mine.map((routine) => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              onPress={() => {
                router.push({ pathname: '/sessao', params: { rotina: routine.id } });
              }}
            />
          ))}
        </View>
      ) : null}
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
