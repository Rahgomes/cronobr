import { block, routine, step } from '@/test/domain';

import { checkRoutine, LIMITS } from './limits';
import { PRESETS } from './presets';

function messages(input: unknown): string[] {
  const result = checkRoutine(input);
  return result.ok ? [] : result.issues.map((issue) => issue.message);
}

describe('limites da rotina', () => {
  it('todas as rotinas prontas passam', () => {
    for (const preset of PRESETS)
      expect(checkRoutine(preset)).toEqual({ ok: true, routine: preset });
  });

  it('nome: vazio, só espaço e longo demais', () => {
    expect(messages(routine({ name: '   ' }))).toEqual(['Dê um nome da rotina.']);
    expect(messages(routine({ name: 'x'.repeat(61) }))).toEqual([
      'O nome da rotina pode ter até 60 letras.',
    ]);
  });

  it('nome é aparado ao salvar', () => {
    const result = checkRoutine(routine({ name: '  Pernas  ' }));
    expect(result.ok && result.routine.name).toBe('Pernas');
  });

  it('etapa: zero, fração, acima de 3 h', () => {
    const withStep = (seconds: number) =>
      routine({ blocks: [block({ repeat: 1, steps: [step({ kind: 'work', seconds })] })] });
    expect(messages(withStep(0))).toEqual(['O tempo da etapa precisa ter pelo menos 1 s.']);
    expect(messages(withStep(1.5))).toEqual(['O tempo da etapa precisa ser em segundos inteiros.']);
    expect(messages(withStep(LIMITS.stepMaxSeconds + 1))).toEqual([
      'O tempo da etapa pode ter até 3 h.',
    ]);
  });

  it('preparação negativa e acima de 10 min; desaquecimento acima de 30 min', () => {
    expect(messages(routine({ prepSeconds: -1 }))).toEqual([
      'A preparação não pode ser menor que zero.',
    ]);
    expect(messages(routine({ prepSeconds: 601 }))).toEqual(['A preparação pode ter até 10 min.']);
    expect(messages(routine({ cooldownSeconds: 1801 }))).toEqual([
      'O desaquecimento pode ter até 30 min.',
    ]);
  });

  it('descanso entre blocos acima de 1 h', () => {
    const schemaMessage = messages(routine({ blocks: [block({ restAfterSeconds: 3601 })] }));
    expect(schemaMessage).toEqual(['O descanso entre blocos pode ter até 1 h.']);
  });

  it('etapa por repetições precisa de repetições; descanso precisa de tempo', () => {
    expect(
      messages(routine({ blocks: [block({ steps: [step({ kind: 'work', seconds: null })] })] })),
    ).toEqual(['Etapa sem tempo precisa de repetições.']);
    expect(
      messages(
        routine({
          blocks: [
            block({
              steps: [step({ kind: 'work' }), step({ kind: 'rest', seconds: null, reps: 3 })],
            }),
          ],
        }),
      ),
    ).toEqual(['Descanso precisa de tempo.']);
    expect(
      messages(
        routine({ blocks: [block({ steps: [step({ kind: 'work', seconds: 5, reps: 0 })] })] }),
      ),
    ).toEqual(['Informe pelo menos 1 repetição.']);
  });

  it('bloco: sem etapa, sem exercício, rodadas fora do limite', () => {
    expect(messages(routine({ blocks: [block({ steps: [] })] }))).toEqual([
      'O bloco precisa de pelo menos 1 etapa.',
    ]);
    expect(messages(routine({ blocks: [block({ steps: [step({ kind: 'rest' })] })] }))).toEqual([
      'O bloco precisa de pelo menos 1 etapa de exercício.',
    ]);
    expect(messages(routine({ blocks: [block({ repeat: 0 })] }))).toEqual([
      'O bloco precisa de pelo menos 1 rodada.',
    ]);
    expect(messages(routine({ blocks: [block({ repeat: 100 })] }))).toEqual([
      'O bloco pode ter até 99 rodadas.',
    ]);
  });

  it('rotina: sem bloco e com blocos demais', () => {
    expect(messages(routine({ blocks: [] }))).toEqual(['A rotina precisa de pelo menos 1 bloco.']);
    expect(messages(routine({ blocks: Array.from({ length: 21 }, () => block()) }))).toEqual([
      'A rotina pode ter até 20 blocos.',
    ]);
  });

  it('muitas rodadas: barra no total de etapas com mensagem útil', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      step({ id: `s${String(i)}`, kind: 'work', seconds: 1 }),
    );
    const r = routine({
      blocks: [block({ repeat: 99, steps: many }), block({ repeat: 99, steps: many })],
    });
    expect(messages(r)).toEqual([
      'A rotina ficou com 3960 etapas no total; o máximo é 2000. Diminua as rodadas.',
    ]);
  });

  it('sessão longa: barra acima de 6 h', () => {
    const r = routine({
      blocks: [block({ repeat: 3, steps: [step({ kind: 'work', seconds: 3 * 3600 })] })],
    });
    expect(messages(r)).toEqual(['A rotina passa de 6 h. Divida em duas.']);
  });

  it('tipo errado vira mensagem, não exceção', () => {
    const result = checkRoutine({ ...routine(), prepSeconds: 'dez' });
    expect(result).toEqual({
      ok: false,
      issues: [{ path: 'prepSeconds', message: 'Informe a preparação.' }],
    });
  });
});
