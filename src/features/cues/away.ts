import { AppState } from 'react-native';

/**
 * App fora da tela: aí quem avisa é a notificação agendada; com o app à vista, os avisos do
 * próprio app. Só "background" conta: em "inactive" (central de notificações aberta, chamada
 * chegando) o app ainda está à vista e segue avisando sozinho. Os dois lados usam esta mesma
 * regra, senão o aviso dobra ou some.
 */
export function isAway(): boolean {
  return AppState.currentState === 'background';
}
