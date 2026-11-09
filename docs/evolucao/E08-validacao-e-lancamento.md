# E08 · Validação e versão candidata

Super PRD 08: preparar uma versão candidata para validação, **sem publicar**. Base: E07 completa
(669 testes Jest com domínio a 100%, 86 E2E com axe, roteiro de aparelho E03 + E07 pendente do
APK único).

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Qualidade e fluxos críticos: mapa de cada exigência do PRD para o teste que a prova; lacunas cobertas (primeira abertura sem rede, permissão recusada, texto ampliado, arquivo vindo de outro sistema); fixtures de versões anteriores conferidas | Feito |
| B | Performance: o que dá para medir sem aparelho (abertura do pacote web, resposta dos controles, precisão das transições, biblioteca e histórico volumosos) com limite em teste; roteiro de medição no aparelho (abertura, memória e bateria em sessão longa) | A fazer |
| C | Monetização: banner discreto só com IDs de teste, longe dos controles de treino, sem intersticial; uso normal sem anúncio (falha, offline, sem preenchimento); consentimento e declarações pela documentação oficial atual | A fazer |
| D | Lojas: textos nas 4 línguas (título candidato, descrição curta e completa) dentro dos limites atuais de cada loja; lista de capturas; privacidade igual ao comportamento real; instruções de backup e importação; nada de "funciona ilimitado em segundo plano" | A fazer |
| E | Relatório final: matriz Android/iOS de cada requisito (aprovado, reprovado, não testado), evidências, defeitos que impedem lançamento, limitações, o que depende de aparelho ou conta, próximos passos | A fazer |

## Decisões de partida

| # | Decisão | Por quê |
| --- | --- | --- |
| D123 | **Matriz com três estados por plataforma e evidência ao lado de cada um**; Jest e navegador provam o comportamento do app, não o do aparelho | O PRD proíbe trocar evidência de aparelho por afirmação. Sem APK instalado, as colunas Android e iOS ficam "não testado" mesmo com o teste web verde, e o relatório diz qual teste web cobre a lógica |
| D124 | **Anúncio só fora do treino** (nunca na sessão, no editor nem em diálogo) e só no aparelho; a web não carrega SDK de anúncio | "Espaço suficiente dos controles de treino": o jeito mais seguro é não haver anúncio na tela de treino. A prévia web é para o Ramon ver as telas, não para monetizar |
| D125 | **Nenhuma conta de loja ou de anúncio é criada nesta etapa** | Sem publicar e sem anúncio real. Disponibilidade do nome e limites "nos consoles" ficam como pendência de conta, registrada no relatório |

## Lote A · Qualidade e fluxos críticos

### Qualidade: exigência do PRD e onde está a prova

| Exigência | Evidência |
| --- | --- |
| Tipos, lint e testes | CI a cada push: `tsc`, ESLint com zero aviso, knip, Prettier, Jest com cobertura (domínio a 100%, limite no `package.json`), E2E Playwright com axe |
| Unitários do motor temporal | `domain/engine.test.ts` (relógio monotônico e civil, pausa, retomada, salto), `timeline.test.ts`, `events.test.ts` |
| Cálculo de duração | `timeline.test.ts`; "prévia e execução têm a mesma duração" em `engine.test.ts` para todos os modelos [PRD 7] |
| Migrações | `data/migrations.test.ts` (banco), `domain/legacy.test.ts` e `data/legacy-import.test.ts` (dados do app antigo) |
| Importação | `domain/transfer.test.ts`, `transfer-plan.test.ts`, `features/transfer/incoming.test.ts`, `transfer-screens.test.tsx` |
| Integração editor, persistência, histórico | `editor-screen.test.tsx`, `step-sheet.test.tsx`, `data/sqlite-repos.test.ts`, `data-context.test.tsx`, `history-screen.test.tsx`, `history-detail-screen.test.tsx` (banco SQLite real em memória) |
| Fixtures de versões anteriores | `src/test/fixtures/legado-v1.ts` (app antigo), `backup-e05.cronobr` (lido por `compat-e05.test.ts`), `rotina-cadencia-e07.cronobr` (lido pelo commit anterior e por `compat-e07.test.ts`) |
| Sem testar detalhe interno | Telas testadas pelo que a pessoa vê e toca (papel e nome acessível, Testing Library); domínio pelo resultado, não pela forma |

### Fluxos críticos

"Web" é a prova no Chromium e no Jest; o aparelho é outra coluna, preenchida no relatório final
(lote E).

| # | Fluxo | Prova sem aparelho | Falta no aparelho |
| --- | --- | --- | --- |
| 1 | Primeira abertura sem rede | `e2e/fluxos.spec.ts`: toda requisição de fora falha e o app nem tenta nenhuma; abre, treina, passa no axe | Abrir o APK pela primeira vez em modo avião |
| 2 | Criar rotina, salvar, fechar e repetir | `editor.spec.ts` (salvar e achar depois de recarregar), `historico.spec.ts` (repetir pelo registro) | Fechar pelo multitarefa e reabrir |
| 3 | Concluir e registrar uma única vez | `sessao.spec.ts` ("histórico com um registro"), `session-screen.test.tsx` | Concluir com a tela bloqueada |
| 4 | Interromper e retomar | `sessao.spec.ts` (recarregar no meio retoma pelo relógio), `engine.test.ts` (restore) | Roteiro E03 #10 (encerrar à força) |
| 5 | Exportar no Android, importar no iOS | Formato igual nas duas plataformas (`formato-cronobr.md`); arquivo com BOM, CRLF ou indentado abre igual (`transfer.test.ts`, defeito achado e corrigido, D126); `backup.spec.ts` | Os dois aparelhos, pelo compartilhar de cada sistema |
| 6 | Exportar no iOS, importar no Android | Idem | Idem |
| 7 | Atualizar com dados antigos | `legacy-import.test.ts`, `legacy.test.ts`, `compat-e05.test.ts`, `compat-e07.test.ts`, `migrations.test.ts` | Instalar a versão da loja, usar, e atualizar para o APK novo por cima |
| 8 | Recusar permissões | Notificação recusada: aviso na prévia do treino e em Avisos, com botão para as configurações, e o treino segue (`notifications-blocked.test.tsx`, `session-screen.test.tsx`, `expo-port.test.ts`; lacuna achada e coberta, D127) | Recusar no primeiro pedido e conferir o aviso; liberar e voltar |
| 9 | Ouvir música com a tela bloqueada | Aviso abaixa a música dos outros apps e respeita o modo silencioso (`expo-port.test.ts`) | Roteiro E03 #1 e #2 |
| 10 | Texto ampliado e leitor de tela | axe (WCAG 2.2 AA) em todas as telas dos E2E; teto de ampliação por estilo de texto (`maxScale` em `ui/tokens.ts`); testes de tela pelo nome acessível; alvos de toque de 44 px (`layout.spec.ts`); telas conferidas em 320 x 568 (`capturas/matriz.spec.ts`) | TalkBack e VoiceOver de verdade; fonte do sistema no máximo |

### Decisões do lote A

| # | Decisão | Por quê |
| --- | --- | --- |
| D126 | **Arquivo com BOM no começo abre** (o BOM é ignorado) | Editor de texto e alguns apps de mensagem regravam o arquivo com BOM; antes ele era recusado como "incompleto ou não é do CronôBR". Quebra CRLF e indentação já abriam; agora há teste |
| D127 | **Notificação recusada vira aviso com explicação e botão**, na prévia do treino e em Avisos, nunca no meio do treino; confere de novo ao voltar para o app | O app funciona igual com a tela à vista; o que muda é a tela bloqueada, e a pessoa precisa saber disso antes de começar. Aviso e botão separados porque, num aviso clicável, o leitor de tela só leria o rótulo do botão. Na web não há notificação agendada: o aviso não aparece |
