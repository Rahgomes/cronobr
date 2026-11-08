# Receita de bolo v2: da ideia (ou do app que já existe) ao app publicado

Evolução da receita v1 (escrita no ManiVez). A v1 descreve um caminho só: app novo, com conta,
nuvem e assinatura. A v2 mantém as mesmas 12 etapas e acrescenta **trilhas**: o que muda em cada
etapa conforme o tipo de app. Antes de começar, responda às 5 perguntas do perfil; as respostas
dizem quais etapas rodar inteiras, quais só refinar e quais pular.

Esta pasta é a versão em teste. Quando estabilizar, sobe para um lugar compartilhado (skill
`mobile-app-blueprint`) e a v1 do ManiVez passa a apontar para cá.

## Perfil do app (responder antes da etapa 1)

| #  | Pergunta                                  | Respostas possíveis                                   | Muda o quê                          |
| -- | ----------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| P1 | O app já existe?                          | **Novo** · **Existente** (código, marca ou telas)     | Etapas 1, 4, 5, 6, 8                |
| P2 | Tem cobrança?                             | **Sem** · **Anúncio** · **Assinatura** · **Os dois**  | Etapas 2, 10, 12                    |
| P3 | Precisa de servidor?                      | **Local** (dados no aparelho) · **Nuvem** (conta, sync) | Etapas 2, 8, 9, 10                |
| P4 | Como as telas nascem?                     | **Com imagem** (gerada) · **Direto no código** · **Referência externa** (Figma, prints) | Etapa 6 |
| P5 | Onde valida?                              | **Expo** (Go, web, APK dev) · **Loja** (teste fechado) | Etapas 11 e 12                     |

## Etapas e trilhas

| #  | Etapa (v1)                         | Novo | Existente | Variações por perfil |
| -- | ---------------------------------- | ---- | --------- | -------------------- |
| 0  | **Auditoria da base** (nova)       | pula | **essencial** | Matriz funcionalidade × interface × implementação real × persistência × testes × lacuna. Classificar completa / parcial / só na interface. Rodar o app e capturar as telas reais (ver "Telas como estão") |
| 1  | PRDs, jornadas e telas com ID      | essencial | **refinar** | Existente: os PRDs nascem da auditoria e descrevem a evolução, não o app inteiro |
| 2  | Revisão técnica dos PRDs (D##)     | essencial | essencial | Local: decisões de modelo de dados, migração e relógio pesam mais que regra de servidor. Sem cobrança: pula o bloco de assinatura e regras de pagamento da loja |
| 3  | Backlog                            | opcional | opcional | — |
| 4  | Marca                              | essencial | **refinar ou pular** | Existente: só conferir contraste da cor da marca e ícone; não redesenhar sem motivo |
| 5  | Tokens e prompt-base               | essencial | **extrair** | Existente: o prompt-base sai do `theme` atual, não de uma marca nova |
| 6  | Telas                              | essencial | refinar | **P4 Com imagem:** `.md` → `tela-gen` → conferência (máx. 2 refações). **Direto no código:** pula a imagem; o `.md` da tela continua obrigatório (é ele que vira teste e briefing). **Referência externa:** a referência entra no `.md` como anexo |
| 7  | Fluxo V2                           | opcional | opcional | — |
| 8  | Fundação técnica                   | essencial | **endurecer ou reescrever** | Existente **endurecer**: adicionar o que falta (testes, CI, lint) sem trocar a stack. Existente **reescrever** (stack defasada, sem testes, interface que promete o que não faz): projeto novo na base do último app da receita, código antigo em `legado/` até ser portado. Local: sem emulador do Firebase |
| 9  | Prova vertical (2 jornadas)        | essencial | essencial | Existente: escolher a jornada mais usada e a mais arriscada (no timer: contador confiável) |
| 10 | Demais jornadas por lote           | essencial | essencial | — |
| 11 | Teste fechado                      | depende | depende | P5 Expo: troca por rodada de validação em aparelho com roteiro e registro |
| 12 | Loja e publicação                  | essencial | essencial | Sem cobrança: só ficha, privacidade e páginas legais. Anúncio: consentimento e "Contém anúncios" |

## Testes (vale para toda trilha, não é opcional)

| Camada      | O que cobre                                                    | Ferramenta (Expo)                     |
| ----------- | -------------------------------------------------------------- | ------------------------------------- |
| Unitário    | Regra pura: motor de tempo, cálculo, migração, validação       | Jest (`jest-expo`)                    |
| Integração  | Tela + estado + persistência, sem aparelho                     | React Native Testing Library          |
| E2E         | Jornada inteira pela interface                                 | Maestro (nativo) ou Playwright (web)  |

Regra herdada da v1: cada lote fecha com os três verdes nos fluxos que tocou. Teste em Expo Go
ou web não prova comportamento nativo (segundo plano, áudio, notificação): isso fica registrado
como **pendente de aparelho**, nunca como aprovado.

## Telas como estão (app existente)

1. Instalar dependências (`heavy -- npm ci`).
2. `npx expo export --platform web` e servir a pasta numa porta livre.
3. Playwright em viewport 390×844, tema escuro: navegar e salvar `docs/imagens/atual/*.png`.
4. Limitação: o web não mostra comportamento nativo (blur, haptics, segundo plano). Serve para
   comparar layout e texto, não para aprovar a tela.

Depois de implementar, a captura da tela **real** substitui a imagem-conceito na documentação
(o conceito é referência, a captura é o registro).

## Diário

### CronoBR (perfil: Existente · Sem cobrança na fase 1, anúncio depois · Local · Com imagem · Expo)

- **07/11 — O que deu certo:** o export web serviu para capturar as telas reais sem aparelho
  (4 telas em ~2 min). Conceitos de início, editor e sessão ativa saíram na 1ª rodada do `tela-gen`
  (52-57 s cada).
- **07/11 — O que não deu:** a porta 8765 do servidor já servia a prévia do ManiVez e a captura
  pegou o app errado. Regra: conferir a porta livre e o `<title>` antes de capturar.
- **07/11 — O que mudou:** criada a etapa 0 (auditoria) e as trilhas por perfil.
- **07/11 — Vídeos de referência:** extrair quadros (`ffmpeg fps=1/3,tile=6x2`) + transcrever a
  narração (Groq Whisper) custou ~3 min para 6 min de vídeo e deu a análise completa sem Gemini.
  Vídeos ficam fora do git (`.gitignore`); o documento não cita o nome dos apps.
- **07/11 — Armadilha:** esperar processo com `while pgrep -f ...` casa com o próprio comando e
  nunca termina; usar `wait` ou PID.
- **07/11 — Etapa 0 (auditoria) no CronôBR:** ler storage, tela de sessão e contexts (~2.000 linhas)
  bastou para a matriz; os checks rodaram pela fila `heavy` em paralelo à leitura. Achado típico de
  app feito por gerador: **configuração na interface sem efeito no código** (beep que vibra,
  vibração configurada e ignorada, "modo silencioso" que não detecta). Regra para a etapa 0:
  para cada controle de configuração, seguir até onde ele é lido.
- **07/11 — Decisão de trilha:** a auditoria mostrou SDK 4 versões atrás, zero testes e
  configurações sem efeito; o Ramon optou por **reescrever** na base do ManiVez (SDK 58, Expo
  Router, camadas e kit de UI). Virou a variação "reescrever" da etapa 8.
- **08/11 — E00 (fundação por reescrita):** copiar só o pedaço do kit de UI que a 1ª tela usa
  (o knip barra o resto como arquivo sem uso); o restante vem quando a tela pedir. Pegadinhas:
  `cp x.ts*` não copia `x.test.tsx`; copiar os testes **depois** pode sobrescrever um teste já
  adaptado (aconteceu com `theme.test.ts`); o padrão do contexto de tema fora do provider deve
  continuar claro, senão todos os testes do kit que comparam com `colors` quebram.
- **08/11 — Contraste da marca:** branco sobre o laranja #FF6B35 dá 2,9:1 e reprova. Solução sem
  trocar a marca: no escuro o botão laranja leva texto #121212 (7,3:1); no claro o "primário" vira
  #C2410C, que aguenta texto branco e serve de texto laranja sobre branco. Medido em `theme.test.ts`.
- **08/11 — Projeto EAS de app novo:** `eas init` não escreve em `app.config.ts`; ele cria o projeto
  e imprime o `projectId`, que vai fixo no config. Token da conta Expo agora em `/root/.secrets/expo.env`.
- **07/11 — E02 (contador e dados):** motor puro com o relógio injetado (`now` como parâmetro)
  deixou os 10 cenários do PRD baratos de provar em três níveis com o MESMO relógio controlado:
  domínio (número), tela (relógio falso + timers falsos do Jest) e E2E (`page.clock` do
  Playwright). Regra: nada no domínio lê `Date.now`.
- **07/11 — Banco de teste de verdade:** `node:sqlite` em memória no lugar de fake, com falha
  injetável por trecho de SQL. Pegou o que fake não pega (transação, `INSERT OR IGNORE`,
  paginação por cursor). O adaptador de teste precisa falhar como o real: promessa rejeitada,
  não exceção síncrona, senão o `ROLLBACK` protegido some.
- **07/11 — Armadilhas da E02:** `x.d.ts` com o mesmo nome de `x.ts` é ignorado pelo TypeScript
  (renomear); no zod 4 `z.unknown()` em objeto é obrigatório (`.optional()`) e o refine do objeto
  roda mesmo com erro de min/max dentro; lista virtualizada não renderiza o fim no RNTL, então a
  paginação se prova no repositório e a tela só prova o botão.
- **07/11 — SQLite no web:** `expo-sqlite` roda no navegador (wasm + OPFS) e dá ao E2E o mesmo
  caminho de dados do celular. A doc do pacote manda ligar COOP/COEP, mas isso é para a API
  síncrona; com só a assíncrona funciona sem. Pegou porque conferi a prévia publicada: o plugin
  não aplicava os cabeçalhos no EAS Hosting e o E2E local testava uma config que a produção não
  tinha. Lição: o E2E roda com a mesma config de servidor da produção, e cada exigência da doc
  se confirma medindo.
- **07/11 — `page.clock`:** `install()` sozinho deixa o tempo correr de verdade e o texto do
  timer muda durante a checagem. Congelar (`pauseAt`) só com a tela pronta: o banco do web e o
  `axe` usam timers e travam com o relógio parado. Recarregar e rodar o `axe` com `resume()`.
- **07/11 — Início em carrossel (C01b):** lista longa de modelos virou carrossel por modalidade
  com foto, e o histórico virou "Recentes" em cards (tocar repete o registro). Cada modalidade abre
  uma tela com os modelos dela. Ganho: a Início cabe numa tela; o E2E passou a navegar como o
  usuário (Início, modalidade, modelo).
- **07/11 — Foto de fundo no web:** `Image` com `absoluteFill` sozinho mostra a foto no tamanho
  natural (ampliada) no react-native-web. Precisa de `width`/`height` `'100%'` explícitos. Só
  apareceu na captura de tela, não em teste: conferir o visual exportado antes de fechar.
- **07/11 — Texto sobre foto:** faixa escura fixa (scrim) embaixo do card e contraste medido no
  pior caso em `theme.test.ts`, em vez de confiar na foto ser escura.
- **08/11 — Avisos atrás de uma porta:** a sessão fala com `CuePort` (tocar, agendar, manter a
  tela acesa); o adaptador nativo é um arquivo só e os testes de tela usam um falso que registra
  as chamadas. Deu para provar com banco real que pausar cancela os avisos e retomar reagenda,
  sem módulo nativo no Jest.
- **08/11 — "Fora da tela" com uma regra só:** notificação e app decidem quem toca pela mesma
  função. Duas regras parecidas em lugares diferentes é aviso dobrado ou mudo no aparelho.
- **08/11 — axe no web pega o kit:** `accessibilityState` do RN não vira `aria-checked` nem
  `aria-pressed` no react-native-web. Interruptor e chip precisam do atributo `aria-*` explícito.
- **08/11 — Sons por síntese:** um script em Python gera o pacote (beep, sino, gongo, apito,
  conclusão) e o mesmo .wav serve ao app e à notificação. Sem licença de terceiros para cuidar.
- **08/11 — RNTL 14 é assíncrono até no `unmount`:** sem `await`, o `DialogHost` da primeira
  montagem continua registrado e o diálogo da segunda some. Chamada de callback fora do
  `fireEvent` (ex.: o `usePreventRemove` simulado) vai em `await act(async () => …)`.
- **08/11 — Inativo-que-explica no web:** o `Pressable` do react-native-web sobrescreve
  `aria-disabled` com a prop `disabled`; botão que fica clicável para explicar o motivo é lido
  como ativo e o axe reprova o contraste. Onde a ação não existe, escrever o motivo no lugar.

- **08/11 — Mostrar só o que já gravou:** favorita aparecia marcada antes do banco terminar e o
  reload do E2E no CI (máquina lenta) perdia. Local passava sempre. Preferência pequena: grava e
  depois atualiza a tela. O axe também precisou esperar o `Modal` do RN-web ganhar `role="dialog"`.
- **08/11 — `waitFor` assíncrono com timers falsos engole atualização:** callback `async` dentro
  do `waitFor` sobrepõe `act()` e o React passa a descartar o `setState` do toque seguinte (o
  botão foi tocado, a tela não mudou). Esperar gravação no banco com um laço de
  `act(async () => {})` + checagem, não com `waitFor(async)`.
- **08/11 — Toque longo no E2E:** com o relógio do Playwright parado, `mouse.down()`,
  `clock.runFor(ms)` e `mouse.up()` simulam o segurar sem espera real.
- **08/11 — Treino longo no E2E:** `clock.runFor` de 10 minutos desenha cada tique do motor e
  leva uns 25 s reais; passa do limite padrão de 30 s do teste. `test.slow()` no teste, e um
  `runFor` só (em passos de 1 min a tela parava atrás).
- **08/11 — Schema de limites descarta campo novo:** campo opcional novo no modelo precisa entrar
  também no schema zod de validação, senão o editor salva e o campo some em silêncio. Teste de tela
  que salva e relê pega; teste só de domínio não.
- **08/11 — Data no E2E:** sem `timezoneId` o navegador do Playwright usa o fuso da máquina (CI
  em UTC, servidor em BRT). Tela que mostra dia do calendário precisa de
  `test.use({ timezoneId })`; no Jest, montar as datas com `new Date(a, m, d, h)` (hora local).
- **08/11 — `getByLabel` pega rótulo parcial:** "Nota" casava com "Salvar nota" e com o botão da
  tela anterior ainda na pilha. Usar `{ exact: true }`.
- **08/11 — E05, arquivo como porta:** ler/compartilhar/escolher arquivo atrás de uma porta (como
  os avisos) deixou testar exportar e importar com banco real sem módulo nativo, e a web ganhou
  download e seletor do navegador com o mesmo código de tela. No E2E, `waitForEvent('download')`
  e `waitForEvent('filechooser')` cobrem o caminho inteiro.
- **08/11 — Rótulo repetido na pilha:** botão "Voltar" num diálogo colidiu com o "Voltar" do topo.
  Verbo da ação no diálogo ("Desfazer"), nunca um rótulo de navegação.

- **08/11 — E06, idioma "do aparelho" e o E2E:** o Chromium do Playwright vem em `en-US`. Ligar
  a língua do aparelho como padrão trocaria a suíte inteira para inglês; `locale: 'pt-BR'` no
  `use` do config e um teste próprio para cada outra língua.
- **08/11 — Preferência guardada em memória envelhece:** provedor que lê a preferência uma vez
  (avisos, tema, favoritas) não vê a restauração de um backup, e a próxima mudança grava o valor
  velho por cima do restaurado. Um número de revisão no provedor de dados, incrementado depois de
  restaurar, entra nas dependências de quem lê.
- **08/11 — Textos tipados sem biblioteca:** `type Messages` derivado do objeto em português
  (string vira `string`, função mantém a assinatura) faz o `tsc` cobrar cada chave em cada língua.
- **08/11 — E06, domínio sem língua:** texto que o domínio monta (voz, notificação, validação)
  entra por um parâmetro `Words`, e os testes do domínio passam `pt.words`. Nome escrito pela
  pessoa e rótulo do app em campos separados: guardar "Preparação" como nome do segmento impedia
  traduzir.
- **08/11 — Extração de i18n com o Codex:** recon com plano na primeira fatia, depois o plano
  aprovado vira exemplo ("siga a fatia 1") e as outras fatias vão direto. Regra que segurou a
  qualidade: o português fica idêntico, então os testes de tela não mudam e provam a extração.
- **08/11 — Rodar o E2E em outra língua acha bug de acessibilidade:** o botão desligado com
  opacidade 0,6 reprovou o axe numa tela que o E2E em português só visitava depois de preencher.
