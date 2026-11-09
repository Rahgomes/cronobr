import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { PHASE_QUIET_MS } from '@/domain/cadence';
import { DEFAULT_CUE_PREFS } from '@/domain/cues';
import { createSession } from '@/domain/engine';
import { CUE_PREFS_KEY } from '@/features/cues/cue-context';
import { appRepos, fakeClock, fakePort, renderApp } from '@/test/app';
import { fakeAudio, live } from '@/test/audio';
import { block, routine, step } from '@/test/domain';

import { SESSION_PREFS_KEY, SessionView } from './session-view';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

// Corrida a 120 BPM por 20 s, depois 10 s de caminhada sem cadência.
const PACED = routine({
  prepSeconds: 0,
  blocks: [
    block({
      repeat: 2,
      steps: [
        step({ id: 'run', kind: 'work', name: 'Corrida', seconds: 20, bpm: 120 }),
        step({ id: 'walk', kind: 'rest', name: 'Caminhada', seconds: 10 }),
      ],
    }),
  ],
});

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function open(cuePrefs = DEFAULT_CUE_PREFS, paced = PACED) {
  const env = await appRepos();
  await env.repos.prefs.set(SESSION_PREFS_KEY, { view: 'anel', lockOnStart: false });
  await env.repos.prefs.set(CUE_PREFS_KEY, cuePrefs);
  const clock = fakeClock();
  const audio = fakeAudio();
  const created = jest.fn(() => audio.clock);
  await renderApp(
    <SessionView initial={createSession('s1', paced)} clockSource={clock} audioClock={created} />,
    env.repos,
    fakePort(),
  );
  // O relógio do treino e o do áudio andam juntos, em passos de 250 ms.
  const advance = async (ms: number) => {
    for (let done = 0; done < ms; done += 250) {
      clock.advance(250);
      await act(() => {
        jest.advanceTimersByTime(250);
      });
    }
  };
  await fireEvent.press(await screen.findByRole('button', { name: 'Começar' }));
  return { audio, created, advance };
}

describe('cadência na sessão', () => {
  it('toca o BPM da etapa e dá a vez à frase da troca e à contagem final', async () => {
    const { audio, advance } = await open();
    expect(screen.getByLabelText('Cadência 120 BPM')).toBeOnTheScreen();
    await advance(19_000);
    const heard = live(audio.clicks);
    // 120 BPM: uma a cada 0,5 s, caladas na frase do começo (2,5 s) e nos 3 s finais.
    expect(heard.length).toBeGreaterThanOrEqual(28);
    expect(Math.min(...heard)).toBeGreaterThanOrEqual(PHASE_QUIET_MS / 1000);
    expect(Math.max(...heard)).toBeLessThan(17);
    // Caminhada sem cadência: o pulso para e some da tela.
    await advance(3_000);
    expect(screen.getByRole('header', { name: /Descanso/ })).toBeOnTheScreen();
    expect(screen.queryByLabelText('Cadência 120 BPM')).toBeNull();
    const walking = live(audio.clicks).length;
    await advance(5_000);
    expect(live(audio.clicks)).toHaveLength(walking);
    // Segunda corrida: volta, de novo calando a frase do começo.
    await advance(6_000);
    expect(screen.getByLabelText('Cadência 120 BPM')).toBeOnTheScreen();
    await advance(5_000);
    const second = live(audio.clicks).slice(walking);
    expect(second.length).toBeGreaterThan(0);
    expect(Math.min(...second)).toBeGreaterThanOrEqual(30 + PHASE_QUIET_MS / 1000);
  });

  it('pausa cala; retomar volta no mesmo BPM sem esperar a frase', async () => {
    const { audio, advance } = await open();
    await advance(5_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
    const paused = live(audio.clicks).length;
    await advance(4_000);
    expect(live(audio.clicks)).toHaveLength(paused);
    await fireEvent.press(screen.getByRole('button', { name: 'Retomar' }));
    await advance(2_000);
    expect(live(audio.clicks).length).toBeGreaterThan(paused);
  });

  it('app no fundo: o pulso para (a notificação avisa as trocas)', async () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listener = fn;
      return { remove: jest.fn() };
    });
    const { audio, advance } = await open();
    await advance(4_000);
    await act(() => {
      listener?.('background');
    });
    const before = live(audio.clicks).length;
    await advance(4_000);
    expect(live(audio.clicks)).toHaveLength(before);
  });

  it('pulso desligado nos avisos: nem cria o áudio', async () => {
    const { created, advance } = await open({ ...DEFAULT_CUE_PREFS, pulse: false });
    await advance(5_000);
    expect(created).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Cadência 120 BPM')).toBeNull();
  });

  it('sem voz, som nem contagem: o pulso toca a etapa inteira', async () => {
    const { audio, advance } = await open({
      ...DEFAULT_CUE_PREFS,
      sound: false,
      voice: false,
      countdown: false,
    });
    await advance(19_000);
    const heard = live(audio.clicks);
    expect(Math.min(...heard)).toBeLessThan(0.1);
    expect(Math.max(...heard)).toBeGreaterThan(18);
    // Nem com tudo desligado passa do fim da etapa.
    expect(Math.max(...heard)).toBeLessThan(20);
  });

  it('áudio parado no meio (ligação, fone desligado): ao voltar, a contagem final segue calada', async () => {
    const { audio, advance } = await open();
    await advance(8_000);
    audio.freeze();
    await advance(4_000);
    expect(audio.resumed).toBeGreaterThan(1);
    const frozenAt = audio.clock.now;
    audio.thaw();
    await advance(7_000);
    // Relógio de áudio 4 s atrás do treino: o clique em `at` (áudio) toca em at + 4 s do treino.
    const after = live(audio.clicks).filter((at) => at > frozenAt);
    expect(after.length).toBeGreaterThan(0);
    expect(Math.max(...after.map((at) => at + 4))).toBeLessThan(17);
  });

  it('tela bloqueada várias vezes num treino longo: um áudio só, nada acumula, volta no ritmo', async () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listener = fn;
      return { remove: jest.fn() };
    });
    // 10 voltas de 30 s: o treino segue rodando durante os 20 bloqueios.
    const long = { ...PACED, blocks: PACED.blocks.map((b) => ({ ...b, repeat: 10 })) };
    const { audio, created, advance } = await open(DEFAULT_CUE_PREFS, long);
    const counts: number[] = [];
    // 20 bloqueios de 3 s, cada um no meio de uma corrida ou caminhada.
    for (let i = 0; i < 20; i += 1) {
      await advance(4_000);
      await act(() => {
        listener?.('background');
      });
      await advance(3_000);
      await act(() => {
        listener?.('active');
      });
      counts.push(jest.getTimerCount());
    }
    expect(created).toHaveBeenCalledTimes(1);
    expect(audio.closed).toBe(0);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(8);
    // Ainda no treino (140 s de 290, caminhando); na corrida seguinte (150 s) o pulso volta.
    expect(screen.getByRole('timer')).toBeOnTheScreen();
    const heard = live(audio.clicks).length;
    await advance(14_000);
    expect(live(audio.clicks).length).toBeGreaterThan(heard);
  });
});
