import { block, must, routine, step } from '@/test/domain';

import { copyRoutine, edit, newRoutine, stamp, startFrom } from './editor';
import { checkRoutine } from './limits';
import { presetById } from './presets';
import { buildTimeline, summarize } from './timeline';

function ids() {
  let n = 0;
  return () => `id${String((n += 1))}`;
}

describe('editor de rotinas', () => {
  it('rotina nova: um bloco com exercício e descanso, sem nome (o salvar pede)', () => {
    const r = newRoutine('circuito', ids(), 5);
    expect(r).toMatchObject({ modality: 'circuito', origin: 'custom', version: 1, name: '' });
    expect(r.blocks[0]?.steps.map((s) => s.kind)).toEqual(['work', 'rest']);
    const check = checkRoutine(r);
    expect(check.ok).toBe(false);
    expect(checkRoutine(edit.routine(r, { name: 'Circuito de terça' })).ok).toBe(true);
  });

  it('cópia: ids novos, versão 1, "(cópia)" só para rotina própria', () => {
    const tabata = must(presetById('tabata-classic'));
    const copy = copyRoutine(tabata, ids(), 9);
    expect(copy).toMatchObject({ name: 'Tabata clássico', origin: 'custom', version: 1 });
    expect(copy.id).not.toBe(tabata.id);
    expect(copy.blocks[0]?.steps[0]?.id).not.toBe(tabata.blocks[0]?.steps[0]?.id);
    const mine = { ...routine({ name: 'Meu' }), version: 4 };
    expect(copyRoutine(mine, ids(), 9).name).toBe('Meu (cópia)');
    expect(copyRoutine(mine, ids(), 9, 'Outro').name).toBe('Outro');
    // A original não muda.
    expect(tabata.origin).toBe('preset');
  });

  it('ponto de partida: modelo pronto vira cópia; id desconhecido ou nenhum, rotina nova', () => {
    expect(startFrom('boxe-pro', 'boxe', ids(), 0).name).toBe('Boxe avançado');
    expect(startFrom('nao-existe', 'emom', ids(), 0)).toMatchObject({ name: '', modality: 'emom' });
    expect(startFrom(undefined, 'hiit', ids(), 0).modality).toBe('hiit');
  });

  it('gravar: versão sobe só se já existia; nome sem espaços nas pontas', () => {
    const r = routine({ name: '  Treino  ' });
    expect(stamp(r, false, 50)).toMatchObject({ version: 1, updatedAt: 50, name: 'Treino' });
    expect(stamp(r, true, 60).version).toBe(2);
  });

  it('etapas: inserir no meio, duplicar, mover, remover (nunca a última)', () => {
    const newId = ids();
    let r = routine();
    r = edit.addStep(r, 0, 0, 'work', newId);
    expect(r.blocks[0]?.steps.map((s) => s.kind)).toEqual(['work', 'work', 'rest']);
    r = edit.addStep(r, 0, -1, 'rest', newId);
    expect(r.blocks[0]?.steps[0]?.kind).toBe('rest');
    r = edit.duplicateStep(r, 0, 1, newId);
    expect(r.blocks[0]?.steps).toHaveLength(5);
    expect(edit.duplicateStep(r, 0, 99, newId)).toEqual(r);
    const first = r.blocks[0]?.steps[0]?.id;
    r = edit.moveStep(r, 0, 0, 2);
    expect(r.blocks[0]?.steps[2]?.id).toBe(first);
    expect(edit.moveStep(r, 0, 0, -1)).toEqual(r);
    expect(edit.moveStep(r, 0, 9, 0)).toEqual(r);
    r = edit.removeStep(r, 0, 0);
    expect(r.blocks[0]?.steps).toHaveLength(4);
    const single = routine({ blocks: [block({ steps: [step({ kind: 'work' })] })] });
    expect(edit.removeStep(single, 0, 0)).toEqual(single);
  });

  it('etapa por repetições e de volta ao tempo; descanso sempre por tempo', () => {
    let r = routine();
    r = edit.step(r, 0, 0, { seconds: null, name: 'Flexão' });
    expect(r.blocks[0]?.steps[0]).toMatchObject({ seconds: null, reps: 10, name: 'Flexão' });
    r = edit.step(r, 0, 0, { reps: 15 });
    expect(r.blocks[0]?.steps[0]?.reps).toBe(15);
    r = edit.step(r, 0, 0, { seconds: 40 });
    expect(r.blocks[0]?.steps[0]).toMatchObject({ seconds: 40, reps: null });
    r = edit.step(r, 0, 1, { seconds: null });
    expect(r.blocks[0]?.steps[1]).toMatchObject({ seconds: 15, reps: null });
  });

  it('blocos: adicionar, ajustar, mover e remover (nunca o último)', () => {
    const newId = ids();
    let r = routine();
    r = edit.addBlock(r, newId);
    expect(r.blocks.map((b) => b.name)).toEqual(['Bloco', 'Bloco 2']);
    r = edit.block(r, 1, { repeat: 5, restAfterSeconds: 0 });
    expect(r.blocks[1]).toMatchObject({ repeat: 5, restAfterSeconds: 0 });
    r = edit.moveBlock(r, 1, 0);
    expect(r.blocks[0]?.name).toBe('Bloco 2');
    r = edit.removeBlock(r, 0);
    expect(r.blocks).toHaveLength(1);
    expect(edit.removeBlock(r, 0)).toBe(r);
    expect(edit.routine(r, { prepSeconds: 0 }).prepSeconds).toBe(0);
  });

  it('desativar uma etapa tira da execução e da prévia, sem apagar', () => {
    let r = routine({ blocks: [block({ repeat: 2 })] });
    expect(summarize(buildTimeline(r)).knownMs).toBe(50_000);
    r = edit.step(r, 0, 1, { disabled: true });
    expect(r.blocks[0]?.steps).toHaveLength(2);
    expect(buildTimeline(r).map((s) => s.phase)).toEqual(['work', 'work']);
    // Bloco com todos os exercícios desativados não roda e o salvar explica.
    r = edit.step(r, 0, 0, { disabled: true });
    expect(buildTimeline(r)).toEqual([]);
    const check = checkRoutine(edit.routine(r, { name: 'X' }));
    expect(check.ok ? '' : check.issues[0]?.message).toBe(
      'O bloco precisa de pelo menos 1 exercício ativo.',
    );
  });
});
