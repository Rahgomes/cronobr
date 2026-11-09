/**
 * Treino rodando em algum lugar do app. Os temporizadores consultam antes de falar: com um treino
 * rodando, a voz é do treino (a frase nova cortaria a contagem dele); o temporizador só toca e
 * vibra, e o aviso escrito aparece por cima da sessão.
 */
let running = false;

export function setSessionRunning(on: boolean) {
  running = on;
}

export function isSessionRunning(): boolean {
  return running;
}
