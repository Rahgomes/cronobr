# E07 · Vários temporizadores e cadência

Recursos adicionais do super PRD 07, sobre a base das etapas anteriores: o motor de tempo
derivado de marcos (D04/D12), a porta de avisos (E03) e o editor de rotinas (E04). Os critérios
críticos das etapas anteriores estão confirmados: a E06 fechou com 551 testes Jest, 68 E2E e um
backup gravado pela E05 lido e restaurado igual (`compat-e05.test.ts`).

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Vários temporizadores: criar com nome, iniciar, pausar, repetir e encerrar cada um; visão compacta dos ativos; estado preservado ao navegar e reabrir; limite de 10; um relógio só para todos; conclusão de cada um com nome; avisos agrupados por dono (o treino não apaga os dos temporizadores) e política de colisão; convivência com um treino ativo | Feito |
| B | Metrônomo: BPM de 30 a 240, pulso visual e sonoro, prévia, offline; agendamento pelo relógio de áudio (não por `setInterval`); variação entre batidas medida; ajuste de atraso para fone Bluetooth | A fazer |
| C | Cadência na etapa do treino: BPM opcional por etapa no editor; prioridade entre pulso, voz e aviso de troca de etapa; formato `.cronobr` aceita o campo novo sem quebrar o app antigo | A fazer |
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
