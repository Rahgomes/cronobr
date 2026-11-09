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
| D | Modelos adicionais: estudo e foco, tarefas pessoais, "sequência do profissional" (nomes e tempos recebidos), todos editáveis e nas 4 línguas | Feito |
| E | Testes de resistência: temporizadores terminando juntos, treino com cadência, troca de saída de áudio, tela bloqueada, consumo; roteiro de aparelho para o APK | Feito |

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

## Lote D · Modelos adicionais

| Item | Onde |
| --- | --- |
| Três modalidades novas com foto: Estudo e foco, Tarefas, Do profissional | `src/domain/routine.ts`, `features/modality/catalog.ts`, `assets/images/modalidades/` |
| 7 modelos prontos: Pomodoro 25/5, Estudo 50/10, Revisão rápida, Arrumação em 15 minutos, Tarefas em blocos de 10, Rotina da manhã e um exemplo de fortalecimento do profissional | `src/domain/presets.ts`, nomes nas 4 línguas em `src/i18n/presets.ts` |
| Sessão de estudo e de tarefas fala "Foco", "Tarefa", "Pausa", "Sessão concluída" e "Encerrar sessão" (tela, voz e notificação); a do profissional segue com as palavras de treino | `withMode` e `ModeProvider` em `src/i18n/i18n-context.tsx`, `session-screen.tsx` (4 testes) |
| Cadastrar sequência recebida: cola a lista como veio (um exercício por linha), vê como o app entendeu cada linha, escolhe voltas e descanso entre exercícios, cria e revisa no editor de sempre | `src/domain/sequence.ts` (35 testes, 100%), `src/features/sequence/sequence-screen.tsx` (6 testes), rota `/sequencia`, atalho na modalidade Do profissional |
| Modalidade desconhecida no arquivo ou no banco abre como personalizada | `transfer.ts`, `codecs.ts`, `docs/spec/formato-cronobr.md` |

O leitor da sequência aceita, nas 4 línguas: `30s`, `45 seg`, `20"`, `2 min`, `1min30s`, `1:30`,
`12 reps`, `x12`, `3x12`, `3x30s`, `4x1min`, marcadores de lista (`-`, `•`, `1.`, `2)`), "cada
lado" (por lado, each side, chaque côté) em qualquer ponto da linha e linhas de descanso (descanso,
pausa, rest, repos...). Linha que não entende volta com o número dela e o texto, e o botão de criar
espera a correção. Linha com mais de 200 letras não passa pelas regex.

E2E `e2e/sequencia.spec.ts` (2 casos x 2 temas, com axe): sequência colada, aviso da linha sem
tempo, criação e revisão no editor; sessão de estudo com "Foco" na tela. `/sequencia` e
`/modalidade/profissional` entraram no teste de layout. Capturas `24` a `29`.

### Decisões do lote D

| # | Decisão | Por quê |
| --- | --- | --- |
| D113 | **Estudo e tarefas como modalidades**, com modelos prontos editáveis como os de treino | Reaproveita tudo (editor, histórico, avisos, backup) sem tela nova. O PRD pede "modelos adicionais", não outro tipo de cronômetro |
| D114 | **Palavras da sessão pela modalidade** (sobreposição só do que a sessão fala), não um texto novo por tela | Estudar 25 minutos e ouvir "Treino concluído" soa errado. Trocar só fase, conclusão e encerrar mantém o resto idêntico e testado. A visualização "Foco" da sessão continua com o mesmo nome: é o nome do modo de ver, e a fase aparece na faixa colorida |
| D115 | **Sequência por texto colado**, não formulário de etapa por etapa | O profissional manda a lista por mensagem; copiar e colar é o caminho mais curto. O editor já existe para o ajuste fino, então a tela só lê, mostra a prévia e cria |
| D116 | **Leitor tolerante e explícito**: aceita o jeito comum de escrever, e o que não entende é apontado pela linha, nunca adivinhado | Errar o tempo de um exercício de fisioterapia em silêncio é pior que pedir para corrigir uma linha. Séries viram etapas numeradas ("série 1 de 3") para a pessoa saber onde está |
| D117 | **Descanso entre exercícios automático** (padrão 15 s, ajustável de 0 a 2 min), pulado quando a linha seguinte já é um descanso | A maioria das listas recebidas não escreve o descanso; quando escreve, vale o que o profissional mandou |
| D118 | **Modalidade desconhecida abre como personalizada** (banco e arquivo) | Modalidade nova é o tipo de mudança que mais vai acontecer; recusar o arquivo inteiro por ela seria o mesmo problema que D110 evitou para campos. Nenhum binário com a lista antiga foi distribuído |

## Lote E · Testes de resistência

O que o PRD pede testar: temporizadores concluindo juntos, sessão ativa com cadência, mudança de
áudio, tela bloqueada e consumo de recursos. Tudo que dá para provar sem aparelho foi provado em
Jest (relógio falso) e no Chromium real (E2E). Dois testes acharam defeito, corrigido no lote.

| Cenário | Como | Resultado |
| --- | --- | --- |
| 10 temporizadores no mesmo instante | Jest, `timers-together.test.tsx` | 1 aviso, 1 som, todos os nomes ("Ovo, Chá, ... e Café terminaram"), os 10 marcados como terminados |
| Fins a menos de 1 s (400 ms) | idem | **Defeito achado:** a tela avisava cada um (o 2º diálogo trocava o 1º, a 2ª fala cortava a 1ª), enquanto a notificação juntava. Corrigido (D119): a tela avisa como a notificação |
| 10 em cadeia, a cada 600 ms | idem | Os 5 grupos da tela são os mesmos 5 da notificação agendada |
| 10 juntos com treino rodando | idem | 1 som, sem voz por cima do treino |
| Do grupo, mas pausado antes do fim | idem e `timers.test.ts` | Quando termina de fato, avisa sozinho |
| Áudio parado no meio da cadência (ligação, saída trocada, fone desligado) | Jest no motor e na sessão; E2E suspende o `AudioContext` de verdade | **Defeito achado:** o motor não pedia para retomar (no iPhone, o áudio interrompido não volta sozinho) e a fila velha tocava atrasada, um clique podia cair na contagem final. Corrigido (D120). O E2E falha sem a correção (fica `suspended`) e passa com ela (volta a `running` em menos de 1 s) |
| Motor 1 hora a 240 BPM | Jest, `engine.test.ts` | Timers vivos do JS nunca passam de 8; medição presa em 512; nenhuma batida perdida; 14.400 cliques |
| Tela bloqueada 20 vezes num treino com cadência | Jest, `session-cadence.test.tsx` | 1 áudio criado e nunca fechado no meio; timers vivos estáveis; o pulso volta na corrida seguinte |
| Consumo: 10 temporizadores + treino com cadência + 6 bloqueios, 60 s em tempo real | E2E `resistencia.spec.ts` (Chromium, CDP depois da coleta de lixo) | Ver a tabela abaixo |

### Consumo medido (Chromium, Pixel 7 emulado)

| Medida | Antes | Depois de 60 s e 6 bloqueios |
| --- | --- | --- |
| Memória do JS (heap usado) | 15,1 MB | 15,5 MB (oscila entre 15,3 e 15,6) |
| Nós do DOM | 1.247 | 1.247 |
| Listeners | 801 | 797 |
| AudioContext criados | 1 | 1 |
| Intervalos vivos | 2 (temporizadores e sessão) | 2 |
| Timeouts vivos | 3 | 0 a 4 |
| Cliques sintetizados | 0 | 42 (nenhum com a tela bloqueada) |

O teste guarda esses números como limite (heap +3 MB, nós +200, listeners +50, timeouts < 40,
um áudio só, nenhum intervalo novo) e roda num tema só: o tema não muda o consumo.

### Roteiro de aparelho para o APK

O que só o aparelho responde: a saída real (alto-falante, fone com e sem fio), a ligação de
verdade, o sistema bloqueando a tela e a bateria. Junta-se ao roteiro da E03 (seção 5) na mesma
rodada do APK único. Registrar aparelho, sistema e versão do app.

| # | Cenário | Como | Aprovado se |
| --- | --- | --- | --- |
| E1 | 10 temporizadores juntos, tela bloqueada | Criar 10 de 1 min em sequência rápida, bloquear | Notificações agrupadas como na tela; nenhuma repetida ao desbloquear |
| E2 | Temporizador acaba durante o treino | Treino com voz e um temporizador de 1 min | Som do temporizador sem voz; a voz do treino não é cortada |
| E3 | Cadência no alto-falante | Corrida com 170 BPM, 5 min | Batidas regulares de ouvido; nenhuma em cima da frase ou da contagem |
| E4 | Cadência no fone Bluetooth | Ajustar o atraso do fone no metrônomo até o pulso bater com o som | Pulso e som juntos depois do ajuste; anotar o valor (ms) por fone |
| E5 | Desligar o fone no meio | Desconectar o Bluetooth com a cadência tocando | Anotar: segue no alto-falante ou cala. Não pode travar o treino nem disparar rajada de cliques |
| E6 | Ligação no meio | Receber e encerrar uma ligação durante a corrida | Depois da ligação o pulso volta sozinho em até 1 s, no ritmo, e sem clique na contagem final |
| E7 | Tela bloqueada com cadência | Bloquear no meio da corrida | Pulso para; as trocas seguem pela notificação; ao desbloquear o pulso volta |
| E8 | Metrônomo 30 min | 180 BPM, tela acesa, brilho fixo | Anotar % de bateria gasto e temperatura; o app não pode ser fechado pelo sistema |
| E9 | Treino longo com cadência e 3 temporizadores | 30 min, tela acesa | Anotar bateria e memória (`adb shell dumpsys meminfo` no Android); memória sem subir sem parar |
| E10 | Economia de bateria ligada | Repetir E3 e E7 | Mesmo resultado, ou registrar a diferença |
| E11 | Sequência colada do WhatsApp | Colar uma lista real recebida | Cada linha lida ou apontada pelo número; nada inventado |

### Decisões do lote E

| # | Decisão | Por quê |
| --- | --- | --- |
| D119 | **Na tela, temporizadores que terminam a menos de 1 s um do outro viram um aviso só**, o mesmo grupo da notificação: no primeiro fim já entram os que ainda rodam e terminam dentro da janela; quando esses terminam, não avisam de novo. Se um deles foi pausado no meio e terminou depois, avisa sozinho | O diálogo é um só por vez e a voz também: dois avisos colados apagam o primeiro. Mesma regra na notificação e na tela é mais fácil de entender e de testar (D98) |
| D120 | **Áudio parado é detectado pelo próprio motor**: a cada passo do laço compara o relógio de áudio com o do aparelho (`performance.now`); mais de 100 ms para trás é áudio parado. Aí desmarca o que estava na fila, soma o tempo perdido no "desde o começo" (é por ele que a sessão cala a frase e a contagem) e pede para retomar no máximo uma vez por segundo | Funciona igual na web e no aparelho, sem depender de evento de interrupção de cada sistema. No iPhone, áudio interrompido por ligação não volta sem `resume()`. Desmarcar evita a rajada de cliques atrasados |
| D121 | **Consumo vira teste com limite**, não só medição: o E2E falha se a memória, os nós, os listeners ou os timers crescerem, ou se nascer um segundo áudio | Medir uma vez não pega regressão. Os limites têm folga larga (o medido fica bem abaixo) para não falhar por ruído da máquina |
| D122 | **Saída real, ligação, Bluetooth e bateria ficam no roteiro do APK** | O navegador não tem fone, ligação nem bateria de celular. O que foi provado aqui é o comportamento do app quando o sistema faz essas coisas (áudio suspenso, tela oculta); o efeito no aparelho se confere no APK único |
