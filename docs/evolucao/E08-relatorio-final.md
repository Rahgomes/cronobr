# Relatório final da versão candidata (E08 lote E)

Data: 10/11/2026. Versão 2.0.0, branch `main`. Nada publicado, nenhuma conta de loja ou de anúncio
criada, anúncios só com IDs de teste.

## Veredito

**Não está pronta para lançamento.** A lógica do app está aprovada em todos os requisitos das
etapas 02 a 08, com teste automatizado. Mas **nenhum requisito foi testado em Android ou iPhone de
verdade**, e o PRD não aceita teste unitário nem navegador como prova do comportamento nativo
(D123). O que falta é rodar o APK e o build de iPhone nos roteiros já escritos, e criar as contas.

| Coluna | O que significa |
| --- | --- |
| Lógica | Jest (domínio, telas com banco SQLite real, adaptadores com módulos simulados) e Playwright no Chromium com axe. Prova o que o app decide e mostra, não o que o sistema do celular faz |
| Android, iOS | Só com o app instalado no aparelho. **Aprovado**, **Reprovado** ou **Não testado** |

Contagem: **740 testes Jest** (domínio com 100% de cobertura, limite no `package.json`),
**94 E2E** passando e 6 pulados de propósito (medições num tema só), CI verde a cada push.
**Nenhum requisito reprovado na lógica. Android e iOS: tudo não testado.**

## Matriz por requisito

Roteiros citados: E03 #1 a #10 (`E03-segundo-plano-e-avisos.md`, seção 5), E05 (`E05-backup-e-transferencia.md`,
seção 4), E06 (letra máxima e leitores de tela), E07 E1 a E11 (`E07-multiplos-timers-e-cadencia.md`),
E08 fluxos 1 a 10, P1 a P7 e A1 a A6 (`E08-validacao-e-lancamento.md`).

### Base (contexto permanente)

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Funciona sem internet desde a primeira abertura | Aprovado | `fluxos.spec.ts` (toda requisição de fora derrubada; o app não tenta nenhuma) | Não testado | Não testado | Fluxo 1 |
| 2 | Dados persistentes locais | Aprovado | `sqlite-repos.test.ts`, `data-context.test.tsx`, `editor.spec.ts` (recarregar) | Não testado | Não testado | Fluxo 2 |
| 3 | Identidade laranja, preto e cinza, tema claro coerente | Aprovado | `theme.test.ts` (contraste), capturas 01 a 31 nos dois temas | Não testado | Não testado | Capturas da loja |
| 4 | Movimento reduzido respeitado | Aprovado | `use-reduce-motion.test.ts` | Não testado | Não testado | E06 |
| 5 | Publicidade nunca impede começar ou retomar o treino | Aprovado | `ad-slot.test.tsx`, `session-screen.test.tsx`, `editor-screen.test.tsx` | Não testado | Não testado | A2, A3 |

### Etapa 02 · Contador e dados

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | Tempo pelo relógio, não pela tela; estados pronto, executando, pausado, concluído, interrompido | Aprovado | `engine.test.ts` (monotônico e civil) | Não testado | Não testado | E03 #1, #9 |
| 7 | Pausar e retomar várias vezes | Aprovado | `engine.test.ts`, `session-screen.test.tsx` | Não testado | Não testado | E03 #8 |
| 8 | Callback atrasado atravessando fases; sem repetir avisos vencidos | Aprovado | `engine.test.ts`, `events.test.ts` | Não testado | Não testado | E03 #1 |
| 9 | Volta depois do horário de conclusão; mudança do relógio civil; reinício do aparelho | Aprovado | `engine.test.ts` (restore, salto, reboot) | Não testado | Não testado | E03 #10 |
| 10 | Duração zero, entradas inválidas, limites com mensagem útil | Aprovado | `limits.test.ts`, `number-input.test.ts`, `stepper.test.tsx` | Não testado | Não testado | |
| 11 | Descanso final definido; prévia igual à execução | Aprovado | `timeline.test.ts`, `engine.test.ts` (todos os modelos) | Não testado | Não testado | |
| 12 | Conclusão registrada uma única vez | Aprovado | `session-screen.test.tsx`, `sessao.spec.ts` | Não testado | Não testado | Fluxo 3 |
| 13 | Modelo de dados: rotina versionada, etapas, blocos, preparação, encerramento, repetições, histórico com cópia, sessão, preferências | Aprovado | `routine`/`timeline`/`sqlite-repos` tests, `formato-cronobr.md` | Não testado | Não testado | |
| 14 | Migração de dados antigos, recuperável; gravação interrompida | Aprovado | `migrations.test.ts`, `legacy.test.ts`, `legacy-import.test.ts`, `expo-db.test.ts` | Não testado | Não testado | Fluxo 7 |

### Etapa 03 · Segundo plano e avisos

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 15 | Prova técnica mínima por plataforma | Não feito | Pedia aparelho; ficou para o APK único | Não testado | Não testado | E03 #1 |
| 16 | Comportamento definido por situação (visível, fundo, bloqueada, encerrado, forçado, reinício) | Aprovado | `E03-segundo-plano-e-avisos.md` seção 3, `away.test.ts` | Não testado | Não testado | E03 #1, #9, #10 |
| 17 | Avisos com a tela bloqueada por notificação agendada; alarme exato no Android | Aprovado | `cues.test.ts` (plano, teto de 50), `expo-port.test.ts` | Não testado | Não testado | E03 #1, #6 |
| 18 | Sons próprios e distintos por fase, offline | Aprovado | `cues.test.ts`, `assets/sounds` | Não testado | Não testado | E03 #1 |
| 19 | Voz, som e vibração independentes, com prévia | Aprovado | `cue-settings-screen.test.tsx`, `avisos.spec.ts` | Não testado | Não testado | E03 #1 |
| 20 | Voz indisponível: alternativa local e explicação | Aprovado | `expo-port.test.ts` | Não testado | Não testado | E03 |
| 21 | Sem falas sobrepostas nem fila atrasada | Aprovado | `events.test.ts` (prioridade), `session-cadence.test.tsx` | Não testado | Não testado | E03 #1 |
| 22 | Música dos outros apps abaixa e volta; modo silencioso respeitado | Aprovado | `expo-port.test.ts` (`duckOthers`, silencioso) | Não testado | Não testado | E03 #2, #3 |
| 23 | Ligação, fone e Bluetooth | Aprovado | `resistencia.spec.ts` (áudio suspenso retoma), `engine.test.ts` do metrônomo | Não testado | Não testado | E03 #4, #7; E07 |
| 24 | Notificações negadas: o treino segue e o app explica | Aprovado | `notifications-blocked.test.tsx`, `session-screen.test.tsx` | Não testado | Não testado | E03 #5, fluxo 8 |
| 25 | Atraso medido entre previsto e ouvido | Não testado | Na web: trocas de fase com erro máximo de 34 ms (`desempenho.spec.ts`) | Não testado | Não testado | E03, P4 |

### Etapa 04 · Rotinas e modalidades

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 26 | Três entradas: cronômetro, temporizador, intervalado; última rotina e favoritas | Aprovado | `home-screen.test.tsx`, `inicio.spec.ts`, `rapido.spec.ts` | Não testado | Não testado | |
| 27 | Cronômetro com voltas, total e por volta, proteção ao zerar | Aprovado | `quick-screens.test.tsx`, `rapido.spec.ts` | Não testado | Não testado | |
| 28 | Temporizador rápido: nome, repetir, fim claro | Aprovado | `quick-screens.test.tsx`, `rapido.spec.ts` | Não testado | Não testado | |
| 29 | Editor: nomear, salvar, duplicar, editar, excluir, reordenar | Aprovado | `editor-screen.test.tsx`, `routine-options.test.tsx`, `editor.spec.ts` | Não testado | Não testado | Fluxo 2 |
| 30 | Inserir etapa no meio, nome e duração por etapa, desabilitar sem apagar | Aprovado | `editor.test.ts`, `step-sheet.test.tsx` | Não testado | Não testado | |
| 31 | Blocos repetidos, descanso entre blocos, preparação distinta | Aprovado | `editor.test.ts`, `timeline.test.ts` | Não testado | Não testado | |
| 32 | Prévia ordenada e duração total (estimada com etapa manual) | Aprovado | `session-screen.test.tsx`, `progress.test.ts` | Não testado | Não testado | |
| 33 | Rascunho ao sair; confirmar descarte | Aprovado | `editor-screen.test.tsx`, `editor.spec.ts` | Não testado | Não testado | |
| 34 | Modalidades: Tabata, HIIT, EMOM (fronteira de minuto e conclusão antecipada), AMRAP (rodadas manuais), boxe, circuito, corrida, mobilidade com lados, personalizada | Aprovado | `presets.test.ts`, `session-modalities.test.tsx`, `modalidades.spec.ts` | Não testado | Não testado | |
| 35 | Repetições com avanço manual, sem contagem inventada | Aprovado | `session-screen.test.tsx` ("Concluí") | Não testado | Não testado | |
| 36 | Durante a sessão: nome, etapa, próxima, rodada, bloco, tempo, progresso, pausa, encerrar | Aprovado | `session-screen.test.tsx`, `session-layout.test.tsx`, `sessao.spec.ts` | Não testado | Não testado | |
| 37 | Proteção contra toque acidental | Aprovado | `session-lock.test.tsx` | Não testado | Não testado | E04 (toque longo com luva) |
| 38 | Histórico: concluídas e interrompidas, duração ativa, repetir, calendário, nota | Aprovado | `history-screen.test.tsx`, `history-detail-screen.test.tsx`, `historico.spec.ts` | Não testado | Não testado | P7 |
| 39 | Persistência depois de fechar e reabrir | Aprovado | `editor.spec.ts`, `historico.spec.ts`, `sessao.spec.ts` (recarregar) | Não testado | Não testado | Fluxo 2, 4 |

### Etapa 05 · Backup e transferência

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 40 | Compartilhar rotina; backup com preferências; histórico opcional | Aprovado | `transfer.test.ts`, `transfer-screens.test.tsx`, `backup.spec.ts` | Não testado | Não testado | E05 |
| 41 | Formato `.cronobr` documentado e versionado | Aprovado | `docs/spec/formato-cronobr.md`, `transfer.test.ts` | Não testado | Não testado | |
| 42 | Prévia antes de aplicar; duplicatas; reimportar previsível; atualização com escolha | Aprovado | `transfer-plan.test.ts`, `transfer-screens.test.tsx` | Não testado | Não testado | |
| 43 | Restaurar com confirmação e cópia para desfazer; nada aplicado pela metade; bloqueado com treino ativo | Aprovado | `transfer-plan.test.ts`, `sqlite-repos.test.ts`, `transfer-screens.test.tsx` | Não testado | Não testado | |
| 44 | Arquivo truncado, inválido, grande, versão futura; acentos, emoji, nomes longos; BOM | Aprovado | `transfer.test.ts`, `compat-e05.test.ts`, `compat-e07.test.ts` | Não testado | Não testado | |
| 45 | Android exporta e iOS importa, e o contrário | Aprovado (formato único) | `formato-cronobr.md`, `portable-prefs.test.ts` | Não testado | Não testado | E05, fluxos 5 e 6 |
| 46 | Abrir pelo Arquivos, Downloads e apps de mensagem | Aprovado | `incoming.test.ts`, `open-data.test.ts`, filtros no `app.config.ts` | Não testado | Não testado | E05 |

### Etapa 06 · Refinamento visual e acessibilidade

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 47 | Poucos toques para começar; personalização progressiva | Aprovado | `inicio.spec.ts`, `rapido.spec.ts` | Não testado | Não testado | |
| 48 | Fases diferentes por texto, som e cor | Aprovado | `session-modes.test.tsx`, capturas 06 a 12 | Não testado | Não testado | |
| 49 | Estados de salvamento, erro, vazio, importação concluída | Aprovado | `transfer-screens.test.tsx`, `home-screen.test.tsx`, `settings-screen.test.tsx` | Não testado | Não testado | |
| 50 | Contraste, números tabulares, alvos de 44 px | Aprovado | axe (WCAG 2.2 AA) em todos os E2E, `layout.spec.ts` | Não testado | Não testado | E06 |
| 51 | Texto ampliado sem cortes | Aprovado | `text.test.ts` (teto por estilo), `capturas/matriz.spec.ts` | Não testado | Não testado | E06, fluxo 10 |
| 52 | TalkBack e VoiceOver; sem anunciar cada segundo | Aprovado | testes de tela pelo nome acessível, `session-screen.test.tsx` | Não testado | Não testado | E06, fluxo 10 |
| 53 | Alternativa a arrastar | Aprovado | `routine-options.test.tsx` (mover para cima e para baixo) | Não testado | Não testado | |
| 54 | Claro, escuro e do sistema; retrato e paisagem; tablet e tela pequena | Aprovado | `theme-context.test.tsx`, `session-layout.test.tsx`, `capturas/matriz.spec.ts` (320 x 568) | Não testado | Não testado | E06 |
| 55 | pt-BR, inglês, espanhol e francês; nomes do usuário preservados | Aprovado | `messages.test.ts`, `idiomas.spec.ts` | Não testado | Não testado | |

### Etapa 07 · Vários temporizadores e cadência

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 56 | Temporizadores independentes, com nome, até 10, estado mantido | Aprovado | `timers.test.ts`, `timers-screen.test.tsx`, `temporizadores.spec.ts` | Não testado | Não testado | E07 |
| 57 | Fins juntos agrupados; política de colisão; treino ativo junto | Aprovado | `timers-together.test.tsx`, `temporizadores.spec.ts` | Não testado | Não testado | E07 |
| 58 | Um laço só, sem serviços extras | Aprovado | `resistencia.spec.ts` (intervalos e timeouts contados) | Não testado | Não testado | P5 |
| 59 | Metrônomo com BPM, pulso visual e sonoro, prévia, offline | Aprovado | `metronome.test.ts`, `metronome-screen.test.tsx`, `metronomo.spec.ts` | Não testado | Não testado | E07 |
| 60 | Agendamento pelo relógio de áudio; variação medida; latência de fone | Aprovado | `engine.test.ts` do metrônomo, variação medida no Chromium (E07 B) | Não testado | Não testado | E07, P4 |
| 61 | Cadência na etapa; prioridade entre pulso, voz e aviso | Aprovado | `cadence.test.ts`, `session-cadence.test.tsx`, `cadencia.spec.ts` | Não testado | Não testado | E07 |
| 62 | Modelos de estudo e tarefas; sequência do profissional | Aprovado | `presets.test.ts`, `sequence.test.ts`, `sequence-screen.test.tsx`, `sequencia.spec.ts` | Não testado | Não testado | |
| 63 | Resistência: fins juntos, áudio trocado, tela bloqueada, consumo | Aprovado | `resistencia.spec.ts`, `timers-together.test.tsx` | Não testado | Não testado | E07 E1 a E11 |

### Etapa 08 · Validação e lançamento

| # | Requisito | Lógica | Evidência | Android | iOS | Roteiro |
| --- | --- | --- | --- | --- | --- | --- |
| 64 | Tipos, lint, testes, fixtures de versões antigas | Aprovado | CI: `tsc`, ESLint sem aviso, knip, Prettier, Jest, E2E | Não se aplica | Não se aplica | |
| 65 | Fluxos críticos 1 a 10 | Aprovado | Lote A, tabela de fluxos | Não testado | Não testado | Fluxos 1 a 10 |
| 66 | Abertura, resposta, transições, volume grande | Aprovado (web) | `desempenho.spec.ts` | Não testado | Não testado | P1 a P7 |
| 67 | Memória e bateria em sessão longa | Não testado | Só no aparelho | Não testado | Não testado | P5, P6 |
| 68 | Banner discreto com IDs de teste, longe do treino, sem intersticial | Aprovado | `ad-slot.test.tsx`, `expo-ads.native.test.tsx` | Não testado | Não testado | A1, A2 |
| 69 | Uso normal sem anúncio (falha, offline, sem preenchimento) | Aprovado | `ad-slot.test.tsx` | Não testado | Não testado | A3, A4 |
| 70 | Consentimento e declarações | Aprovado | `expo-ads.native.test.tsx`, `docs/lojas/privacidade.md` | Não testado | Não testado | A5, A6 |
| 71 | Textos das lojas nas 4 línguas dentro dos limites | Aprovado | `loja/textos.test.ts` | Não se aplica | Não se aplica | |
| 72 | Nome disponível nos consoles | Não testado | Sem conta (D125) | Não testado | Não testado | |

## Defeitos

### Achados e corrigidos na E08

| Lote | Defeito | Correção |
| --- | --- | --- |
| A | Arquivo `.cronobr` com BOM era recusado | BOM ignorado (D126) |
| A | Notificação negada sem nenhum aviso | Aviso com botão para as configurações (D127) |
| B | Início com 1.000 rotinas: 4,4 s e 34 MB | 20 por vez e "Mostrar mais" (D128) |
| C | Banner que falhou voltava sozinho | Pedido estável no provedor |
| D | Palavras-chave repetindo o nome do app | Trocadas; teste impede de novo |
| E | **Faltava `expo-asset`**, dependência obrigatória do `expo-audio`: o APK podia fechar ao abrir | Instalado; `expo-doctor` com 20 de 20 |
| E | `react-native`, `safe-area-context` e `jest-expo` abaixo do esperado pelo SDK 58 | Alinhados com `expo install --fix` |

### Impedem o lançamento

| # | Impedimento | Por quê |
| --- | --- | --- |
| I1 | Nenhum build nativo testado | O PRD exige prova em aparelho para segundo plano, áudio e notificação. É o risco maior: a tela bloqueada só foi provada na lógica |
| I2 | Nenhum binário compilado desde o áudio nativo (E07 B) e o SDK de anúncio (E08 C) | O `expo-doctor` passa, mas só o build diz se os módulos nativos compilam juntos |
| I3 | Contas: Play Console, App Store Connect, AdMob | IDs reais de anúncio, `app-ads.txt`, mensagem de consentimento no console, nome nas lojas |
| I4 | Política de privacidade sem URL pública e sem contato | As duas lojas exigem para app com anúncio |
| I5 | Capturas do aparelho, questionários de classificação e público | Exigidos no envio |

## Limitações conhecidas (não são defeito, ficam explicadas)

- **Voz em segundo plano:** com a tela bloqueada, a troca de fase toca o som da notificação; a
  voz só fala com o app à vista (o sistema não deixa sem áudio contínuo, e o PRD proíbe áudio
  silencioso como artifício).
- **Reinício do aparelho** apaga os avisos agendados. Ao abrir, o treino volta pelo relógio; acima
  de 12 h vira interrompido.
- **Fechar à força no Android** pode apagar os alarmes, conforme o fabricante.
- **Teto de 50 avisos agendados para o treino**, mais os dos temporizadores, dentro dos 64 que o
  iPhone guarda: treino com mais trocas que isso, todo com a tela bloqueada, fica sem aviso depois
  da 50ª até o app voltar à frente (aí reagenda).
- **Etapa por repetições** para os avisos ali: o fim depende de tocar "Concluí".
- **Metrônomo para com a tela bloqueada** (D104, D109).
- **Pausar e retomar só dentro do app:** a notificação não tem botões.
- **Sons próprios do usuário** não existem nesta versão; o backup leva só os sons internos.
- **Sem login e sem nuvem** (fora desta fase); o backup é o caminho de troca de aparelho.
- **Prévia web** serve para ver as telas: sem notificação, sem vibração, sem anúncio.
- **Anúncio sem rastreamento no iPhone** rende menos (D132).

## Validações que dependem de aparelho ou conta

| Precisa de | O quê |
| --- | --- |
| Android | Roteiro E03 #1 a #10, E05 (5 cenários), E06 (letra máxima, TalkBack), E07 E1 a E11, E08 P1 a P7, A1 a A6, fluxos 1 a 10 |
| iPhone (exige conta Apple para instalar) | Os mesmos, com VoiceOver no lugar do TalkBack, e A6 (sem pedido de rastreamento) |
| Os dois juntos | Fluxos 5 e 6 (backup de um sistema aberto no outro), roteiro E05 |
| Conta Play | Nome, Segurança dos dados, ID de publicidade, classificação, público-alvo, teste fechado |
| Conta Apple | Nome, Privacidade do app, faixa etária, TestFlight |
| Conta AdMob | IDs reais, `app-ads.txt`, mensagem de consentimento, revisão das declarações |

## Próximos passos

1. **APK de prévia** pelo EAS (perfil `preview`, projeto do CronôBR na conta rahgomes, nunca o do
   ManiVez), com os IDs de teste. Fecha o I2 e destrava o resto.
2. **Rodada única no Android do Ramon** com todos os roteiros, nesta ordem: E03 (tela bloqueada e
   áudio), E07 (cadência e temporizadores), E05 e fluxos 5 a 8, P1 a P7, A1 a A6, E06. Cada linha
   desta matriz ganha o resultado, aparelho e sistema.
3. **Corrigir o que reprovar**, com teste que reproduz antes da correção.
4. **Decidir o iPhone:** conta Apple Developer (anual) para instalar pelo TestFlight; sem ela, a
   coluna iOS segue não testada.
5. **Contas e política:** AdMob, Play Console e, se for o caso, Apple; publicar a política
   (`docs/lojas/privacidade.md`) numa URL pública com contato.
6. **Teste fechado na Play** antes da produção (conta pessoal nova pede um período mínimo com
   testadores; conferir o número atual no console).
7. **Trocar os IDs de teste pelos reais** só no build de produção, junto com `app-ads.txt`.
