# E06 · Refinamento visual e acessibilidade

Refinar a interface sem perder fluxo, dado nem teste das etapas anteriores (super PRD 06). As
imagens-conceito do início, do editor e da sessão já existem desde 07/11 (`docs/imagens/C01b`,
`C02`, `C03`, `C03b`, `C03c`) e são a referência visual; esta etapa implementa com os componentes
reais do app e troca os conceitos por capturas das telas de verdade.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Ajustes com tema (aparelho, claro, escuro) e idioma (aparelho, pt-BR, en, es, fr); base de textos em 4 línguas; aparência no backup; correções de passagem | Entregue 08/11 |
| B | Todos os textos nas 4 línguas: telas, motivos de recusa do arquivo, rótulos de fase, som e modalidade, datas, voz no idioma escolhido, modelos prontos traduzidos (nome escrito pela pessoa nunca muda) | Entregue 08/11 |
| C | Acessibilidade e layout: texto grande sem corte, contador com teto de escala, anúncio só em troca de fase, alvos de toque, alternativa a arrastar, movimento reduzido, paisagem na sessão, tablet e áreas seguras | Entregue 09/11 |
| D | Refinamento pelas imagens-conceito: Início (última rotina e favoritas, começar em poucos toques), editor (avançado aos poucos), sessão (contador em destaque; preparar, executar, descansar e concluir por texto, som e cor; descanso entre etapas e entre blocos), estados de salvar, erro, vazio e importado; menos cartão e ícone decorativo | Entregue 09/11 |
| E | Capturas reais por tela, tamanho, tema e língua, com dispositivos e dimensões anotados; conferência de que fluxos e dados das etapas anteriores seguem iguais | A fazer |

## 1. Lote A: o que entrou

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| Domínio | `src/domain/appearance.ts` | Tema e idioma escolhidos, leitura tolerante do valor gravado, língua em uso a partir do aparelho |
| Textos | `src/i18n/messages/{pt,en,es,fr}.ts`, `src/i18n/i18n-context.tsx` | Textos por língua com o mesmo formato (o `tsc` cobra cada chave); `useT()` nas telas; `<html lang>` na web |
| Textos | `src/i18n/device.ts` | Línguas do aparelho (`expo-localization`), isoladas para teste |
| Recursos | `src/features/settings/appearance-context.tsx` | Lê a aparência gravada e envolve as telas com o tema e a língua escolhidos; grava antes de aplicar |
| Telas | `src/features/settings/settings-screen.tsx` (`/ajustes`) | Tema e idioma à vista; Som e avisos um toque adiante. A engrenagem da Início abre Ajustes |
| Dados | `src/data/data-context.tsx` | `useDataChanged()` / `useDataRevision()`: depois de restaurar ou desfazer, quem guarda preferência em memória relê |
| Config | `app.config.ts` | Plugin `expo-localization` com as 4 línguas (troca de idioma por app no Android 13+ e no iPhone) |

## 2. Decisões

| # | Decisão | Por quê |
| --- | --- | --- |
| D70 | **Textos em objetos tipados, sem biblioteca de i18n**. Português é a fonte; os outros idiomas são `Messages`; texto com número ou nome é função | Chave faltando em qualquer língua quebra o `tsc`, não aparece em produção. Plural e ordem das palavras ficam com cada língua. Nenhum peso novo além do `expo-localization` |
| D71 | **"Do aparelho" é o padrão** para tema e idioma; aparelho numa língua que o app não fala abre em **inglês** | Quem configurou o aparelho em alemão lê inglês melhor que português. O nome de cada língua aparece nela mesma ("Español"), para achar a sua sem ler a atual |
| D72 | **Aparência viaja no backup** (chave `aparencia`) | É escolha da pessoa, como avisos e jeito de ver o treino. Arquivo antigo sem a chave continua valendo (chave ausente = nada muda) |
| D73 | **Ajustes reúne tema e idioma; Som e avisos fica um toque adiante** | Personalização progressiva (PRD 06): o comum à vista, o detalhado num nível abaixo. A Início mantém três ações redondas |
| D74 | **Restaurar e desfazer avisam as telas abertas** | Avisos, aparência e favoritas eram lidos uma vez; depois de "Substituir tudo" a memória ficava com o valor antigo e a próxima mudança gravava por cima do restaurado (bug da E05, achado aqui) |
| D75 | **Voltar sem tela anterior leva à Início** | Página recarregada na web, ou link direto, deixava o botão sem efeito |
| D76 | **E2E com o navegador em pt-BR**; cada outra língua em teste próprio | O Chromium do Playwright é `en-US`; com "do aparelho" como padrão, a suíte inteira trocaria de língua |

## 3. Testes do lote A

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `src/domain/appearance.test.ts` | Valor gravado estranho volta ao padrão; escolha vence o aparelho; primeira língua conhecida; inglês na falta |
| Tela | `src/features/settings/settings-screen.test.tsx` | Padrão do aparelho, trocar tema e língua grava e aplica na hora, reabrir lê o gravado, falha ao gravar avisa, Som e avisos, releitura depois de restaurar |
| Tela | `src/ui/top-bar.test.tsx` | Voltar sem tela anterior vai para a Início |
| Unitário | `src/features/transfer/portable-prefs.test.ts` | `aparencia` entre as chaves que viajam |
| E2E + axe | `e2e/ajustes.spec.ts` | Inglês na hora, mantido ao recarregar, `<html lang>`, volta ao do aparelho; tema oposto ao sistema troca o fundo e fica gravado; axe nos dois temas |

## 4. Lote B: o app inteiro nas 4 línguas

Duas partes. **B1 (Claude):** o domínio deixou de ter português fixo. **B2 (Codex, em 4 fatias
revisadas pelo Claude):** a extração dos textos das telas para `src/i18n/messages`, com as
traduções.

| Camada | Arquivo | O que mudou |
| --- | --- | --- |
| Domínio | `src/domain/words.ts` | Interface `Words`: o que o domínio escreve (voz, notificação, limites do editor, motivos de recusa do arquivo, nomes que o app dá ao criar). Quem chama passa `t.words` |
| Domínio | `src/domain/timeline.ts` | Segmento guarda só o nome escrito pela pessoa (`null` nas fases do app) e o lado como campo (`left`/`right`); o rótulo é montado na língua em uso |
| Domínio | `src/domain/limits.ts` | Schema de validação montado por língua (guardado em cache por língua) |
| Textos | `src/i18n/presets.ts`, `src/features/routines/presets.ts` | Modelos prontos traduzidos; `usePresets()` nas telas. A cópia de um modelo leva os nomes da língua de quando foi copiada |
| Textos | `src/i18n/messages/*.ts` | Seções `session`, `editor`, `home`, `routineOptions`, `history`, `quick`, `modality`, `transfer`, `cues`, `ui`, `boot` |
| Avisos | `src/features/cues/cue-context.tsx`, `expo-port.ts` | A voz fala na língua do app (pt-BR, en-US, es-ES, fr-FR); canais de notificação do Android na língua do aparelho |
| Telas | histórico e calendário | Datas, meses e letras dos dias da semana pelo `Intl` da língua em uso |
| Dados | `src/data/data-context.tsx` | Erro de armazenamento escolhe o texto pelo motivo (`unavailable`, `newer-version`, `corrupt`) |
| Kit | `src/ui/button.tsx` | Botão indisponível (que explica o motivo ao tocar) ficou cinza neutro com rótulo legível; a opacidade derrubava o laranja para 2,98:1. Achado pelo axe do E2E em inglês |

### Decisões do lote B

| # | Decisão | Por quê |
| --- | --- | --- |
| D77 | **Domínio recebe as palavras, não escolhe língua** (`Words` por parâmetro) | O domínio continua puro e testável com 100% de cobertura; voz, notificação e validação saem na língua da tela sem o domínio conhecer o i18n |
| D78 | **Nome da etapa é dado, rótulo da fase é texto** (`name: null` nas fases do app) | "Preparação" gravado na linha do tempo não traduzia. O nome escrito pela pessoa nunca muda; o que o app escreve segue a língua |
| D79 | **Modelos prontos traduzidos por tabela do texto em português**; a cópia congela a língua | Modelo é do app (segue a língua); cópia é da pessoa (não muda sozinha). O teste cobra cada texto de cada modelo em cada língua |
| D80 | **Voz na língua do app; canal de notificação na língua do aparelho** | A voz acompanha a tela. O canal aparece nos ajustes do sistema e é criado uma vez |
| D81 | **Extração delegada ao Codex em 4 fatias**, com briefing, plano revisado na primeira e diff revisado em todas | Trabalho mecânico em ~35 arquivos. O português ficou idêntico (os testes de tela não mudaram) |

### Testes do lote B

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `src/i18n/messages.test.ts` | Nenhum texto vazio ou "undefined" nas 4 línguas; nada esquecido em português no inglês e no francês; mensagens do domínio em outra língua; cada modelo traduzido |
| Unitário | testes do domínio | Passam `pt.words`; lado da mobilidade como campo |
| Tela | `cue-settings-screen.test.tsx`, `expo-port.test.ts` | Porta recebe a língua; voz em `en-US` |
| E2E + axe | `e2e/idiomas.spec.ts` | Navegador em `en-US`, `es-ES` e `fr-FR`: Início, modelo, sessão, editor, Ajustes, histórico, backup e avisos na língua, `<html lang>`, nada passando da largura da tela, axe nos dois temas |

## 5. Lote C: acessibilidade e layout

| Item | Onde | O que mudou |
| --- | --- | --- |
| Letra ampliada | `src/ui/text.tsx`, `tokens.ts` (`maxScale`) | Texto corrido cresce até 200% (WCAG 1.4.4); título até 1,6x e o display até 1,4x. Títulos do topo, do bloco no editor e da sessão quebram em 2 linhas em vez de cortar |
| Contador | `src/ui/fit.ts`, `session-bodies.tsx` | Não cresce com a letra do sistema (já é o maior texto) e diminui para caber numa linha: 120 pixels de "00:45" passavam de uma tela de 320 |
| Anúncio | `session-view.tsx` | Já era só na troca de fase e no fim; agora tem teste que garante que os segundos não são anunciados |
| Alvos de toque | `src/ui/switch.tsx`, editor | Interruptor com área de 48 (o trilho de 32 dependia da folga invisível, que a web não tem); cabeçalho do bloco no editor com 48 (tinha 38) |
| Arrastar | Início, editor | Já tinha alternativa: "Ver todos" no carrossel e mover para cima/baixo pelo "⋯" (D33). Nada novo |
| Movimento reduzido | `src/ui/switch.tsx` | O interruptor animava mesmo com "reduzir animações"; agora vai direto. Transições de tela e avisos já respeitavam |
| Paisagem | `app.config.ts`, `session/room.ts`, `session-view.tsx` | O app gira. A sessão deitada fica em duas colunas: tempo à esquerda, controles à direita, sem rolar. As outras telas rolam e centralizam |
| Tablet | `src/ui/screen.tsx`, `dialog.tsx`, `sheet.tsx` | Conteúdo, rodapé, diálogos e folhas com largura máxima de 640, centralizados (sessão deitada até 1.080) |
| Áreas seguras | `src/ui/screen.tsx` | Bordas laterais respeitadas: deitado, o recorte da câmera fica de lado |

### Decisões do lote C

| # | Decisão | Por quê |
| --- | --- | --- |
| D82 | **Teto de escala por variante, não desligar a escala** | Desligar quebra a WCAG 1.4.4. Texto corrido vai a 200%; o que já nasce grande cresce menos, para não cortar |
| D83 | **Número grande com tamanho calculado pela largura**, além do `adjustsFontSizeToFit` | O ajuste automático só existe no nativo; a conta vale na web e dá o mesmo resultado nos dois |
| D84 | **O app inteiro gira**, sem travar por tela | Travar por tela pede módulo nativo novo. Todas as telas já rolam; só a sessão ganhou layout próprio, que é onde a paisagem ajuda (celular apoiado no chão ou no tripé) |
| D85 | **Alvo de toque medido no E2E**: todo controle visível com 44 x 44 ou mais, em 13 telas | Pegou dois casos que a revisão de código não viu (interruptor e cabeçalho do bloco) |

### Testes do lote C

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `src/ui/fit.test.ts`, `session/room.test.ts` | Tamanho que cabe; colunas e anel por largura e altura (retrato, celular pequeno, tablet, paisagem baixa) |
| Tela | `text.test.tsx`, `screen.test.tsx`, `switch.test.tsx` | Teto por variante; bordas laterais; largura máxima; área de 48 |
| Tela | `session/session-layout.test.tsx` | Anúncio só na troca de fase; paisagem nas três visualizações; girar no meio não perde o tempo; contador com letra 2x numa tela de 320 |
| E2E + axe | `e2e/layout.spec.ts` | Alvos de toque em 13 telas; sessão deitada em 915 x 412 com tempo e controles visíveis sem rolar; tablet 1024 x 1366 centralizado; Foco em 320 x 568 sem estourar |

Pendente de aparelho (vai no APK): letra no máximo do Android e do iPhone, TalkBack e VoiceOver na
sessão, giro real com recorte de câmera.

## 6. Lote D: refinamento pelas imagens-conceito

Método: capturas reais (`capturas/telas.spec.ts`, iPhone 13 na web, 390 x 664, dois temas) lado a
lado com C01b, C02 e C03. Capturas finais em `docs/imagens/capturas/{escuro,claro}/`.

| Tela | Antes | Depois |
| --- | --- | --- |
| Sessão, Anel | Anel verde-escuro sumia no fundo escuro; fase só em texto; nome da rotina ausente; barra e "restante" escondidos sob o rodapé em 664 px | Selo da fase (cor e texto), nome da etapa, anel na cor clara da fase, "de 0:20" dentro do anel, rodada, barra com "0:13 / 4:00" e "−3:48", cartão "Próxima" com a cor da etapa seguinte, nome da rotina no topo. O anel cede à altura: tudo cabe sem rolar |
| Sessão, Lista e Foco | Barras das linhas na cor escura da fase; X escuro sobre a cor da fase | Barras na cor clara; X translúcido como o cadeado |
| Início | "Recentes" em cartões-foto de 184 px; histórico e backup como ícones no topo | "Última rotina" compacta, um toque repete; só a engrenagem no topo; histórico pelo link "Ver histórico"; "Nova rotina" em destaque |
| Ajustes | Só Som e avisos | Som e avisos e Backup e transferência |
| Editor | Etapas em laranja/cinza; sequência inteira sempre aberta; "Salvar e começar" quebrado à esquerda | Etapas nas cores da sessão; sequência atrás de "Ver a sequência (16 etapas)"; rótulo de botão centrado |
| Kit | Faixas horizontais (carrossel, chips do editor) esticavam em tela alta na web | `flexGrow: 0` na faixa |

Estados de salvar, erro, vazio e importado já existiam (botão com carregando/feito, `Notice` de
erro, telas vazias, resumo da importação); a revisão pelas capturas não achou falta.

### Decisões do lote D

| # | Decisão | Por quê |
| --- | --- | --- |
| D86 | **Duas cores por fase**: fundo (texto branco por cima, Foco e selo) e traço (anel, barras, editor), claro no tema escuro | Uma cor só não serve aos dois usos: a que dá contraste ao texto branco some como traço no preto. Teste cobra 3:1 do traço nos dois temas |
| D87 | **Seletor de visualização continua no rodapé** | Subir para o topo liberava altura, mas não cabia com o nome da rotina em 320 px nem nas outras línguas. O anel cede à altura no lugar |
| D88 | **Última rotina, não carrossel de recentes** | Conceito C01b e PRD 06 ("começar em poucos toques"): um cartão, um toque. As outras ficam no histórico, com "Repetir este treino" |
| D89 | **Backup sai da Início para Ajustes** | Uso raro; três ícones redondos no topo eram ruído. Ajustes já é o lugar do "um toque adiante" |
| D90 | **Capturas reais como script versionado** (`playwright.capturas.config.ts`), JPEG 780 px no repositório | Comparar com o conceito vira rotina de cada lote; o lote E reaproveita |

### Testes do lote D

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `theme.test.ts` | Cor de traço de cada fase com 3:1 sobre fundo e superfície, nos dois temas |
| Tela | `home-screen.test.tsx` | Última rotina com Repetir; sem treino, nada dela; backup fora do topo |
| Tela | `editor-screen.test.tsx` | Sequência recolhida, abre e fecha |
| Tela | `session-screen.test.tsx`, `room.test.ts` | Restante no treino pelo rótulo acessível; anel pela altura em 664 e 520 |
| E2E + axe | `backup.spec.ts`, `ajustes.spec.ts`, `sessao.spec.ts` | Backup pelos Ajustes; cabeçalho e progresso novos da sessão |
