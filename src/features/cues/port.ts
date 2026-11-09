import type { PlannedAlert } from '@/domain/alerts';
import type { Language } from '@/domain/appearance';
import type { Cues, SoundId } from '@/domain/cues';

export type AlertOwner = 'sessao' | 'temporizadores';

/**
 * Permissão de notificação: `on` liberada, `ask` ainda dá para pedir (o app pede ao começar),
 * `off` recusada sem poder pedir de novo (só nas configurações do aparelho), `none` onde não há
 * notificação agendada (web).
 */
export type NotifyState = 'on' | 'ask' | 'off' | 'none';

/** Teto por dono: juntos cabem nos 64 pendentes do iPhone, com folga (D96). */
export const OWNER_MAX: Record<AlertOwner, number> = { sessao: 50, temporizadores: 10 };

/**
 * Saída dos avisos. A tela de sessão só fala com esta porta; o adaptador real (expo-port)
 * toca, fala, vibra e agenda; nos testes entra um falso que registra as chamadas.
 */
export interface CuePort {
  /** Avisos de uma leitura do motor, com o app na tela. A voz fala na língua do app. */
  play: (cues: Cues, language?: Language) => void;
  /** Prévia nas configurações. */
  preview: (sound: SoundId) => void;
  /**
   * Troca os avisos agendados DESTE dono por estes (lista vazia = cancelar). Os do outro dono
   * ficam: começar um treino não apaga o fim de um temporizador (D96).
   */
  schedule: (owner: AlertOwner, alerts: PlannedAlert[]) => void;
  /** Tela acesa durante o treino. */
  keepAwake: (on: boolean) => void;
  /** Como está a permissão de notificação agora (E08: fluxo "recusar permissões"). */
  notifications: () => Promise<NotifyState>;
  /** Abre as configurações do app no aparelho, para liberar a notificação. */
  openSettings: () => void;
}

/** Porta muda: sem módulo nativo disponível (ou antes da carga), nada acontece e nada quebra. */
export const silentPort: CuePort = {
  play: () => undefined,
  preview: () => undefined,
  schedule: () => undefined,
  keepAwake: () => undefined,
  notifications: () => Promise.resolve('none'),
  openSettings: () => undefined,
};
