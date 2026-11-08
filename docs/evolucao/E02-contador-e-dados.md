# E02 · Contador e dados

Base temporal e modelo de dados da reescrita (super PRD 02). Entregue em 07/11/2026.

## 1. O que entrou

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| Domínio | `src/domain/routine.ts` | Rotina com id estável, nome, modalidade, versão, origem; blocos com rodadas e descanso entre blocos; etapas com nome e tempo próprios ou por repetições |
| Domínio | `src/domain/timeline.ts` | Rotina desenrolada em segmentos. A prévia e a execução leem a mesma lista |
| Domínio | `src/domain/limits.ts` | Limites explícitos com mensagem em português (schema zod, reaproveitado no editor da E04 e na importação da E05) |
| Domínio | `src/domain/engine.ts` | Motor puro: estados, marcos, pausa, pular, voltar, "Concluí", recuperação |
| Domínio | `src/domain/events.ts` | Eventos derivados de duas leituras (fase, 3-2-1, metade, fim), sem repetir e sem avisos vencidos |
| Domínio | `src/domain/legacy.ts` | Conversão das 10 chaves `@cronobr/*` do app antigo |
| Dados | `src/data/sql.ts`, `migrations.ts` | Porta do banco, fila única, transação, migração por `user_version` |
| Dados | `src/data/sqlite-repos.ts`, `legacy-import.ts`, `open-data.ts` | Rotinas, histórico paginado, sessão em andamento, preferências, importação única |
| Tela | `src/features/session/` | Sessão provisória (pronto, rodando, pausado, fim), X e voltar com confirmação |
| Tela | `src/features/home/`, `src/features/history/` | Início provisória com rotinas prontas e "Continuar treino"; histórico sem limite |

As telas desta etapa são funcionais, não as finais: Início (C01b), editor (C02) e as três
visualizações da sessão (C03) chegam na E04.

## 2. Decisões

| # | Decisão | Por quê |
| --- | --- | --- |
| D11 | **Sem descanso depois da última rodada** de cada bloco. Entre blocos vale o descanso do bloco; depois do último bloco, só o desaquecimento, se houver. Etapa de duração zero não entra | É o comportamento do app antigo (a prévia e a execução já concordavam) e o que a pessoa espera: o treino acaba no último esforço. A regra mora só em `buildTimeline`, então prévia e execução não têm como divergir |
| D12 | **Relógio:** posição derivada de marcos. Com o app aberto vale o monotônico (`performance.now`); ao voltar do segundo plano, se o civil andou mais, vale o civil (o monotônico do Android e do iPhone para quando o aparelho dorme); com o app reaberto (processo novo ou aparelho reiniciado), o tempo desde o último marco vem do civil. Civil para trás ou intervalo acima de 12 h: a sessão fecha como **interrompida no último marco**, sem inventar tempo | O JS não tem relógio que sobreviva a reinício. Marco a cada troca de fase e ao ir para segundo plano limita o erro a uma fase. Troca da hora para frente durante o segundo plano conta como tempo passado: é o preço de tratar o sono do aparelho, muito mais comum. A E03 pode trocar por `elapsedRealtime` nativo se a prova de aparelho pedir |
| D13 | **SQLite** (`expo-sqlite`) com uma conexão e fila única; transação em cada gravação composta; `INSERT OR IGNORE` com o id da sessão no histórico | Consistência: concluir grava histórico e apaga a sessão na mesma transação. Volume: histórico sem teto, lido por página (50). Migração: `user_version` versionado, cada passo atômico. O AsyncStorage regravava o JSON inteiro a cada treino e cortava em 100 |
| D14 | **Validar limites na entrada, só a forma na leitura** | Se um limite apertar no futuro, o que já foi gravado continua abrindo. Linha ilegível é pulada na lista e fica no banco |
| D15 | **Importação do app antigo uma vez, numa transação**, sem apagar as chaves antigas. Item ilegível vai para `legacy_problems` com o texto original | Nada se perde, e uma versão futura ainda pode reler. Leitura falhou: nada é marcado e tenta de novo na próxima abertura; o app abre assim mesmo |
| D16 | **Web com o mesmo SQLite** (wasm + OPFS), com os cabeçalhos COOP/COEP no Metro, no EAS Hosting (plugin `expo-router`) e no E2E (`e2e/serve.json`) | A prévia web testa o mesmo caminho de dados do celular. Limite conhecido: uma aba por vez |

## 3. Limites

| Item | Limite |
| --- | --- |
| Etapa | 1 s a 3 h, ou por repetições (1 a 999) |
| Preparação | até 10 min |
| Desaquecimento | até 30 min |
| Descanso entre blocos | até 1 h |
| Rodadas por bloco | 1 a 99 |
| Blocos | 1 a 20, com até 50 etapas cada e pelo menos 1 de exercício |
| Rotina | até 2.000 etapas desenroladas e 6 h no total |
| Nome | até 60 letras |

## 4. Os 10 testes do super PRD 02

| # | Cenário | Onde |
| --- | --- | --- |
| 1 | Pausar e retomar várias vezes | `engine.test.ts`, `session-screen.test.tsx`, E2E `sessao.spec.ts` |
| 2 | Callback atrasado atravessando fases | `engine.test.ts`, `session-screen.test.tsx` |
| 3 | Retorno depois da conclusão | `engine.test.ts` (fecha na hora exata do fim), `session-screen.test.tsx` (reaberto) |
| 4 | Mudança do relógio civil | `engine.test.ts` (aberto, segundo plano, reaberto), `session-screen.test.tsx` |
| 5 | Etapas de duração zero | `timeline.test.ts`, `legacy.test.ts` |
| 6 | Descanso final | `timeline.test.ts`, `engine.test.ts` |
| 7 | Prévia x execução | `engine.test.ts` (todas as rotinas prontas), `session-screen.test.tsx`, E2E |
| 8 | Conclusão registrada uma vez | `engine.test.ts`, `sqlite-repos.test.ts` (chamadas concorrentes), `session-screen.test.tsx`, E2E |
| 9 | Migração dos dados antigos | `legacy.test.ts` e `legacy-import.test.ts` com o dump `src/test/fixtures/legado-v1.ts` |
| 10 | Gravação interrompida ou armazenamento indisponível | `sql.test.ts`, `migrations.test.ts`, `sqlite-repos.test.ts`, `legacy-import.test.ts`, `data-context.test.tsx`, `session-screen.test.tsx` |

O banco dos testes é SQLite de verdade (`node:sqlite` em memória, `src/test/node-sqlite.ts`), com
falha injetável em qualquer comando. Cobertura de `src/domain`: 100% (trava no `jest`).

## 5. Fica para a E03

- Efeitos dos eventos: som (pacote ElevenLabs), voz com fila, vibração por evento. Hoje só o
  leitor de tela anuncia a troca de fase.
- Manter a tela acesa durante o treino e a notificação com o tempo no segundo plano.
- Prova de aparelho (Maestro) para suspensão, reinício e troca de hora: o motor está coberto por
  teste, o comportamento do sistema operacional não.
