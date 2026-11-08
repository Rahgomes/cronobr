import type { PlannedAlert } from '@/domain/alerts';
import type { Language } from '@/domain/appearance';
import type { Cues, SoundId } from '@/domain/cues';

/**
 * Saída dos avisos. A tela de sessão só fala com esta porta; o adaptador real (expo-port)
 * toca, fala, vibra e agenda; nos testes entra um falso que registra as chamadas.
 */
export interface CuePort {
  /** Avisos de uma leitura do motor, com o app na tela. A voz fala na língua do app. */
  play: (cues: Cues, language?: Language) => void;
  /** Prévia nas configurações. */
  preview: (sound: SoundId) => void;
  /** Troca TODOS os avisos agendados por estes (lista vazia = cancelar). */
  schedule: (alerts: PlannedAlert[]) => void;
  /** Tela acesa durante o treino. */
  keepAwake: (on: boolean) => void;
}

/** Porta muda: sem módulo nativo disponível (ou antes da carga), nada acontece e nada quebra. */
export const silentPort: CuePort = {
  play: () => undefined,
  preview: () => undefined,
  schedule: () => undefined,
  keepAwake: () => undefined,
};
