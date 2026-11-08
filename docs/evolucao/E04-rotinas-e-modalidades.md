# E04 · Rotinas e modalidades

Super PRD 04, o maior lote da reescrita. Quebrado em lotes (E01, risco "escopo da E04"),
cada um com testes de unidade, tela e E2E antes de seguir.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Três entradas da Início: cronômetro com voltas, temporizador (nome opcional, repetir ao concluir), intervalado rápido | Entregue 08/11 |
| B | Editor de rotinas (C02): nomear, salvar, duplicar, editar, excluir, reordenar, inserir etapa, desabilitar, blocos e descanso entre blocos, rascunho, prévia com total estimado. Modelos editáveis por modalidade. Favoritos | Entregue 08/11 |
| C | Sessão: visualizações Foco, Anel e Lista (P1), trava contra toque (P2), salto pela lista (P3), progresso com etapas manuais | Entregue 08/11 |
| D | Modalidades com comportamento próprio: EMOM em fronteira de minuto e conclusão antecipada, AMRAP com registro de rodadas, corrida/caminhada, mobilidade com lados | |
| E | Histórico: calendário simples, nota opcional, repetir a configuração registrada | |

## Lote A

| Arquivo | O que faz |
| --- | --- |
| `src/domain/quick.ts` | Temporizador e intervalado viram rotina pelos mesmos limites do editor; ida e volta pelos parâmetros da rota |
| `src/domain/stopwatch.ts` | Cronômetro puro: conta pelo marco, voltas, zerar só parado, recalcula pelo relógio civil ao reabrir |
| `src/features/quick/` | Telas do temporizador, intervalado e cronômetro; última configuração lembrada em preferências |
| `src/ui/stepper.tsx`, `text-field.tsx` | − e + com nome por botão (sem seletor nativo, D08) e campo com rótulo visível |

| # | Decisão | Por quê |
| --- | --- | --- |
| D26 | **Rotina rápida viaja pela rota**, não é salva em "Suas rotinas" | Não polui a lista com cada ajuste. O histórico guarda a rotina inteira, então "Repetir" funciona igual. Id pela configuração: cada combinação vira um card próprio em Recentes |
| D27 | **Repetir ao concluir**: "Tempo esgotado", 3 s com "Parar de repetir" e recomeça já rodando. Cada volta entra no histórico | Encerramento claro (PRD) sem prender a pessoa num laço |
| D28 | **Cronômetro gravado a cada ação, não a cada décimo**; continua contando fora da tela | O tempo é derivado do marco, como no motor: nada a gravar enquanto só corre |
| D29 | **Zerar só pausado e com confirmação**; o botão de volta chama "Marcar volta" | Proteção contra zerar sem querer (PRD). "Volta" e "Voltar" lado a lado confundiam o leitor de tela (o E2E pegou) |

## Lote B

| Arquivo | O que faz |
| --- | --- |
| `src/domain/editor.ts` | Rotina nova, cópia de modelo, carimbo de versão e as edições (bloco e etapa: inserir, duplicar, mover, apagar, desativar), todas puras e validadas pelos limites |
| `src/data/migrations.ts` (V2), `sqlite-repos.ts` | Coluna `position`: a rotina nova entra no topo, `reorder` grava a ordem numa transação, `remove` apaga |
| `src/features/editor/` | Editor (C02) em `/rotina/[id]`, sheets de etapa e de bloco, rascunho em preferências |
| `src/features/routines/` | Favoritas (`prefs.favoritos`) e o sheet "⋯" de cada rotina |

| # | Decisão | Por quê |
| --- | --- | --- |
| D30 | **Modelo pronto nunca muda**: editar abre uma cópia (`/rotina/nova?de=`), que só existe ao salvar | Modelo é referência do app; a cópia pode ser ajustada sem medo |
| D31 | **Rascunho a cada mudança**, por rotina (`rascunho:<id>` ou `rascunho:nova:<origem>`). Sair sem salvar pergunta: continuar, descartar ou sair guardando. Ao voltar, aviso com "Descartar rascunho", que volta à versão salva sem sair | App fechado pelo sistema no meio da edição não perde nada (PRD) |
| D32 | **Etapa desativada fica guardada e não roda** (`disabled`); o bloco precisa de ao menos uma ativa | Testar variações sem apagar e recriar |
| D33 | **Ordem manual pelo "⋯"** (mover para cima/baixo), não por arrastar | Arrastar é difícil com leitor de tela e em mão suada; dois botões funcionam igual nos dois |
| D34 | **Favoritas misturam modelos e rotinas próprias**, na ordem em que foram marcadas, numa seção da Início | Atalho para o que se usa toda semana sem duplicar o modelo |
| D35 | **Sem botão morto nos sheets**: no último bloco ou última etapa, o motivo aparece escrito no lugar de "Apagar" | O inativo-que-explica perde o `aria-disabled` no web (o `Pressable` do RN-web força `aria-disabled={disabled}`) e o axe acusou contraste. Texto é mais claro nos dois |

Testes: domínio do editor 100%; editor com banco real (nova, cópia de modelo, versão, rascunho
recuperado e descartado, sair sem mudança, etapa por repetições, desativar, blocos); ações na
Início e na modalidade (mover, duplicar, apagar com confirmação, favoritas gravadas e com lixo);
E2E com axe (copiar modelo, ajustar, salvar, favoritar e recarregar; rascunho ao sair).

## Lote C

| Arquivo | O que faz |
| --- | --- |
| `src/domain/engine.ts` (`jumpTo`) | Salto pela lista: início da etapa escolhida, tempo ativo só do que correu, sessão marcada `jumped` |
| `src/domain/progress.ts` | Progresso da fase e do treino; com etapa por repetições anda por etapa, nunca inventa duração |
| `src/domain/session-prefs.ts` | Visualização e trava ao começar, lidas campo a campo (`prefs.sessao`) |
| `src/data/migrations.ts` (V3) | `history.adjusted`: treino com salto ou relógio recalculado fica marcado |
| `src/features/session/session-bodies.tsx` | Corpos Anel, Foco (fundo na cor da fase) e Lista (feitas, atual, próximas) |
| `src/features/session/session-controls.tsx`, `use-touch-lock.ts` | Botões redondos, cadeado, aviso de tela travada, seletor de visualização |
| `src/ui/progress-ring.tsx` | Anel em `react-native-svg` (módulo nativo novo: pede build de desenvolvimento) |

| # | Decisão | Por quê |
| --- | --- | --- |
| D36 | **Trava ligada por padrão ao começar**; toque simples só lembra como destravar; **segurar o cadeado 1 s destrava**; parada de mexer, volta a travar em 5 s | P2: celular no chão ou no braço não pausa nem pula com esbarrão |
| D37 | **Travada, pausar, retomar e "Concluí" funcionam com toque longo (0,6 s)**; X, pular e voltar não | Parar nunca fica difícil, e esbarrar não age |
| D38 | **Salto só pela Lista, com confirmação**, e marca o histórico como ajustado (coluna nova, não um status) | Voltar à rodada 1 sem 10 toques (P3), sem invalidar o treino |
| D39 | **Seletor de visualização só destravado**, também na prévia; a escolha fica gravada | P1 |
| D40 | **Cores de fase próprias** (preparação âmbar, exercício verde, descanso azul, entre blocos índigo, desaquecimento verde-água), iguais nos dois temas, branco por cima medido em 4,5:1 | O Foco é lido de longe pela cor; o verde original (#2E7D32) reprovou com o branco suave |
| D41 | **Sem nome próprio, a fase aparece uma vez** ("EXERCÍCIO", não "EXERCÍCIO / Exercício") | Visto na captura |

Testes: domínio 100% (salto, progresso com etapa manual, preferências); tela com banco real
(trava, toque longo, volta da trava em 5 s, preferência desligada, "Concluí" travado, troca de
visualização sem mexer no tempo, salto com cancelar e confirmar, histórico ajustado); E2E com axe
nas três visualizações e o toque longo pelo relógio do Playwright.

Pendente de aparelho: o toque longo e a trava com a mão suada e com luva (roteiro da E03).

