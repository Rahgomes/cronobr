import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { presetById } from '@/domain/presets';
import { appRepos, renderApp } from '@/test/app';
import { block, must, routine, step } from '@/test/domain';
import { router, usePreventRemove } from '@/test/expo-router-mock';

import { draftKey, EditorScreen } from './editor-screen';

jest.mock('expo-router', () => jest.requireActual<object>('@/test/expo-router-mock'));
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

afterEach(() => {
  jest.clearAllMocks();
});

/** O "voltar" do sistema: o editor intercepta quando há mudança não salva. */
function pressSystemBack() {
  const [prevent, onPrevent] = must(usePreventRemove.mock.calls.at(-1));
  return { prevented: prevent, run: onPrevent };
}

describe('editor de rotinas', () => {
  it('nova: sem nome não salva e diz por quê; com nome grava e volta', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" modality="circuito" />, repos);
    expect(await screen.findByRole('header', { name: 'Nova rotina' })).toBeOnTheScreen();
    expect(screen.getByText('Dê um nome da rotina.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Circuito', selected: true })).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Nome da rotina'), 'Circuito de sexta');
    // Preparação 0:10 + 3 × 0:30 + 2 × 0:15 (sem o último descanso) = 2:10
    expect(screen.getByText('2:10')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
    const [saved] = await repos.routines.list();
    expect(saved).toMatchObject({ name: 'Circuito de sexta', modality: 'circuito', version: 1 });
    expect(await repos.prefs.get(draftKey('nova', undefined, 'circuito'))).toBeUndefined();
  });

  it('etapa: renomear, passar para repetições, desativar; a prévia acompanha', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" />, repos);
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Exercício, 0:30\. Editar etapa$/ }),
    );
    await fireEvent.changeText(screen.getByLabelText('Nome da etapa'), 'Flexão');
    await fireEvent.press(screen.getByRole('button', { name: 'Por repetições' }));
    expect(screen.getByLabelText('Repetições: 10')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.getByText(/\+ 3 por repetições/)).toBeOnTheScreen();
    expect(screen.getByText('Total estimado')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /^Descanso, 0:15\. Editar etapa$/ }));
    await fireEvent(screen.getByRole('switch', { name: 'Etapa ativa' }), 'press');
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(
      screen.getByRole('button', { name: 'Descanso, 0:15, desativada. Editar etapa' }),
    ).toBeOnTheScreen();
    // Sem descanso ativo: só preparação e as 3 flexões na prévia.
    expect(screen.getByText(/1 bloco · 4 etapas/)).toBeOnTheScreen();
  });

  it('inserir, mover e apagar etapa; bloco novo e rodadas', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" />, repos);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Adicionar etapa em Bloco 1' }),
    );
    // A etapa nova abre direto para ajustar.
    await fireEvent.press(screen.getByRole('button', { name: 'Mover para cima' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar etapa' }));
    expect(screen.queryByLabelText('Nome da etapa')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: '+ Adicionar bloco' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Bloco 1, 3 rodadas. Editar bloco' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar Rodadas' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(
      screen.getByRole('button', { name: 'Bloco 1, 4 rodadas. Editar bloco' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Descanso entre blocos, 1:00. Editar' }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Bloco 2, 3 rodadas. Editar bloco' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar bloco' }));
    await fireEvent.press(must(screen.getAllByRole('button', { name: 'Apagar' }).at(-1)));
    expect(screen.queryByRole('button', { name: /Bloco 2/ })).toBeNull();
  });

  it('último bloco e última etapa não se apagam: o motivo aparece no lugar do botão', async () => {
    const { repos } = await appRepos();
    await repos.routines.save(
      routine({
        id: 'm',
        name: 'Uma etapa',
        blocks: [block({ steps: [step({ kind: 'work', seconds: 20 })] })],
      }),
    );
    await renderApp(<EditorScreen id="m" />, repos);
    await fireEvent.press(await screen.findByRole('button', { name: /Editar bloco$/ }));
    expect(screen.queryByRole('button', { name: 'Apagar bloco' })).toBeNull();
    expect(screen.getByText('A rotina precisa de pelo menos um bloco.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    await fireEvent.press(screen.getByRole('button', { name: /Editar etapa$/ }));
    expect(screen.queryByRole('button', { name: 'Apagar etapa' })).toBeNull();
    expect(screen.getByText('O bloco precisa de pelo menos uma etapa.')).toBeOnTheScreen();
  });

  it('etapa dos dois lados e que pode terminar antes: gravadas e vistas na prévia', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" />, repos);
    await fireEvent.changeText(await screen.findByLabelText('Nome da rotina'), 'Lados');
    await fireEvent.press(screen.getByRole('button', { name: /^Exercício, 0:30\. Editar etapa$/ }));
    await fireEvent(screen.getByRole('switch', { name: 'Os dois lados' }), 'press');
    await fireEvent(screen.getByRole('switch', { name: 'Pode terminar antes' }), 'press');
    // Por repetições, "terminar antes" não faz sentido e some.
    await fireEvent.press(screen.getByRole('button', { name: 'Por repetições' }));
    expect(screen.queryByRole('switch', { name: 'Pode terminar antes' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Por tempo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    // 3 rodadas × 2 lados = 6 exercícios na prévia.
    expect(screen.getByText(/1 bloco · \d+ etapas/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => {
      const [saved] = await repos.routines.list();
      expect(saved?.blocks[0]?.steps[0]).toMatchObject({ sides: true, early: true });
    });
  });

  it('modelo pronto vira cópia; o modelo não muda', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" from="tabata-classic" />, repos);
    expect(await screen.findByDisplayValue('Tabata clássico')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar e começar' }));
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    const [copy] = await repos.routines.list();
    expect(copy?.origin).toBe('custom');
    expect(copy?.id).not.toBe('tabata-classic');
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/sessao',
      params: { rotina: copy?.id },
    });
    expect(presetById('tabata-classic')?.origin).toBe('preset');
  });

  it('editar rotina própria sobe a versão', async () => {
    const { repos } = await appRepos();
    await repos.routines.save(routine({ id: 'm', name: 'Minha' }));
    await renderApp(<EditorScreen id="m" />, repos);
    expect(await screen.findByRole('header', { name: 'Editar rotina' })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Nome da rotina'), 'Minha 2');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => {
      expect(await repos.routines.get('m')).toMatchObject({ name: 'Minha 2', version: 2 });
    });
  });

  it('rascunho: sair sem salvar guarda; ao voltar, recupera e dá para descartar', async () => {
    const { repos } = await appRepos();
    await repos.routines.save(routine({ id: 'm', name: 'Minha' }));
    const first = await renderApp(<EditorScreen id="m" />, repos);
    await fireEvent.changeText(await screen.findByLabelText('Nome da rotina'), 'Mudou');
    const back = pressSystemBack();
    expect(back.prevented).toBe(true);
    await act(async () => {
      back.run();
      await Promise.resolve();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Sair e guardar rascunho' }));
    await waitFor(() => {
      expect(router.back).toHaveBeenCalled();
    });
    await first.unmount();

    await renderApp(<EditorScreen id="m" />, repos);
    expect(await screen.findByDisplayValue('Mudou')).toBeOnTheScreen();
    expect(screen.getByText(/Rascunho recuperado/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Descartar rascunho' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Descartar' }));
    await waitFor(async () => {
      expect(await repos.prefs.get('rascunho:m')).toBeUndefined();
    });
    expect((await repos.routines.get('m'))?.name).toBe('Minha');
    // Segue no editor, com a versão salva e sem o aviso.
    expect(await screen.findByDisplayValue('Minha')).toBeOnTheScreen();
    expect(screen.queryByText(/Rascunho recuperado/)).toBeNull();
  });

  it('sem mudança, sair não pergunta; rotina inexistente explica', async () => {
    const { repos } = await appRepos();
    await repos.routines.save(routine({ id: 'm', name: 'Minha' }));
    const view = await renderApp(<EditorScreen id="m" />, repos);
    await screen.findByDisplayValue('Minha');
    expect(pressSystemBack().prevented).toBe(false);
    await view.unmount();
    await renderApp(<EditorScreen id="sumiu" />, repos);
    expect(await screen.findByRole('header', { name: 'Rotina não encontrada' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('descartar alterações ao sair apaga o rascunho', async () => {
    const { repos } = await appRepos();
    await renderApp(<EditorScreen id="nova" modality="boxe" />, repos);
    await fireEvent.changeText(await screen.findByLabelText('Nome da rotina'), 'X');
    const exit = pressSystemBack();
    await act(async () => {
      exit.run();
      await Promise.resolve();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Descartar alterações' }));
    await waitFor(async () => {
      expect(await repos.prefs.get(draftKey('nova', undefined, 'boxe'))).toBeUndefined();
    });
    expect(await repos.routines.list()).toEqual([]);
    expect(screen.queryByText('Sair do editor?')).toBeNull();
  });
});
