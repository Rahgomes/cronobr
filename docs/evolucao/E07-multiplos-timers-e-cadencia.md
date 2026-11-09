# E07 · Vários temporizadores e cadência

Recursos adicionais do super PRD 07, sobre a base das etapas anteriores: o motor de tempo
derivado de marcos (D04/D12), a porta de avisos (E03) e o editor de rotinas (E04). Os critérios
críticos das etapas anteriores estão confirmados: a E06 fechou com 551 testes Jest, 68 E2E e um
backup gravado pela E05 lido e restaurado igual (`compat-e05.test.ts`).

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Vários temporizadores: criar com nome, iniciar, pausar, repetir e encerrar cada um; visão compacta dos ativos; estado preservado ao navegar e reabrir; limite de 10; um relógio só para todos; conclusão de cada um com nome; avisos agrupados por dono (o treino não apaga os dos temporizadores) e política de colisão; convivência com um treino ativo | Feito |
| B | Metrônomo: BPM de 30 a 240, pulso visual e sonoro, prévia, offline; agendamento pelo relógio de áudio (não por `setInterval`); variação entre batidas medida; ajuste de atraso para fone Bluetooth | Feito |
| C | Cadência na etapa do treino: BPM opcional por etapa no editor; prioridade entre pulso, voz e aviso de troca de etapa; formato `.cronobr` aceita o campo novo sem quebrar o app antigo | Feito |
| D | Modelos adicionais: estudo e foco, tarefas pessoais, "sequência do profissional" (nomes e tempos recebidos), todos editáveis e nas 4 línguas | A fazer |
| E | Testes de resistência: temporizadores terminando juntos, treino com cadência, troca de saída de áudio, tela bloqueada, consumo; roteiro de aparelho para o APK | A fazer |

## Decisões de partida

| # | Decisão | Por quê |
| --- | --- | --- |
| D94 | **Temporizadores no mesmo modelo do cronômetro** (`src/domain/timers.ts`, puro, marco `since` com relógio monotônico e civil) | "Usar a base temporal existente": o tempo é derivado do marco, então callback atrasado ou app suspenso não perdem tempo. Reabrir recalcula pelo relógio civil, como o cronômetro |
| D95 | **Um relógio só** (`TimersProvider` na raiz, um intervalo de tela enquanto houver temporizador rodando, nenhum quando não houver) | "Evitar múltiplos serviços ou loops": 10 temporizadores custam o mesmo que 1. Fora da tela quem avisa é a notificação agendada |
| D96 | **Avisos agendados por dono** (`schedule('sessao' \| 'temporizadores', alertas)`) | Hoje o treino troca TODOS os agendados: começar um treino apagaria o aviso de um temporizador. Teto do iPhone (64 pendentes): treino até 50, temporizadores até 10 |
| D97 | **Metrônomo pelo relógio de áudio**: `react-native-audio-api` no aparelho (API igual à Web Audio) e a Web Audio do navegador na web; um laço curto só reabastece a fila de batidas já marcadas no relógio de áudio | O PRD proíbe precisão musical por `setInterval`. Agendar cada batida com `start(quando)` no relógio de áudio dá precisão de amostra; o laço só precisa acordar antes da fila acabar. Dependência nativa nova, justificada: `expo-audio` toca arquivo, não agenda no tempo do áudio. Exige o APK novo (já previsto) |

## Lote A · Vários temporizadores

| Item | Onde |
| --- | --- |
| Domínio puro: criar, começar, pausar, repetir, zerar, leitura com fim exato, reabrir pelo relógio civil, leitura tolerante do gravado, limite de 10 | `src/domain/timers.ts` (12 testes) |
| Um relógio só, na raiz: lista gravada nas preferências, leitura de 250 ms só enquanto algum roda, avisos agendados do dono `temporizadores` | `src/features/timers/timers-context.tsx` |
| Tela `/temporizadores`: lista com nome, tempo, estado e ações; formulário com nome, horas, minutos e segundos; criar travado com motivo no limite | `src/features/timers/timers-screen.tsx` |
| Visão compacta na Início: ativos e quanto falta, toque leva à tela | `src/features/home/timers-summary.tsx` |
| Conclusão com o nome ("Ovo terminou", "Ovo e Chá terminaram"): som, voz e vibração com o app à vista, diálogo do app com Repetir e OK, notificação agendada fora da tela | provedor + `dialog` |
| Porta de avisos por dono: cada dono cancela só os seus (identificador `dono:n`); agendado sem dono, de versão anterior, conta como da sessão; teto de 50 e 10 | `src/features/cues/port.ts`, `expo-port.ts` |
| Convivência com treino: o temporizador segue contando; com treino rodando ele toca e vibra mas não fala (a voz é do treino) | `src/features/cues/session-active.ts` |
| Textos nas 4 línguas | `timers` em `src/i18n/messages/*` |

Testes: domínio (12), porta por dono (1 novo, 9 ajustados), tela (8, incluindo reabrir com um
que acabou longe e não toca de novo), E2E `temporizadores.spec.ts` (3 casos x 2 temas, com axe)
e `/temporizadores` na varredura de alvos de toque. Capturas `17` a `20`.

### Decisões do lote A

| # | Decisão | Por quê |
| --- | --- | --- |
| D98 | **Colisão: fins a menos de 1 s um do outro viram um aviso só**, contado a partir do primeiro do grupo | Dois avisos colados viram ruído e, no iPhone, gastam vaga do teto de 64. Contar do primeiro evita que uma cadeia de fins a cada 0,6 s vire um grupo sem fim |
| D99 | **Conclusão no diálogo do app**, não numa faixa fixa no topo | A faixa ficava por cima do "Voltar" e o axe reprovou (alvo de toque sobreposto). O diálogo é o mesmo das confirmações, já passa no axe e dá lugar para "Repetir" |
| D100 | **Fim percebido mais de 5 s depois não toca nem abre diálogo** | Ao reabrir o app horas depois, a notificação já avisou; tocar de novo seria um alarme falso. O temporizador aparece como "Terminou" na lista |
| D101 | **Com treino rodando, o temporizador não fala** | A voz do app é uma só: a frase nova cortaria a contagem do treino. Som, vibração e o aviso escrito bastam. A prioridade completa entre pulso, voz e troca de etapa é do lote C |

## Lote B · Metrônomo

| Item | Onde |
| --- | --- |
| Parte pura: BPM de 30 a 240, fila de batidas no relógio de áudio, laço atrasado pula no mesmo passo (sem batida vencida nem rajada), troca de BPM andando, prévia com limite, medição da variação | `src/domain/metronome.ts` (7 testes, 100% de ramos) |
| Motor: reabastece a fila, desmarca o que não tocou ao parar ou trocar o BPM, pulso na tela atrasado pelo fone | `src/features/metronome/engine.ts` (6 testes, com laço travado 1 s e 3 s) |
| Relógio de áudio: `react-native-audio-api` no aparelho (carga tardia), Web Audio do navegador na web; clique sintetizado, sem arquivo | `audio-clock.ts`, `audio-clock.web.ts`, `click.ts` |
| Tela `/metronomo`: BPM grande, − e +, ritmos comuns (60 a 180), prévia de 4 batidas, Começar/Parar, atraso do fone de 0 a 400 ms; tudo gravado | `metronome-screen.tsx` (5 testes) |
| Entrada na Início, abaixo dos temporizadores | `src/features/home/metronome-link.tsx` |
| Textos nas 4 línguas | `metronome` em `src/i18n/messages/*` |
| Plugin nativo sem serviço em primeiro plano, sem permissão extra e sem áudio em segundo plano | `app.config.ts` |

### Variação medida

| Onde | Resultado |
| --- | --- |
| Jest, 10 s a 240 BPM com o relógio falso | Intervalos marcados: desvio 0 ms; nenhuma batida marcada atrasada; nenhuma pulada |
| Jest, laço de JS travado 1 s | A fila de 1,5 s cobre: nenhuma batida pulada |
| Jest, laço travado 3 s | Pula as vencidas no mesmo passo; nenhuma marcada atrasada, nenhuma rajada |
| Chromium real (E2E), 4 s a 180 BPM, `start(quando)` da Web Audio registrado de fora do app | 22 a 23 batidas; maior desvio entre intervalos 2,8 x 10⁻¹³ ms (arredondamento de ponto flutuante); menor folga entre marcar e tocar 60 ms |

O que isso prova: a hora de cada batida é do relógio de áudio e a fila nunca secou. O que fica
para o aparelho (roteiro do APK, lote E): a saída real no alto-falante e no fone Bluetooth, e a
convivência com a voz e os sons do `expo-audio`.

Testes: domínio (7), motor (6), tela (5), E2E `metronomo.spec.ts` (2 casos x 2 temas, com axe)
e `/metronomo` na varredura de alvos de toque. Captura `21`.

### Decisões do lote B

| # | Decisão | Por quê |
| --- | --- | --- |
| D102 | **Fila longa e laço lento**: 1,5 s de batidas marcadas, laço a cada 250 ms; parar ou trocar o BPM desmarca o que não tocou | O navegador em segundo plano segura o setTimeout em até 1 s e o celular às vezes trava o JS por centenas de ms; com 1,5 s na fila nada se perde. Desmarcar é o que deixa a fila longa sem atrasar a resposta ao toque |
| D103 | **Pulso em 4 pontos pequenos**, não a tela piscando; escondido do leitor de tela, que ouve o som e só ouve "tocando" e "parado" | A 240 BPM a tela piscaria 4 vezes por segundo, acima do limite de 3 da WCAG 2.3.1. Anunciar cada batida taparia o leitor |
| D104 | **Toca só com a tela aberta**: ao sair da tela ou mandar o app para o fundo, para; enquanto toca, a tela fica acesa | Tocar em segundo plano exigiria serviço em primeiro plano no Android (declaração na loja) e modo de áudio no iPhone. O plugin ligava tudo isso por padrão; desligamos. Se o lote C pedir cadência com a tela apagada, decide-se lá |
| D105 | **Atraso do fone só no pulso da tela** (manual, 0 a 400 ms em passos de 20, mais a latência que o aparelho informar) | O som não dá para adiantar; o que se acerta é a tela esperar o som chegar. Medir o atraso do Bluetooth sozinho exige microfone, e o app não pede microfone |
| D106 | **Lib nativa carregada na hora de usar**; sem ela, o metrônomo explica que está indisponível e o resto do app segue | Importar no topo num binário sem o módulo derrubaria o app inteiro. A versão 2.0.0 ainda não tem binário: o APK único já sai com a lib (`runtimeVersion` = versão do app, então correção pelo ar não chega a binário antigo) |

## Lote C · Cadência na etapa do treino

| Item | Onde |
| --- | --- |
| `bpm` opcional na etapa (30 a 240), levado a cada segmento da linha do tempo (inclusive nos dois lados) | `src/domain/routine.ts`, `timeline.ts` |
| Limite no editor e na importação ("Cadência entre 30 e 240 BPM") | `src/domain/limits.ts` |
| Prioridade no ouvido e janelas de silêncio do pulso | `src/domain/cadence.ts` (5 testes) |
| Motor: batida calada continua contando e pulsando na tela, só sem som | `src/features/metronome/engine.ts` (`muted`) |
| Pulso na sessão: recomeça a cada troca de etapa, para na pausa e com o app no fundo; selo "Cadência 120 BPM" com os 4 pontos no topo, nas três visualizações | `src/features/session/use-cadence.ts`, `session-view.tsx` (5 testes) |
| Editor: "Metrônomo nesta etapa", BPM de 5 em 5 e "Ouvir 4 batidas" (prévia antes de iniciar); a linha da etapa mostra o BPM | `step-sheet.tsx`, `editor-screen.tsx` (3 testes) |
| "Pulso da cadência" nos Avisos, ligado por padrão | `src/domain/cues.ts`, `cue-settings-screen.tsx` |
| Arquivo e banco com o campo novo; impressão de duplicata considera o BPM | `transfer.ts`, `codecs.ts`, `docs/spec/formato-cronobr.md` |

### Prioridade entre pulso, voz e aviso de troca

| Ordem | Aviso | Janela em que o som do pulso cala |
| --- | --- | --- |
| 1 | Conclusão do treino | O pulso já parou (fim da última etapa) |
| 2 | Troca de etapa (som da fase e frase) | 2,5 s do começo da etapa, se som ou voz estiverem ligados |
| 3 | Contagem 3, 2, 1 | 3 s finais, se som e contagem estiverem ligados |
| 4 | "Metade do tempo" | 1,5 s a partir da metade, em exercício de 30 s ou mais com voz |
| 5 | Pulso | Resto da etapa; nunca passa do fim dela |

Testes: a sessão a 120 BPM ouve batidas só entre 2,5 s e 17 s numa etapa de 20 s, para na
caminhada sem cadência, volta na corrida seguinte de novo depois da frase; com voz, som e
contagem desligados toca a etapa inteira. No Chromium real (E2E `cadencia.spec.ts`), a primeira
batida do treino sai entre 2,5 s e 3,7 s do começo da etapa, os intervalos ficam exatos a 90 BPM
e a pausa não marca mais nenhuma.

### Compatibilidade com o app anterior

O `.cronobr` continua na `schemaVersion` 1. O arquivo `src/test/fixtures/rotina-cadencia-e07.cronobr`,
gravado pelo código de agora, foi aberto pelo código do commit `49ad67a` (antes deste lote) numa
`git worktree`: abriu sem erro, com a mesma duração (5:40), só sem o `bpm`. A mesma rotina gravada
no banco pela versão nova também abre na anterior. O teste permanente
`src/features/transfer/compat-e07.test.ts` confere que a versão de agora mantém o BPM de cada etapa.

Testes: domínio (cadência 5, linha do tempo 1, limites 1, arquivo 1 e o fixture com BPM na ida e
volta), motor (1), sessão (5), editor (3), Avisos (2), compatibilidade (1), E2E `cadencia.spec.ts`
(1 caso x 2 temas, com axe). Capturas `22` e `23`.

### Decisões do lote C

| # | Decisão | Por quê |
| --- | --- | --- |
| D107 | **BPM por etapa**, opcional, em qualquer etapa (não por bloco nem por rotina) | Corrida e caminhada alternadas pedem ritmos diferentes no mesmo bloco. No editor vai de 5 em 5 (de 30 a 240 são 42 toques no pior caso); o arquivo aceita qualquer inteiro da faixa |
| D108 | **O pulso cala o som, não abaixa o volume**, nas janelas dos avisos mais importantes; a tela continua pulsando | A voz do aparelho não deixa o app abaixar outro som só durante a frase. Calar é previsível, dá para testar e não embola duas coisas no ouvido. O ritmo não se perde porque a contagem das batidas segue |
| D109 | **O pulso recomeça em cada troca de etapa** e para na pausa e com o app no fundo | Alinhado ao começo da etapa, a janela da frase cai no lugar certo. Com o app no fundo continuam as notificações das trocas (D104 mantida: sem serviço em primeiro plano) |
| D110 | **Campo novo não sobe a `schemaVersion`** | A versão anterior descarta campo desconhecido e abre a rotina; subir a versão faria a anterior recusar o arquivo inteiro ("atualize o app") por causa de um extra |
| D111 | **"Pulso da cadência" nos Avisos**, ligado por padrão; o atraso do fone do metrônomo vale também para o pulso do treino | Quem não quer o clique desliga num lugar só, sem editar cada rotina. O fone é o mesmo nas duas telas |
| D112 | **Selo da cadência no topo da sessão**, embaixo do nome da rotina | Na primeira versão ficou abaixo do cartão "Próxima", fora da tela num celular de 390 x 844 (a captura mostrou). No topo aparece nas três visualizações sem empurrar o tempo |
