// Valor digitado à mão nos campos com − e + (Stepper): só dígitos, vazio vale zero, e o
// resultado sempre cabe no mínimo e no máximo do campo.

const MAX_DIGITS = 6;

/** Fica só com os dígitos (colar "1:30" ou " 45 s" não quebra), no máximo 6. */
export function digits(text: string): string {
  return text.replace(/\D/g, '').slice(0, MAX_DIGITS);
}

function read(text: string): number {
  const clean = digits(text);
  return clean === '' ? 0 : Number(clean);
}

/** Contagem (rodadas, BPM, repetições). */
export function readCount(text: string): number {
  return read(text);
}

/** Duração em segundos a partir de minutos e segundos; "0" e "90" vira 1:30. */
export function readDuration(minutes: string, seconds: string): number {
  return read(minutes) * 60 + read(seconds);
}

/** Os dois campos de uma duração, para começar a edição com o valor atual. */
export function splitDuration(totalSeconds: number): { minutes: string; seconds: string } {
  const total = Math.max(0, Math.round(totalSeconds));
  return {
    minutes: String(Math.floor(total / 60)),
    seconds: String(total % 60).padStart(2, '0'),
  };
}

/** Encaixa no limite do campo e diz se precisou (a tela explica o porquê). */
export function fit(value: number, min: number, max: number): { value: number; clamped: boolean } {
  const next = Math.min(max, Math.max(min, value));
  return { value: next, clamped: next !== value };
}
