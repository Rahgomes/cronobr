// Tempo para leitura humana. Arredonda PARA CIMA: com 0,4 s restantes a tela ainda mostra 0:01,
// e o zero só aparece quando a etapa acabou de fato.
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${String(hours)}:${String(minutes).padStart(2, '0')}:${ss}`;
  return `${String(minutes)}:${ss}`;
}

/** "45 s", "2 min", "1 min 30 s", "1 h 05 min". */
export function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${String(hours)} h ${String(minutes).padStart(2, '0')} min`;
  if (minutes === 0) return `${String(seconds)} s`;
  if (seconds === 0) return `${String(minutes)} min`;
  return `${String(minutes)} min ${String(seconds)} s`;
}

const DAY = 24 * 60 * 60 * 1000;

/** "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 5 meses", por dia do calendário local. */
export function relativeDay(when: number, now: number): string {
  const start = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.max(0, Math.round((start(now) - start(when)) / DAY));
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 14) return `há ${String(days)} dias`;
  if (days < 60) return `há ${String(Math.floor(days / 7))} semanas`;
  return `há ${String(Math.floor(days / 30))} meses`;
}

/** Cronômetro: "0:05.3", "12:34.5", "1:02:03.4". Trunca (não arredonda): nunca mostra adiantado. */
export function stopwatchTime(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const total = Math.floor(tenths / 10);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const ss = String(total % 60).padStart(2, '0');
  const tail = `${ss}.${String(tenths % 10)}`;
  if (hours > 0) return `${String(hours)}:${String(minutes).padStart(2, '0')}:${tail}`;
  return `${String(minutes)}:${tail}`;
}
