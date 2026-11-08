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
