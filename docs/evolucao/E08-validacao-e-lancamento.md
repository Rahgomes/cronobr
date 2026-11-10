# E08 · Validação e versão candidata

Super PRD 08: preparar uma versão candidata para validação, **sem publicar**. Base: E07 completa
(669 testes Jest com domínio a 100%, 86 E2E com axe, roteiro de aparelho E03 + E07 pendente do
APK único).

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Qualidade e fluxos críticos: mapa de cada exigência do PRD para o teste que a prova; lacunas cobertas (primeira abertura sem rede, permissão recusada, texto ampliado, arquivo vindo de outro sistema); fixtures de versões anteriores conferidas | Feito |
| B | Performance: o que dá para medir sem aparelho (abertura do pacote web, resposta dos controles, precisão das transições, biblioteca e histórico volumosos) com limite em teste; roteiro de medição no aparelho (abertura, memória e bateria em sessão longa) | Feito |
| C | Monetização: banner discreto só com IDs de teste, longe dos controles de treino, sem intersticial; uso normal sem anúncio (falha, offline, sem preenchimento); consentimento e declarações pela documentação oficial atual | Feito |
| D | Lojas: textos nas 4 línguas (título candidato, descrição curta e completa) dentro dos limites atuais de cada loja; lista de capturas; privacidade igual ao comportamento real; instruções de backup e importação; nada de "funciona ilimitado em segundo plano" | Feito |
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

## Lote B · Performance

Medido no Chromium (Pixel 7 emulado, servidor local, num tema só) por `e2e/desempenho.spec.ts`.
Cada número abaixo é também um limite no teste, com folga para máquina lenta: se piorar além
dele, o CI falha. A medição no aparelho é o roteiro no fim da seção.

| Medida | Resultado | Limite no teste |
| --- | --- | --- |
| Abertura até a Início pronta | 2,3 s (página carregada em 0,7 s; o resto é abrir o banco e montar as telas) | 5 s |
| JavaScript baixado na web | 3,7 MB, sem módulo repetido entre os pacotes | 6 MB |
| Resposta dos toques no treino (Pausar, Retomar, Pular, 5 vezes cada) | pior toque 64 ms (Event Timing, a base do INP) | 200 ms ("bom" para INP) |
| Precisão das trocas de fase, em tempo real | 5.034, 4.968 e 5.001 ms para fases de 5 s: erro máximo de 34 ms | 400 ms (a tela lê o relógio a cada 250 ms) |
| Backup no máximo do formato (1.000 rotinas, 20.000 registros, 11,9 MB) | prévia em 3,3 s; restaurar em 24 s (botão em "carregando" o tempo todo) | 20 s e 60 s |
| Início com 1.000 rotinas | **antes: 4,4 s e 34 MB a mais de memória; depois: 1,6 s e 1,5 MB** | 5 s e 10 MB a mais que o app vazio |
| Histórico com 20.000 registros | 1,4 s para abrir; rolar e carregar mais páginas em 0,2 s; memória igual à do app vazio | 5 s e 10 MB |

A memória é medida depois de forçar a coleta de lixo (CDP). Sem isso, o mesmo histórico
mostrava 273 MB, quase tudo lixo ainda não recolhido da importação.

### Roteiro de medição no aparelho

Junta-se aos roteiros da E03 e da E07 na rodada do APK. Anotar aparelho, sistema e versão.

| # | Medida | Como | Aprovado se |
| --- | --- | --- | --- |
| P1 | Abertura a frio | Fechar pelo multitarefa e abrir; cronometrar até a Início responder ao toque (3 vezes, mediana) | Até 2 s num aparelho intermediário |
| P2 | Abertura com dados | Restaurar o backup grande (`desempenho.spec.ts` gera o arquivo) e repetir P1 | Até 3 s |
| P3 | Resposta dos controles | Pausar, retomar e pular 10 vezes cada durante o treino | Nenhum toque que pareça atrasado; nenhum toque perdido |
| P4 | Precisão das transições | Gravar a tela com som num Tabata e medir no vídeo o apito contra o relógio da tela | Até 0,3 s entre o previsto e o ouvido |
| P5 | Memória em sessão longa | Treino de 30 min com cadência; `adb shell dumpsys meminfo` no começo, no meio e no fim (Android) ou Xcode Instruments (iPhone) | Sem subir sem parar |
| P6 | Bateria em sessão longa | Mesmo treino, tela acesa, brilho fixo; % de bateria no começo e no fim | Anotar; comparar com o metrônomo da E07 (E8) |
| P7 | Biblioteca e histórico volumosos | Com o backup grande: abrir Início, Histórico, calendário, rolar | Sem travar; rolar sem engasgo visível |

### Decisões do lote B

| # | Decisão | Por quê |
| --- | --- | --- |
| D128 | **Listas de rotinas mostram 20 e um "Mostrar mais 50 (faltam N)"**, na Início e na modalidade | A medição achou a Início desenhando as 1.000 rotinas de uma vez, cada uma calculando a duração: 4,4 s e 34 MB. Lista virtual mudaria o desenho da Início inteira; mostrar em partes resolve com uma mudança pequena e o leitor de tela sabe quantas faltam |
| D129 | **Desempenho vira teste com limite**, num tema só, com os números anexados ao relatório do Playwright | Mesmo motivo do D121: medir uma vez não pega regressão. O limite tem folga para o CI, mais lento que a máquina local |

## Lote C · Monetização

Base: documentação atual do `react-native-google-mobile-ads` 17.4 (exige RN 0.86 com a nova
arquitetura; o app está no 0.88) e da plataforma de consentimento do Google (UMP). Nenhuma conta
criada (D125): o app usa os IDs de exemplo do Google, que só servem anúncio de teste.

| O quê | Como ficou |
| --- | --- |
| Onde aparece | No fim da Início e no fim do Histórico, depois da última ação da tela. Nunca na sessão, no editor, na prévia do treino, em folha ou diálogo (D124) |
| Formato | Banner adaptativo em linha, até 100 de altura, com "Publicidade" em cima. Sem intersticial, sem vídeo, sem anúncio de abertura |
| IDs | App: `ca-app-pub-3940256099942544~3347511713` (Android) e `~1458002511` (iPhone). Bloco: `TestIds.ADAPTIVE_BANNER`. Trocar pelos reais é passo de lançamento |
| Consentimento | UMP a cada abertura, como a documentação pede, mas só quando a primeira tela com anúncio fica à vista (D131). Sem consentimento, sem anúncio. Medição do SDK espera o consentimento (`delayAppMeasurementInit`) |
| Rever a escolha | Ajustes mostra "Privacidade dos anúncios" quando o UMP diz que o mercado exige (Europa, Reino Unido) e reabre o formulário do Google |
| Classificação | Livre (PG): app de treino para qualquer idade |
| Web | Sem SDK: o arquivo `expo-ads.tsx` não carrega nada, e o pacote web continua sem nenhuma referência ao SDK (conferido no `dist`) |

### Carregamento, falha, offline, sem preenchimento

| Situação | O que acontece | Prova |
| --- | --- | --- |
| Carregou | Banner e o rótulo "Publicidade" no fim da tela; a tela segue igual em cima | `ad-slot.test.tsx` |
| Sem preenchimento (`no-fill`) | O espaço some sem aviso; nada reservado | idem |
| Offline (`network-error`, `timeout`) | Some; tenta de novo quando a tela volta a ficar à vista ou o app volta para a frente | idem ("offline e depois com rede") |
| Erro qualquer | Some | idem |
| Sem consentimento | Nenhum pedido de anúncio; tenta de novo na próxima vez que a tela aparecer | `ad-slot.test.tsx`, `expo-ads.native.test.tsx` |
| SDK falhou ao começar | Nenhum banner, nenhum erro para a pessoa | idem |
| Formulário de consentimento sem rede | Vale o consentimento da vez anterior | `expo-ads.native.test.tsx` |
| Treino e editor | Nenhum banner, e o consentimento nem é pedido | `session-screen.test.tsx`, `editor-screen.test.tsx` |

### Roteiro no aparelho

Junta-se aos roteiros da E03, E07 e lote B na rodada do APK.

| # | Passo | Aprovado se |
| --- | --- | --- |
| A1 | Abrir a Início com rede | Banner com a marca "Test Ad" do Google e "Publicidade" em cima, longe de qualquer botão |
| A2 | Começar um treino, abrir o editor, abrir uma folha | Nenhum anúncio em nenhum deles |
| A3 | Modo avião e abrir o app | Início sem banner e sem espaço vazio; tudo funciona |
| A4 | Tirar o modo avião e voltar ao app | Banner volta |
| A5 | Aparelho com a região da Europa (geografia de teste do UMP, exige registrar o aparelho de teste) | Formulário de consentimento aparece só ao chegar na Início, nunca por cima de treino retomado; Ajustes mostra "Privacidade dos anúncios" |
| A6 | iPhone | Nenhum pedido de rastreamento (D132) |

### Pendências de lançamento (dependem de conta)

- Conta AdMob, IDs reais do app e do bloco, `app-ads.txt` no site.
- Mensagem de consentimento configurada no console (sem ela, o UMP não mostra formulário).
- Identificadores SKAdNetwork no iPhone (`skAdNetworkItems`), recomendados para anúncio sem rastreamento.
- Declarações das lojas (lote D): o SDK coleta identificador de publicidade no Android e dados de uso para anúncio; a Play pede a permissão `AD_ID` declarada, que vem do próprio SDK.

### Decisões do lote C

| # | Decisão | Por quê |
| --- | --- | --- |
| D130 | **Banner só no fim da Início e do Histórico**, em linha e baixo, nada reservado enquanto carrega | "Espaço suficiente dos controles de treino": as duas telas são de consulta, e o fim da rolagem fica longe de qualquer controle. Sem espaço reservado, falha não deixa buraco |
| D131 | **Consentimento só quando a primeira tela com anúncio aparece**, não ao abrir o app | Um treino retomado abre direto na sessão; pedir consentimento ao ligar cobriria o cronômetro. A Início fica montada embaixo do treino, então o pedido de novo ao voltar para o app só vale com ela à vista |
| D132 | **Sem pedido de rastreamento (ATT) no iPhone** | Um diálogo a menos, nenhum identificador entre apps. Banner sem rastreamento rende menos, mas o app não depende disso. Pode mudar no lançamento se a conta mostrar diferença grande |
| D133 | **Falha some em silêncio e tenta de novo no foco ou ao voltar para o app** | Anúncio indisponível não é problema da pessoa: nem aviso, nem botão. Tentar de novo só nesses momentos evita pedir anúncio em laço sem rede |

## Ajuste pedido no meio da E08 · Valores digitados à mão

Pedido do Ramon depois do lote C: o + e o − andavam de 5 em 5 segundos (15 em 15 no descanso entre
blocos e no desaquecimento), e não havia como escrever o valor. Vale para todas as telas com o
controle (`ui/stepper.tsx`): intervalado, temporizador, temporizadores, editor (preparação,
etapa, repetições, cadência, rodadas, descanso entre blocos, desaquecimento), sequência do
profissional e metrônomo.

| O quê | Como ficou |
| --- | --- |
| Passo do + e do − | 1 segundo em todo campo de tempo; segundos dos temporizadores vão até 59 (antes 55). Cadência no editor segue de 5 em 5 BPM e o atraso do fone no passo dele: o número digitado cobre o ajuste fino |
| Tocar no número | Abre ali mesmo, sem janela do sistema (D08 segue valendo): tempo em dois campos, minutos e segundos; contagem em um campo. Teclado numérico, o valor atual já selecionado |
| Confirmar | Botão de confirmar, "ok" do teclado nos segundos, ou tocar fora. "ok" nos minutos passa para os segundos. Segundos acima de 59 somam (0 e 90 vira 1:30) |
| Limite | O que passar do mínimo ou do máximo é ajustado e explicado embaixo ("Use entre 1 e 99. Ajustado para o limite.") |
| Leitor de tela | O número virou botão "Exercício: 0:30", com a dica "Toque para digitar o valor"; os campos se chamam "Minutos de Exercício" e "Segundos de Exercício" |

Prova: `domain/number-input.test.ts` (leitura e limite, 100%), `ui/stepper.test.tsx` (passo,
edição, limite, confirmar pelo teclado e saindo do campo), testes das telas de temporizador e
sequência digitando, `e2e/rapido.spec.ts` (digitação no Chromium com axe no modo de edição).
Capturas 30 e 31.

| # | Decisão | Por quê |
| --- | --- | --- |
| D134 | **Passo de 1 s e número digitável** em todo valor com + e − | Passo de 5 s não chega em 0:42; para ir de 0:20 a 3:00, digitar é mais rápido que qualquer passo. Com o número editável, o passo pequeno não obriga a tocar 160 vezes. Edição no próprio lugar, sem seletor nativo, mantém o D08 |

## Lote D · Lojas

Nada foi publicado e nenhuma conta foi criada (D125). Limites conferidos em 09/11/2026 nas
páginas oficiais do Play Console e do App Store Connect.

| Entrega | Onde |
| --- | --- |
| Textos nas 4 línguas (nome, descrição curta, subtítulo, texto promocional, palavras-chave, descrição completa, novidades) | Fonte: `loja/textos.ts`. Para ler: `docs/lojas/textos.md`, gerado pelo teste |
| Privacidade: política (pt e en), Segurança dos dados da Play, Privacidade do app da App Store | `docs/lojas/privacidade.md` |
| Instruções de backup e importação | Dentro da descrição completa, com os nomes de botão do app em cada língua |
| Lista de capturas | Abaixo |

### O que o teste dos textos garante

`loja/textos.test.ts` (29 testes) quebra se:

- um campo passar do limite da loja (palavras-chave contadas em bytes, como a Apple conta);
- uma palavra-chave repetir o nome (desperdício: o nome já conta na busca) ou tiver menos de 3
  letras;
- aparecer "CronoBR" sem acento, travessão ou promessa de funcionamento ilimitado;
- os números do texto (24 modelos, 13 modalidades, 10 temporizadores) ficarem diferentes do
  domínio;
- o caminho do backup citar um botão que não existe na tradução do app (Ajustes > Backup e
  transferência > Exportar backup, Abrir arquivo, Incluir histórico, Juntar, Substituir tudo);
- a frase da tela bloqueada perder a condição (permitir notificações, sistema pode atrasar);
- o `docs/lojas/textos.md` ficar diferente da fonte.

### Benefícios do texto e a prova de cada um

| Benefício | Prova | Falta no aparelho |
| --- | --- | --- |
| Sem internet, sem cadastro | `e2e/fluxos.spec.ts` (nenhuma requisição de fora) | Modo avião no APK |
| 24 modelos, 13 modalidades, atalhos rápidos | `presets.test.ts`, `inicio.spec.ts`, `rapido.spec.ts` | |
| Até 10 temporizadores | `timers.test.ts`, `temporizadores.spec.ts`, `resistencia.spec.ts` | |
| Editor com blocos, lados, descanso, digitar valores | `editor-screen.test.tsx`, `stepper.test.tsx`, `editor.spec.ts`, `rapido.spec.ts` | |
| Colar a sequência do profissional | `sequence.test.ts`, `sequencia.spec.ts` | |
| Voz, sons, contagem, vibração | `cue-settings-screen.test.tsx`, `expo-port.test.ts` | Roteiro E03 |
| Metrônomo e cadência | `engine.test.ts` do metrônomo, `cadencia.spec.ts` | Roteiro E07 |
| Notificação com a tela bloqueada, se permitida | `session-screen.test.tsx`, `notifications-blocked.test.tsx` | Roteiro E03 #1, #2, #10 |
| Histórico uma vez só, calendário, notas, repetir | `sessao.spec.ts`, `historico.spec.ts` | |
| Backup entre Android e iPhone | `transfer.test.ts`, `backup.spec.ts`, formato único | Fluxos 5 e 6 do lote A |
| 4 línguas, temas, texto ampliado, leitor de tela | `messages.test.ts`, `capturas/matriz.spec.ts`, axe em todos os E2E | TalkBack e VoiceOver |
| Anúncio fora do treino | `ad-slot.test.tsx`, `session-screen.test.tsx`, `editor-screen.test.tsx` | Roteiro A1 a A6 |

O que depende do aparelho entra no texto porque está implementado e testado na lógica; antes de
publicar, os roteiros da rodada do APK precisam passar (relatório do lote E).

### Capturas para as lojas

Tiradas do APK e do build de iPhone, não da web: barra de status, fontes e teclado do sistema são
os de verdade. Play: até 8 por tipo de aparelho, PNG ou JPEG sem transparência, lado entre 320 e
3.840 px, 1080 x 1920 ou mais em 9:16 para entrar nas recomendações. App Store: de 1 a 10, iPhone
6,9" (1320 x 2868) ou 6,5" (1284 x 2778). As capturas web de referência mostram cada tela.

| # | Tela | Mostra | Referência |
| --- | --- | --- | --- |
| 1 | Início com uso | Modalidades, recentes e suas rotinas | `13-inicio-com-uso` |
| 2 | Treino em andamento (anel) | Fase, tempo grande, próxima fase | `07-sessao-anel-exercicio` |
| 3 | Treino em modo Foco | A cor da fase na tela inteira | `08-sessao-foco-exercicio` |
| 4 | Modalidade Tabata | Modelos prontos | `02-modalidade` |
| 5 | Editor | Blocos, etapas e valores digitados | `04-editor` e `30-valor-digitado` |
| 6 | Temporizadores | Vários ao mesmo tempo | `18-temporizadores` |
| 7 | Histórico | Calendário e registros | `14-historico` |
| 8 | Backup e transferência | Exportar e abrir arquivo | `15-backup` |
| 9 | Metrônomo e cadência (só App Store) | Ritmo por etapa | `23-sessao-cadencia` |
| 10 | Sequência do profissional (só App Store) | Texto colado vira rotina | `28-sequencia` |

Uma série em tema claro para pt-BR e en-US; as outras línguas usam as mesmas telas com o app
na língua. Sem anúncio nas capturas (só aparecem com anúncio real ou de teste, e o de teste diz
"Test Ad").

### Pendências (dependem de conta)

- Disponibilidade do nome "CronôBR: Tabata e HIIT" nas duas lojas, e se a busca por "cronobr"
  sem acento acha o app (testar no console e na loja depois de publicar em teste fechado).
- Política de privacidade em URL pública e endereço de contato.
- Questionários de classificação etária e do público-alvo.
- Capturas tiradas nos aparelhos.

### Decisões do lote D

| # | Decisão | Por quê |
| --- | --- | --- |
| D135 | **Textos das lojas em TypeScript com teste**, não em documento solto | O texto promete coisas do app: o teste amarra limites, números e nomes de botão ao código, e o doc legível é gerado da mesma fonte. Mudou o botão ou o número de modelos, o teste avisa |
| D136 | **Nome nas lojas com acento: "CronôBR: Tabata e HIIT"** | A marca foi decidida com o circunflexo (`docs/marca/MARCA.md`, 07/11); o PRD escreve sem porque é anterior. A busca sem acento entra nas pendências |
| D137 | **Público-alvo de 13 anos ou mais**, anúncio de classificação livre | Com menores de 13, a Play exige o programa para famílias e SDK de anúncio certificado para crianças. O app serve a qualquer idade, e o anúncio pedido é livre (PG) |
| D138 | **Nenhum dado "usado para rastrear você" na App Store** | Sem pedido de rastreamento (D132), o app não pode rastrear e o SDK não acessa o identificador da Apple. Se o lançamento ligar o ATT, essa tabela muda junto |
