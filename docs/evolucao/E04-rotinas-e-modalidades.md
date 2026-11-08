# E04 · Rotinas e modalidades

Super PRD 04, o maior lote da reescrita. Quebrado em lotes (E01, risco "escopo da E04"),
cada um com testes de unidade, tela e E2E antes de seguir.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Três entradas da Início: cronômetro com voltas, temporizador (nome opcional, repetir ao concluir), intervalado rápido | Entregue 08/11 |
| B | Editor de rotinas (C02): nomear, salvar, duplicar, editar, excluir, reordenar, inserir etapa, desabilitar, blocos e descanso entre blocos, rascunho, prévia com total estimado. Modelos editáveis por modalidade. Favoritos | Entregue 08/11 |
| C | Sessão: visualizações Foco, Anel e Lista (P1), trava contra toque (P2), salto pela lista (P3), progresso com etapas manuais | |
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

