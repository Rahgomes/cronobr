# E03 · Segundo plano e avisos

Som, voz, vibração, tela acesa e avisos com o app fora da tela (super PRD 03). Parte de código
entregue em 08/11/2026. **A prova em aparelho ainda não foi feita**: o critério de aceite da
etapa exige build nativo e registro por cenário (seção 5).

## 1. O que entrou

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| Domínio | `src/domain/cues.ts` | Evento do motor vira som, frase e vibração. Um de cada canal por leitura (o mais importante). Preferências lidas campo a campo |
| Domínio | `src/domain/alerts.ts` | Plano de notificações: cada troca futura no relógio civil, até 60, parando em etapa manual |
| Avisos | `src/features/cues/port.ts` | Porta que a sessão usa; os testes trocam por um falso |
| Avisos | `src/features/cues/expo-port.ts` | Adaptador real: `expo-audio`, `expo-speech`, `expo-haptics`, `expo-notifications`, `expo-keep-awake` |
| Avisos | `src/features/cues/cue-context.tsx`, `cue-settings-screen.tsx` | Preferências no banco (`prefs.avisos`) e a tela "Som e avisos" com prévia |
| Sons | `assets/sounds/*.wav`, `scripts/gerar-sons.py` | Beep curto e longo, sino de ringue, gongo, apito, conclusão. Síntese própria: originais, sem licença de terceiros |
| Config | `app.config.ts` | Plugins de áudio (sem microfone) e notificação (os mesmos .wav), `USE_EXACT_ALARM`, entitlement time-sensitive |

## 2. Decisões

| # | Decisão | Por quê |
| --- | --- | --- |
| D17 | **Fora da tela, quem avisa é a notificação local agendada**, uma por troca de fase, refeita a cada marco (começar, pausar, retomar, pular, voltar, sair e voltar ao app) e cancelada ao pausar ou encerrar | É o mecanismo legítimo nas duas plataformas. Áudio silencioso para manter o processo vivo é proibido pelo PRD e pela Apple. Foreground service no Android exigiria módulo nativo próprio; fica como plano B se a medição no aparelho reprovar |
| D18 | **Uma regra só para "fora da tela"**: `AppState === 'background'` (`features/cues/away.ts`). Com o app à vista, os avisos do app tocam e a notificação chega muda; fora, o contrário | Sem isso o aviso dobra (notificação + app) ou some. `inactive` (central aberta, chamada chegando) conta como à vista |
| D19 | **Fase atrasada não avisa** (`late` do motor): ao voltar ao app, a notificação já tocou | Evita repetir "Vai, 20 segundos" de uma fase que começou há um minuto |
| D20 | **Um som, uma frase e uma vibração por leitura**, pelo evento mais importante (fim > fase > metade > contagem). A frase nova interrompe a anterior | "Evite falas sobrepostas e filas de contagem atrasadas" (PRD) |
| D21 | **Contagem 3-2-1 só por beep e vibração**, sem voz | Voz de um segundo atrasa e encavala; o beep curto não |
| D22 | **Abaixar a música (`duckOthers`) e respeitar o modo silencioso** | A música do usuário continua, mais baixa, durante o aviso |
| D23 | **Android: `USE_EXACT_ALARM` e entrega `alarmClock`** quando o sistema permite | Timer é a função principal do app, caso previsto pela política da Play. Sem alarme exato, o Android adia o aviso em minutos com a tela apagada. A declaração na Play Console fica para a E08 |
| D25 | **Voz depois do ataque do som** (até 650 ms) e o som segue a 25% enquanto ela fala. Beeps em seno suave, mais baixos que os demais sons | Retorno do Ramon no APK: som e voz ao mesmo tempo viravam ruído, e o beep do 3-2-1 era áspero. Mais opções de som e a validação final ficam para depois da E04 |
| D24 | **Voz do aparelho (`expo-speech`, pt-BR) agora; vozes ElevenLabs depois** | O nome do exercício é dinâmico e só uma voz sintetizada no aparelho fala qualquer nome, offline. As vozes gravadas (masculinas e femininas, P8) entram para as frases fixas quando houver a chave da API |

## 3. Comportamento por situação (o que o código faz; a medição é da seção 5)

| Situação | Som e voz | Vibração | Tela | Observação |
| --- | --- | --- | --- | --- |
| App visível | Do app, a cada troca e 3-2-1 | Sim | Acesa durante o treino | Notificação chega muda |
| Segundo plano / tela bloqueada | Notificação com o som da fase | Padrão do canal | — | Voz não fala (o sistema não deixa sem áudio em segundo plano) |
| Processo encerrado pelo sistema | Notificações já agendadas tocam | Sim | — | Ao abrir, a sessão é recalculada pelo relógio civil (E02) |
| Encerramento forçado pelo usuário | iOS: pendentes continuam. Android: o sistema pode apagar os alarmes | — | — | Medir no aparelho |
| Reinício do aparelho | Avisos somem (o agendamento não sobrevive) | — | — | Ao reabrir, a sessão volta pelo relógio; acima de 12 h vira interrompida |
| Notificação negada | Só com o app visível | Sim | Acesa | A tela de avisos explica o limite |
| Etapa manual (repetições) | Avisos param ali: o fim depende da pessoa | — | — | Retoma ao tocar "Concluí" |

## 4. O que os testes provam

- **Domínio (100%)**: frase por fase, "Última rodada", "Próximo: X", prioridade entre eventos,
  canais independentes, plano de notificações (horário, teto de 50 desde a E07, etapa manual, pausa, fim).
- **Tela com banco real**: começar agenda 16 avisos no Tabata e acende a tela; pausar cancela e
  apaga; retomar reagenda; troca de fase toca uma vez; preferência gravada vale; fora da tela o
  app não toca; encerrar cancela.
- **Adaptador com módulos simulados**: canais do Android (um por som e um mudo), handler que só
  mostra fora da tela, permissão negada, iOS em melhor esforço, som que falha não cala a voz.
- **E2E web com axe**: tela "Som e avisos", escolha gravada e mantida depois de recarregar. Pegou
  dois defeitos do kit: interruptor sem `aria-checked` e chip sem `aria-pressed` no web.

Nada disso é evidência do comportamento nativo em segundo plano (PRD).

## 5. Prova em aparelho (pendente)

Build de desenvolvimento pelo EAS (perfil `development`), instalado no aparelho do Ramon.
Rotina de prova: Tabata clássico (16 trocas em 4 min). Registrar aparelho, sistema e o atraso
entre o previsto e o ouvido.

| # | Cenário | Como | Resultado |
| --- | --- | --- | --- |
| 1 | Tela bloqueada | Começar, bloquear, ouvir as 16 trocas | |
| 2 | Spotify tocando | Música alta; o aviso abaixa e a música volta | |
| 3 | Vídeo em outro app | YouTube aberto durante o treino | |
| 4 | Chamada recebida | Ligar no meio; depois conferir a posição | |
| 5 | Notificação negada | Negar na primeira vez; só com o app à vista | |
| 6 | Economia de bateria | Ativar e bloquear a tela | |
| 7 | Fone com e sem fio | Conectar e desconectar no meio | |
| 8 | Pausa e retomada | Pausar, esperar 1 min, retomar: nada toca na pausa | |
| 9 | Sessão longa | Rotina de 30 min com a tela bloqueada | |
| 10 | Encerrar à força | Fechar pelo multitarefa no meio | |
