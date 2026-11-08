import type { NewId } from '@/domain/editor';

/** Ids locais de rotina, bloco e etapa: tempo + sorteio + contador (sem crypto nativo). */
export function idGenerator(now = Date.now(), random = Math.random): NewId {
  const prefix = `${now.toString(36)}${random().toString(36).slice(2, 6)}`;
  let n = 0;
  return () => `${prefix}-${(n += 1).toString(36)}`;
}
