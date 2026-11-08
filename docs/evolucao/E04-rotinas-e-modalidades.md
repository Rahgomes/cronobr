# E04 · Rotinas e modalidades

Super PRD 04, o maior lote da reescrita. Quebrado em lotes (E01, risco "escopo da E04"),
cada um com testes de unidade, tela e E2E antes de seguir.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Três entradas da Início: cronômetro com voltas, temporizador (nome opcional, repetir ao concluir), intervalado rápido | Entregue 08/11 |
| B | Editor de rotinas (C02): nomear, salvar, duplicar, editar, excluir, reordenar, inserir etapa, desabilitar, blocos e descanso entre blocos, rascunho, prévia com total estimado. Modelos editáveis por modalidade. Favoritos | Próximo |
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
